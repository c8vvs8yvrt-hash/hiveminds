import { ProviderName, AIResponse, Round, UserApiKeys, DiscussionMode, ConfidenceInfo, ModelRole, SourceInfo } from '@/types';
import { MODE_CONFIG, MIN_PROVIDERS_FOR_DISCUSSION } from './constants';
import { callAllProviders, getAvailableProviders } from './providers';
import { getInitialPrompt, getCritiquePrompt } from './prompts';
import { synthesizeConsensus, analyzeConfidence } from './synthesize';
import { getDemoConsensus, getDemoResponse } from './providers/demo';
import { isSimpleQuestion } from './complexity';
import { retrieveSources } from './search';
import { verifyAnswer } from './verify';

export interface RoundtableCallbacks {
  onRoundStart: (round: number) => void;
  onAIResponse: (response: AIResponse) => void;
  onConvergence: (agreed: boolean, round: number) => void;
  onConsensus: (content: string) => void;
  onConfidence: (confidence: ConfidenceInfo) => void;
  onSources: (sources: SourceInfo[]) => void;
  onError: (error: string) => void;
  onDone: () => void;
}

// Assign roles to providers
const ROLE_ASSIGNMENTS: ModelRole[] = ['primary', 'skeptic', 'critic', 'factchecker', 'creative'];

function assignRoles(providers: ProviderName[]): Map<ProviderName, ModelRole> {
  const roles = new Map<ProviderName, ModelRole>();
  providers.forEach((p, i) => {
    roles.set(p, ROLE_ASSIGNMENTS[i % ROLE_ASSIGNMENTS.length]);
  });
  return roles;
}

async function runDemoRoundtable(
  question: string,
  callbacks: RoundtableCallbacks
): Promise<void> {
  const providers: ProviderName[] = ['gemini', 'groq', 'mistral'];
  try {
    callbacks.onRoundStart(1);
    for (const provider of providers) {
      const content = await getDemoResponse(provider, 1, question);
      callbacks.onAIResponse({ provider, content, round: 1, timestamp: Date.now() });
    }
    callbacks.onConvergence(true, 1);
    callbacks.onConfidence({
      level: 'high',
      confidenceScore: 0.85,
      agreementCount: 3,
      totalModels: 3,
      disagreements: [],
      modelScores: [],
      keyDisagreements: [],
      whyThisAnswer: [],
    });
    callbacks.onSources([]);
    await new Promise((resolve) => setTimeout(resolve, 800));
    callbacks.onConsensus(getDemoConsensus(question));
  } catch (error) {
    callbacks.onError(error instanceof Error ? error.message : 'Demo error');
  }
  callbacks.onDone();
}

export async function runRoundtable(
  question: string,
  callbacks: RoundtableCallbacks,
  options: {
    userApiKeys?: UserApiKeys;
    isPaid?: boolean;
    mode?: DiscussionMode;
    images?: { data: string; mimeType: string }[];
    history?: { role: string; content: string }[];
  } = {}
): Promise<void> {
  const { userApiKeys, isPaid = false, mode = 'instant', images, history } = options;
  const config = MODE_CONFIG[mode];

  const allAvailable = getAvailableProviders(userApiKeys, isPaid);
  const providers = config.providers.filter((p) => allAvailable.includes(p));

  console.log(`[HiveMinds] Mode: ${mode} | Providers: ${providers.join(', ')} | Max rounds: ${config.maxRounds}`);

  if (providers.length < MIN_PROVIDERS_FOR_DISCUSSION) {
    return runDemoRoundtable(question, callbacks);
  }

  // Assign roles to each provider
  const roles = assignRoles(providers);
  console.log(`[HiveMinds] Roles: ${providers.map((p) => `${p}=${roles.get(p)}`).join(', ')}`);

  try {
    // === STEP 0: RETRIEVE TRUSTED SOURCES (parallel with nothing — runs first) ===
    console.log('[HiveMinds] Searching for trusted sources...');
    const retrieval = await retrieveSources(question);
    if (retrieval.sources.length > 0) {
      console.log(`[HiveMinds] Found ${retrieval.sources.length} sources (${retrieval.sources.filter(s => s.tier === 1).length} Tier 1)`);
      const sourceInfos: SourceInfo[] = retrieval.sources.map((s) => ({
        title: s.title,
        url: s.url,
        tier: s.tier,
        tierLabel: s.tierLabel,
      }));
      callbacks.onSources(sourceInfos);
    } else {
      console.log('[HiveMinds] No sources found (or search skipped)');
      callbacks.onSources([]);
    }

    // === ROUND 1: ALL AIs answer with their assigned ROLES + SOURCE CONTEXT ===
    callbacks.onRoundStart(1);
    const round1Responses = await callAllProviders(
      providers,
      (provider) => getInitialPrompt(provider, question, history, roles.get(provider), retrieval.sourceContext),
      1,
      userApiKeys,
      (resp) => {
        resp.role = roles.get(resp.provider);
        callbacks.onAIResponse(resp);
      },
      false,
      images
    );

    // Attach roles to responses
    for (const resp of round1Responses) {
      resp.role = roles.get(resp.provider);
    }

    if (round1Responses.length < MIN_PROVIDERS_FOR_DISCUSSION) {
      return runDemoRoundtable(question, callbacks);
    }

    const allRounds: Round[] = [{ number: 1, responses: round1Responses }];

    // === SMART ROUTING: Skip critique for simple questions in instant mode ===
    const skipCritique = mode === 'instant' && isSimpleQuestion(question);
    if (skipCritique) {
      console.log('[HiveMinds] Simple question detected — skipping critique');
      callbacks.onConvergence(true, 1);
    }

    // === ROUND 2: CROSS-CRITIQUE LAYER ===
    if (!skipCritique) {
      const shouldSkipCritique = checkHighAgreement(round1Responses);

      if (shouldSkipCritique) {
        console.log('[HiveMinds] High agreement detected (>90%) — skipping critique for speed');
        callbacks.onConvergence(true, 1);
      } else {
        callbacks.onConvergence(false, 1);
        callbacks.onRoundStart(2);

        const critiqueResponses = await callAllProviders(
          providers,
          (provider) => getCritiquePrompt(provider, question, round1Responses),
          2,
          userApiKeys,
          callbacks.onAIResponse
        );

        if (critiqueResponses.length > 0) {
          allRounds.push({ number: 2, responses: critiqueResponses });
        }

        callbacks.onConvergence(true, 2);
      }
    }

    // === CONFIDENCE ANALYSIS ===
    const confidence = analyzeConfidence(allRounds);
    callbacks.onConfidence(confidence);

    // === FINAL SYNTHESIS: Judge weighs all evidence ===
    let consensus: string;
    try {
      consensus = await synthesizeConsensus(question, allRounds, userApiKeys, history);
    } catch {
      const lastRound = allRounds[allRounds.length - 1];
      consensus = lastRound.responses.map((r) => r.content).join('\n\n');
    }

    // === VERIFICATION PASS: Check claims against sources ===
    if (retrieval.sources.length > 0) {
      try {
        console.log('[HiveMinds] Running verification pass...');
        const verified = await verifyAnswer(consensus, retrieval.sources, userApiKeys);
        consensus = verified.verifiedAnswer;
        console.log('[HiveMinds] Verification complete');
      } catch {
        console.log('[HiveMinds] Verification failed, using unverified answer');
      }
    }

    callbacks.onConsensus(consensus);
  } catch (error) {
    callbacks.onError(error instanceof Error ? error.message : 'An unexpected error occurred');
  }

  callbacks.onDone();
}

/**
 * Check if round 1 responses show very high agreement (>90%).
 */
function checkHighAgreement(responses: AIResponse[]): boolean {
  if (responses.length <= 1) return true;

  const disagreementMarkers = [
    'however', 'but actually', 'that\'s not', 'incorrect', 'wrong',
    'disagree', 'not quite', 'on the contrary', 'debatable',
    'misleading', 'inaccurate', 'false',
  ];

  let disagreementCount = 0;
  for (const resp of responses) {
    const lower = resp.content.toLowerCase();
    if (disagreementMarkers.some((m) => lower.includes(m))) {
      disagreementCount++;
    }
  }

  return disagreementCount / responses.length < 0.1;
}
