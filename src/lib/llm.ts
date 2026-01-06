// LLM service that supports both Google Gemini and local Ollama
import { GoogleGenerativeAI } from '@google/generative-ai';

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface LLMResponse {
  content: string;
  error?: string;
}

export interface LLMConfig {
  provider: 'gemini' | 'ollama';
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

// Default configurations
const DEFAULT_CONFIGS: Record<string, LLMConfig> = {
  gemini: {
    provider: 'gemini',
    model: 'gemini-pro',
    temperature: 0.7,
  },
  ollama: {
    provider: 'ollama',
    model: 'qwen3:0.6b',
    temperature: 0.7,
    maxTokens: 2048,
  },
};

export class LLMService {
  private config: LLMConfig;
  private geminiClient?: GoogleGenerativeAI;
  private ollamaBaseUrl: string;

  constructor(config?: Partial<LLMConfig>) {
    // Determine which provider to use based on environment
    const useOllama = import.meta.env.VITE_USE_LOCAL_LLM === 'true';
    const defaultProvider = useOllama ? 'ollama' : 'gemini';
    
    this.config = {
      ...DEFAULT_CONFIGS[defaultProvider],
      ...config,
    };

    this.ollamaBaseUrl = import.meta.env.VITE_OLLAMA_URL || 'http://localhost:11434';

    if (this.config.provider === 'gemini') {
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      if (!apiKey) {
        console.warn('VITE_GEMINI_API_KEY not found, Gemini will not work');
      } else {
        this.geminiClient = new GoogleGenerativeAI(apiKey);
      }
    }
  }

  async generateResponse(messages: ChatMessage[]): Promise<LLMResponse> {
    try {
      if (this.config.provider === 'ollama') {
        return await this.generateWithOllama(messages);
      } else {
        return await this.generateWithGemini(messages);
      }
    } catch (error) {
      console.error('LLM generation error:', error);
      return {
        content: 'I apologize, but I\'m having trouble responding right now. Please try again later.',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // Generate response with tool integration
  async generateResponseWithTools(messages: ChatMessage[], tools: any[]): Promise<LLMResponse> {
    try {
      if (this.config.provider === 'ollama') {
        return await this.generateWithOllamaTools(messages, tools);
      } else {
        // Gemini doesn't support tool calling in this implementation
        // Fall back to regular generation with tool context in prompt
        return await this.generateResponse(messages);
      }
    } catch (error) {
      console.error('Tool-enhanced generation error:', error);
      return {
        content: 'I apologize, but I\'m having trouble responding right now. Please try again later.',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  private async generateWithOllamaTools(messages: ChatMessage[], tools: any[]): Promise<LLMResponse> {
    // Try with tools first, fall back to regular chat if tools aren't supported
    try {
      // Convert tools to Ollama format
      const ollamaTools = tools.map(tool => ({
        type: 'function',
        function: {
          name: tool.name,
          description: tool.description,
          parameters: tool.parameters
        }
      }));

      // Initial request with tools
      const response = await fetch(`${this.ollamaBaseUrl}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: this.config.model,
          messages: messages.map(msg => ({
            role: msg.role,
            content: msg.content,
          })),
          stream: false,
          tools: ollamaTools,
          options: {
            temperature: this.config.temperature,
            num_predict: this.config.maxTokens,
          },
        }),
      });

      // If tools aren't supported (400 error), fall back to regular chat
      if (response.status === 400) {
        console.warn('Model does not support tool calling, falling back to regular chat');
        return await this.generateWithOllama(messages);
      }

      if (!response.ok) {
        throw new Error(`Ollama API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      if (data.error) {
        throw new Error(`Ollama error: ${data.error}`);
      }

      // Check if the model wants to call a tool
      if (data.message?.tool_calls && data.message.tool_calls.length > 0) {
        const toolCalls = data.message.tool_calls;
        const toolResults = [];

        // Execute each tool call
        for (const toolCall of toolCalls) {
          const tool = tools.find((t: any) => t.name === toolCall.function.name);
          if (tool) {
            try {
              const result = await tool.execute(toolCall.function.arguments);
              toolResults.push({
                tool_call_id: toolCall.id || toolCall.function.name,
                role: 'tool',
                name: toolCall.function.name,
                content: JSON.stringify(result)
              });
            } catch (error) {
              toolResults.push({
                tool_call_id: toolCall.id || toolCall.function.name,
                role: 'tool',
                name: toolCall.function.name,
                content: JSON.stringify({
                  success: false,
                  error: error instanceof Error ? error.message : 'Unknown error'
                })
              });
            }
          }
        }

        // Send tool results back to model for final response
        const followUpMessages = [
          ...messages.map(msg => ({
            role: msg.role,
            content: msg.content,
          })),
          {
            role: 'assistant',
            content: data.message.content || '',
            tool_calls: toolCalls
          },
          ...toolResults
        ];

        const followUpResponse = await fetch(`${this.ollamaBaseUrl}/api/chat`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: this.config.model,
            messages: followUpMessages,
            stream: false,
            options: {
              temperature: this.config.temperature,
              num_predict: this.config.maxTokens,
            },
          }),
        });

        if (!followUpResponse.ok) {
          throw new Error(`Ollama API error: ${followUpResponse.status} ${followUpResponse.statusText}`);
        }

        const followUpData = await followUpResponse.json();
        return {
          content: followUpData.message?.content || 'No response generated',
        };
      }

      // No tool calls, return the response directly
      return {
        content: data.message?.content || 'No response generated',
      };
    } catch (error) {
      console.warn('Tool calling failed, falling back to regular chat:', error);
      return await this.generateWithOllama(messages);
    }
  }

  private async generateWithOllama(messages: ChatMessage[]): Promise<LLMResponse> {
    const response = await fetch(`${this.ollamaBaseUrl}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: this.config.model,
        messages: messages.map(msg => ({
          role: msg.role,
          content: msg.content,
        })),
        stream: false,
        options: {
          temperature: this.config.temperature,
          num_predict: this.config.maxTokens,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    if (data.error) {
      throw new Error(`Ollama error: ${data.error}`);
    }

    return {
      content: data.message?.content || 'No response generated',
    };
  }

  private async generateWithGemini(messages: ChatMessage[]): Promise<LLMResponse> {
    if (!this.geminiClient) {
      throw new Error('Gemini client not initialized. Check your API key.');
    }

    const model = this.geminiClient.getGenerativeModel({ 
      model: this.config.model || 'gemini-pro' 
    });

    // Convert messages to Gemini format
    const prompt = messages
      .map(msg => `${msg.role}: ${msg.content}`)
      .join('\n');

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    return {
      content: text,
    };
  }

  // Test connection to the LLM service
  async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      if (this.config.provider === 'ollama') {
        const response = await fetch(`${this.ollamaBaseUrl}/api/tags`, {
          method: 'GET',
        });
        
        if (!response.ok) {
          return {
            success: false,
            message: `Ollama service not available at ${this.ollamaBaseUrl}`,
          };
        }

        const data = await response.json();
        const hasModel = data.models?.some((model: any) => 
          model.name.includes(this.config.model?.split(':')[0] || 'gemma')
        );

        if (!hasModel) {
          return {
            success: false,
            message: `Model ${this.config.model} not found. Run the setup script to download it.`,
          };
        }

        return {
          success: true,
          message: `Ollama connected successfully with model ${this.config.model}`,
        };
      } else {
        // Test Gemini connection with a simple request
        const testResponse = await this.generateWithGemini([
          { role: 'user', content: 'Hello' }
        ]);
        
        return {
          success: true,
          message: 'Gemini API connected successfully',
        };
      }
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Connection test failed',
      };
    }
  }

  // Get current configuration
  getConfig(): LLMConfig {
    return { ...this.config };
  }

  // Switch provider at runtime
  switchProvider(provider: 'gemini' | 'ollama', model?: string) {
    this.config = {
      ...DEFAULT_CONFIGS[provider],
      model: model || DEFAULT_CONFIGS[provider].model,
    };

    if (provider === 'gemini' && !this.geminiClient) {
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      if (apiKey) {
        this.geminiClient = new GoogleGenerativeAI(apiKey);
      }
    }
  }

  // Change model at runtime (for same provider)
  changeModel(model: string) {
    this.config.model = model;
  }

  // Get available Ollama models
  async getAvailableModels(): Promise<string[]> {
    try {
      const response = await fetch(`${this.ollamaBaseUrl}/api/tags`, {
        method: 'GET',
      });
      
      if (!response.ok) {
        return [];
      }

      const data = await response.json();
      return data.models?.map((model: any) => model.name) || [];
    } catch (error) {
      console.error('Error fetching Ollama models:', error);
      return [];
    }
  }
}