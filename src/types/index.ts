export type ProviderName = 'gemini' | 'groq' | 'mistral' | 'cohere' | 'openrouter';

export interface ProviderConfig {
  name: ProviderName;
  displayName: string;
  color: string;
  emoji: string;
  model: string;
}

export interface AIResponse {
  provider: ProviderName;
  content: string;
  round: number;
  timestamp: number;
}

export interface Round {
  number: number;
  responses: AIResponse[];
}

export interface Discussion {
  id: string;
  question: string;
  rounds: Round[];
  consensus: string | null;
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
  | 'consensus'
  | 'error'
  | 'done';

export interface SSEEvent {
  type: SSEEventType;
  data: Record<string, unknown>;
}
