// LLM service using AWS Bedrock with Claude Sonnet 4.5
export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface LLMResponse {
  content: string;
  error?: string;
  toolCalls?: Array<{
    name: string;
    arguments: any;
  }>;
}

export interface LLMConfig {
  provider: 'bedrock';
  model?: string;
  temperature?: number;
  maxTokens?: number;
  useAgent?: boolean;
  sessionId?: string;
}

const API_BASE_URL = (import.meta.env.VITE_API_URL as string | undefined) || '';

export class LLMService {
  private config: LLMConfig;
  private sessionId: string;

  constructor(config?: Partial<LLMConfig>) {
    this.config = {
      provider: 'bedrock',
      model: 'anthropic.claude-3-5-sonnet-20241022-v2:0',
      temperature: 0.7,
      maxTokens: 4096,
      useAgent: false,
      ...config,
    };

    // Generate a session ID for Bedrock Agents
    this.sessionId = this.generateSessionId();
  }

  private generateSessionId(): string {
    return `session-${Date.now()}-${Math.random().toString(36).substring(7)}`;
  }

  async generateResponse(messages: ChatMessage[]): Promise<LLMResponse> {
    return this.generateResponseWithTools(messages, []);
  }

  async generateResponseWithTools(messages: ChatMessage[], tools: any[]): Promise<LLMResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          messages,
          tools: tools.length > 0 ? tools : undefined,
          useAgent: this.config.useAgent,
          sessionId: this.config.useAgent ? this.sessionId : undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('LLM generation error:', error);
      return {
        content: 'I apologize, but I\'m having trouble responding right now. Please try again later.',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/chat/test`, {
        method: 'GET',
        credentials: 'include',
      });

      if (!response.ok) {
        return {
          success: false,
          message: `Connection test failed: ${response.status} ${response.statusText}`,
        };
      }

      const data = await response.json();
      return data;
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Connection test failed',
      };
    }
  }

  getConfig(): LLMConfig {
    return { ...this.config };
  }

  // Enable/disable Bedrock Agents
  setUseAgent(useAgent: boolean) {
    this.config.useAgent = useAgent;
    if (useAgent) {
      this.sessionId = this.generateSessionId();
    }
  }

  // Get current session ID
  getSessionId(): string {
    return this.sessionId;
  }

  // Reset session (for new conversation)
  resetSession() {
    this.sessionId = this.generateSessionId();
  }

  // Change model (for future use)
  changeModel(model: string) {
    this.config.model = model;
  }
}
