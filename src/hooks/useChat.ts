import { useState, useEffect } from 'react';
import { LLMService, ChatMessage } from '../lib/llm';
import { executeCommand } from '../lib/chatCommands';
import { ALL_TOOLS, executeTool, getToolsContext } from '../lib/chatTools';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const CONTEXT = `You are the official Fortivo AI Assistant, designed to help users manage their wealth and legacy with confidence.

**About Fortivo:**
Fortivo is a comprehensive digital asset and inheritance management platform that empowers individuals and families to organize, protect, and transfer their wealth seamlessly. Our mission is to make legacy planning accessible, secure, and intuitive for everyone.

**Your Role:**
As the Fortivo AI Assistant, you provide expert guidance on:

🏠 **Asset Management**
- Catalog physical assets (real estate, vehicles, jewelry, collectibles)
- Track financial assets (bank accounts, investments, retirement funds)
- Organize digital assets (cryptocurrencies, online accounts, intellectual property)
- Monitor asset values and performance

👨‍👩‍👧‍👦 **Beneficiary & Legacy Planning**
- Add and manage beneficiaries for inheritance planning
- Assign assets to specific beneficiaries
- Track beneficiary contact information and relationships
- Ensure comprehensive legacy distribution

📊 **Portfolio Analytics**
- Generate comprehensive portfolio summaries
- Analyze asset allocation and diversification
- Monitor assignment rates and estate planning progress
- Provide insights into wealth distribution

🔐 **Security & Organization**
- Document storage and management
- Secure data encryption and protection
- Multi-factor authentication guidance
- Privacy and compliance best practices

**Communication Style:**
- Professional yet approachable
- Clear, actionable guidance
- Empathetic to sensitive legacy planning topics
- Focus on empowerment and peace of mind
- Use Fortivo branding and terminology

**Available Tools:**
${getToolsContext()}

**Important Guidelines:**
- Always prioritize user privacy and data security
- Provide step-by-step guidance for complex processes
- Confirm destructive actions (deletions) before proceeding
- Focus exclusively on Fortivo features and capabilities
- For non-Fortivo questions, politely redirect to platform-specific assistance

You represent the Fortivo brand with expertise, trustworthiness, and genuine care for our users' financial well-being and legacy planning needs.`;

export function useChat() {
  const [messages, setMessages] = useState<Message[]>([{
    role: 'assistant',
    content: '# Welcome to Fortivo! 👋\n\nI\'m your dedicated **Fortivo AI Assistant**, here to help you manage your wealth and plan your legacy with confidence.\n\n## What I can help you with:\n\n🏠 **Asset Management** - Track and organize all your assets\n👥 **Beneficiary Planning** - Manage inheritance and legacy distribution\n📊 **Portfolio Analytics** - Get insights into your wealth portfolio\n🔍 **Information & Guidance** - Answer questions about Fortivo features\n\n**Ready to get started?** You can ask me anything about your assets, beneficiaries, or how to use Fortivo effectively. I can also perform actions like adding assets, creating beneficiaries, or generating portfolio summaries.\n\n*How may I assist you with your wealth management today?*'
  }]);
  const [loading, setLoading] = useState(false);
  const [llmService] = useState(() => new LLMService());
  const [connectionStatus, setConnectionStatus] = useState<{
    connected: boolean;
    message: string;
    provider: string;
  }>({ connected: false, message: 'Testing connection...', provider: 'unknown' });
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [loadingModels, setLoadingModels] = useState(false);

  // Test LLM connection on mount and load available models
  useEffect(() => {
    const testConnection = async () => {
      const result = await llmService.testConnection();
      const config = llmService.getConfig();
      setConnectionStatus({
        connected: result.success,
        message: result.message,
        provider: config.provider,
      });

      // Load available Ollama models if using Ollama
      if (config.provider === 'ollama') {
        setLoadingModels(true);
        try {
          const models = await llmService.getAvailableModels();
          setAvailableModels(models);
        } catch (error) {
          console.error('Error loading models:', error);
        } finally {
          setLoadingModels(false);
        }
      }
    };
    testConnection();
  }, [llmService]);

  const sendMessage = async (content: string) => {
    try {
      setLoading(true);
      setMessages(prev => [...prev, { role: 'user', content }]);

      // Check if the message is a legacy command
      if (content.toLowerCase().startsWith('add ') || content.toLowerCase().startsWith('remove ')) {
        const result = await executeCommand(content);
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: result.message
        }]);
        setLoading(false);
        return;
      }

      // Prepare messages for LLM with enhanced context
      const chatMessages: ChatMessage[] = [
        { role: 'system', content: CONTEXT },
        ...messages.map(msg => ({
          role: msg.role as 'user' | 'assistant',
          content: msg.content
        })),
        { role: 'user', content }
      ];

      // Generate response with tool integration
      const result = await llmService.generateResponseWithTools(chatMessages, ALL_TOOLS);
      
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: result.content
      }]);
    } catch (error) {
      console.error('Chat error:', error);
      if (error instanceof Error) {
        console.error('Error details:', error.message);
      }
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: '## I apologize for the inconvenience 🙏\n\nI\'m currently experiencing technical difficulties and cannot process your request. This might be due to:\n\n- **Connection issues** with the AI service\n- **Temporary service disruption**\n- **API limitations**\n\n**Please try again in a few moments.** If the issue persists, you can:\n\n1. Check your internet connection\n2. Switch between Local Ollama and Google Gemini providers using the ⚙️ settings\n3. Contact Fortivo support if needed\n\nThank you for your patience as I work to provide you with the best possible assistance.'
      }]);
    } finally {
      setLoading(false);
    }
  };

  const switchToOllama = async () => {
    llmService.switchProvider('ollama');
    setConnectionStatus({ connected: false, message: 'Switching to Ollama...', provider: 'ollama' });
    
    // Load available models
    setLoadingModels(true);
    try {
      const models = await llmService.getAvailableModels();
      setAvailableModels(models);
    } catch (error) {
      console.error('Error loading models:', error);
    } finally {
      setLoadingModels(false);
    }

    // Re-test connection
    llmService.testConnection().then(result => {
      setConnectionStatus({
        connected: result.success,
        message: result.message,
        provider: 'ollama',
      });
    });
  };

  const switchToGemini = () => {
    llmService.switchProvider('gemini');
    setAvailableModels([]); // Clear models when switching to Gemini
    setConnectionStatus({ connected: false, message: 'Switching to Gemini...', provider: 'gemini' });
    // Re-test connection
    llmService.testConnection().then(result => {
      setConnectionStatus({
        connected: result.success,
        message: result.message,
        provider: 'gemini',
      });
    });
  };

  const changeModel = async (model: string) => {
    llmService.changeModel(model);
    setConnectionStatus({ connected: false, message: 'Switching model...', provider: llmService.getConfig().provider });
    // Re-test connection with new model
    const result = await llmService.testConnection();
    const config = llmService.getConfig();
    setConnectionStatus({
      connected: result.success,
      message: result.message,
      provider: config.provider,
    });
  };

  return {
    messages,
    sendMessage,
    loading,
    connectionStatus,
    switchToOllama,
    switchToGemini,
    changeModel,
    availableModels,
    loadingModels,
    currentModel: llmService.getConfig().model,
  };
}