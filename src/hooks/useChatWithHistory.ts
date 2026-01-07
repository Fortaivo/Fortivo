import { useState, useEffect, useCallback } from 'react';
import { LLMService, ChatMessage as LLMMessage } from '../lib/llm';
import { executeCommand } from '../lib/chatCommands';
import { ALL_TOOLS, getToolsContext } from '../lib/chatTools';
import {
  ChatConversation,
  ChatMessage,
  getConversations,
  createConversation,
  getConversation,
  deleteConversation,
  updateConversation,
  addMessage,
} from '../lib/api';

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

const WELCOME_MESSAGE: Message = {
  role: 'assistant',
  content: '# Welcome to Fortivo! 👋\n\nI\'m your dedicated **Fortivo AI Assistant**, here to help you manage your wealth and plan your legacy with confidence.\n\n## What I can help you with:\n\n🏠 **Asset Management** - Track and organize all your assets\n👥 **Beneficiary Planning** - Manage inheritance and legacy distribution\n📊 **Portfolio Analytics** - Get insights into your wealth portfolio\n🔍 **Information & Guidance** - Answer questions about Fortivo features\n\n**Ready to get started?** You can ask me anything about your assets, beneficiaries, or how to use Fortivo effectively. I can also perform actions like adding assets, creating beneficiaries, or generating portfolio summaries.\n\n*How may I assist you with your wealth management today?*'
};

export function useChatWithHistory() {
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([WELCOME_MESSAGE]);
  const [loading, setLoading] = useState(false);
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [llmService] = useState(() => new LLMService());
  const [connectionStatus, setConnectionStatus] = useState<{
    connected: boolean;
    message: string;
    provider: string;
  }>({ connected: false, message: 'Testing connection...', provider: 'bedrock' });
  const [useAgent, setUseAgent] = useState(false);

  // Load conversations on mount
  useEffect(() => {
    loadConversations();
  }, []);

  // Test LLM connection on mount
  useEffect(() => {
    const testConnection = async () => {
      const result = await llmService.testConnection();
      const config = llmService.getConfig();
      setConnectionStatus({
        connected: result.success,
        message: result.message,
        provider: config.provider || 'bedrock',
      });
    };
    testConnection();
  }, [llmService]);

  const loadConversations = async () => {
    try {
      setLoadingConversations(true);
      const convos = await getConversations();
      setConversations(convos);

      // If there's at least one conversation, load the most recent one
      if (convos.length > 0 && !currentConversationId) {
        await loadConversation(convos[0].id);
      }
    } catch (error) {
      console.error('Failed to load conversations:', error);
    } finally {
      setLoadingConversations(false);
    }
  };

  const loadConversation = async (conversationId: string) => {
    try {
      const conversation = await getConversation(conversationId);
      setCurrentConversationId(conversationId);

      // Convert API messages to UI messages
      if (conversation.messages && conversation.messages.length > 0) {
        const uiMessages = conversation.messages
          .filter(msg => msg.role !== 'system')
          .map(msg => ({
            role: msg.role as 'user' | 'assistant',
            content: msg.content,
          }));
        setMessages(uiMessages);
      } else {
        setMessages([WELCOME_MESSAGE]);
      }
    } catch (error) {
      console.error('Failed to load conversation:', error);
    }
  };

  const createNewConversation = async (title?: string) => {
    try {
      const conversation = await createConversation(title || 'New Conversation');
      setConversations(prev => [conversation, ...prev]);
      setCurrentConversationId(conversation.id);
      setMessages([WELCOME_MESSAGE]);
      return conversation;
    } catch (error) {
      console.error('Failed to create conversation:', error);
      throw error;
    }
  };

  const deleteConversationById = async (conversationId: string) => {
    try {
      await deleteConversation(conversationId);
      setConversations(prev => prev.filter(c => c.id !== conversationId));

      // If we deleted the current conversation, reset
      if (conversationId === currentConversationId) {
        setCurrentConversationId(null);
        setMessages([WELCOME_MESSAGE]);
      }
    } catch (error) {
      console.error('Failed to delete conversation:', error);
      throw error;
    }
  };

  const updateConversationTitle = async (conversationId: string, title: string) => {
    try {
      const updated = await updateConversation(conversationId, title);
      setConversations(prev => prev.map(c => c.id === conversationId ? updated : c));
    } catch (error) {
      console.error('Failed to update conversation title:', error);
      throw error;
    }
  };

  const persistMessage = async (role: 'user' | 'assistant', content: string) => {
    if (!currentConversationId) {
      // Create a new conversation if none exists
      const conversation = await createNewConversation();
      await addMessage(conversation.id, role, content);
    } else {
      await addMessage(currentConversationId, role, content);
    }
  };

  const sendMessage = async (content: string) => {
    try {
      setLoading(true);
      const userMessage: Message = { role: 'user', content };
      setMessages(prev => [...prev, userMessage]);

      // Persist user message
      await persistMessage('user', content);

      // Check if the message is a legacy command
      if (content.toLowerCase().startsWith('add ') || content.toLowerCase().startsWith('remove ')) {
        const result = await executeCommand(content);
        const assistantMessage: Message = {
          role: 'assistant',
          content: result.message
        };
        setMessages(prev => [...prev, assistantMessage]);
        await persistMessage('assistant', result.message);
        setLoading(false);
        return;
      }

      // Prepare messages for LLM with enhanced context
      const chatMessages: LLMMessage[] = [
        { role: 'system', content: CONTEXT },
        ...messages.map(msg => ({
          role: msg.role as 'user' | 'assistant',
          content: msg.content
        })),
        { role: 'user', content }
      ];

      // Generate response with tool integration
      const result = await llmService.generateResponseWithTools(chatMessages, ALL_TOOLS);

      const assistantMessage: Message = {
        role: 'assistant',
        content: result.content
      };
      setMessages(prev => [...prev, assistantMessage]);

      // Persist assistant message
      await persistMessage('assistant', result.content);

      // Update conversation title if this is the first user message
      if (messages.length <= 1 && currentConversationId) {
        // Auto-generate title from first message (first 50 chars)
        const autoTitle = content.slice(0, 50) + (content.length > 50 ? '...' : '');
        await updateConversationTitle(currentConversationId, autoTitle);
      }
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage: Message = {
        role: 'assistant',
        content: '## I apologize for the inconvenience 🙏\n\nI\'m currently experiencing technical difficulties and cannot process your request. This might be due to:\n\n- **Connection issues** with AWS Bedrock\n- **Temporary service disruption**\n- **API limitations**\n\n**Please try again in a few moments.** If the issue persists, you can:\n\n1. Check your internet connection\n2. Contact Fortivo support if needed\n\nThank you for your patience as I work to provide you with the best possible assistance.'
      };
      setMessages(prev => [...prev, errorMessage]);

      try {
        await persistMessage('assistant', errorMessage.content);
      } catch (persistError) {
        console.error('Failed to persist error message:', persistError);
      }
    } finally {
      setLoading(false);
    }
  };

  const toggleAgent = async () => {
    const newUseAgent = !useAgent;
    setUseAgent(newUseAgent);
    llmService.setUseAgent(newUseAgent);

    setConnectionStatus({
      connected: false,
      message: newUseAgent ? 'Enabling Bedrock Agents...' : 'Disabling Bedrock Agents...',
      provider: 'bedrock'
    });

    // Re-test connection
    const result = await llmService.testConnection();
    setConnectionStatus({
      connected: result.success,
      message: result.message,
      provider: 'bedrock',
    });
  };

  const resetSession = () => {
    llmService.resetSession();
  };

  return {
    // Messages
    messages,
    sendMessage,
    loading,

    // Conversations
    conversations,
    currentConversationId,
    loadingConversations,
    loadConversation,
    createNewConversation,
    deleteConversationById,
    updateConversationTitle,
    loadConversations,

    // Connection
    connectionStatus,
    useAgent,
    toggleAgent,
    resetSession,
    currentModel: llmService.getConfig().model || 'Claude Sonnet 4.5',
  };
}
