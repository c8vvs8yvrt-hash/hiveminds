export type ProviderName = 'gemini' | 'groq' | 'mistral' | 'cohere' | 'openrouter' | 'openai';

export interface ProviderConfig {
  name: ProviderName;
  displayName: string;
  color: string;
  emoji: string;
  model: string;
}

export type ModelRole = 'primary' | 'skeptic' | 'critic' | 'factchecker' | 'creative';

export interface AIResponse {
  provider: ProviderName;
  content: string;
  round: number;
  timestamp: number;
  role?: ModelRole;
}

export interface StructuredClaim {
  claim: string;
  supportedBy: string[];  // provider names
  disputedBy: string[];
}

export interface ModelScore {
  provider: string;
  displayName: string;
  accuracy: number;
  reasoning: number;
  completeness: number;
  finalScore: number;
}

export interface Round {
  number: number;
  responses: AIResponse[];
}

export interface ConfidenceInfo {
  level: 'high' | 'medium' | 'low';
  confidenceScore: number;       // 0-1
  agreementCount: number;
  totalModels: number;
  disagreements: string[];
  modelScores: ModelScore[];
  keyDisagreements: string[];
  whyThisAnswer: string[];
}

export interface SourceInfo {
  title: string;
  url: string;
  tier: 1 | 2 | 3;
  tierLabel: string;
}

export interface Discussion {
  id: string;
  question: string;
  rounds: Round[];
  consensus: string | null;
  confidence: ConfidenceInfo | null;
  sources: SourceInfo[];
  convergedAtRound: number | null;
  status: 'discussing' | 'converging' | 'complete' | 'error';
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'hivemind';
  content: string;
  discussion?: Discussion;
  attachments?: Attachment[];
  timestamp: number;
}

export interface UserApiKeys {
  gemini?: string;
  groq?: string;
  mistral?: string;
  cohere?: string;
  openrouter?: string;
  openai?: string;
}

export type DiscussionMode = 'instant' | 'thinking' | 'deep';

export interface Attachment {
  type: 'image' | 'url';
  /** base64 data URL for images, or the URL string for links */
  data: string;
  /** Original filename or URL for display */
  name: string;
  /** MIME type for images */
  mimeType?: string;
}

export type Tier = 'FREE' | 'PRO' | 'MAX';

export interface UsageInfo {
  tier: Tier;
  used: number;
  limit: number;
  resetDate: string;
}

// SSE Event types
export type SSEEventType =
  | 'round_start'
  | 'ai_response'
  | 'convergence'
  | 'confidence'
  | 'sources'
  | 'consensus'
  | 'error'
  | 'done';

export interface SSEEvent {
  type: SSEEventType;
  data: Record<string, unknown>;
}
