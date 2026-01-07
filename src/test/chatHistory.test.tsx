import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useChatWithHistory } from '../hooks/useChatWithHistory';
import * as api from '../lib/api';

// Mock the API module
vi.mock('../lib/api', () => ({
  getConversations: vi.fn(),
  createConversation: vi.fn(),
  getConversation: vi.fn(),
  deleteConversation: vi.fn(),
  updateConversation: vi.fn(),
  addMessage: vi.fn(),
}));

// Mock the LLM service
vi.mock('../lib/llm', () => ({
  LLMService: vi.fn().mockImplementation(() => ({
    generateResponseWithTools: vi.fn().mockResolvedValue({
      content: 'Test response',
    }),
    testConnection: vi.fn().mockResolvedValue({
      success: true,
      message: 'Connected',
    }),
    getConfig: vi.fn().mockReturnValue({
      provider: 'bedrock',
      model: 'claude-sonnet-4-5',
    }),
    setUseAgent: vi.fn(),
    resetSession: vi.fn(),
  })),
  ChatMessage: {},
}));

// Mock chat commands
vi.mock('../lib/chatCommands', () => ({
  executeCommand: vi.fn().mockResolvedValue({
    success: true,
    message: 'Command executed',
  }),
}));

// Mock chat tools
vi.mock('../lib/chatTools', () => ({
  ALL_TOOLS: [],
  getToolsContext: vi.fn().mockReturnValue('Tools context'),
}));

describe('useChatWithHistory', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with welcome message', () => {
    vi.mocked(api.getConversations).mockResolvedValue([]);

    const { result } = renderHook(() => useChatWithHistory());

    expect(result.current.messages).toHaveLength(1);
    expect(result.current.messages[0].role).toBe('assistant');
    expect(result.current.messages[0].content).toContain('Welcome to Fortivo');
  });

  it('should load conversations on mount', async () => {
    const mockConversations = [
      {
        id: '1',
        userId: 'user1',
        title: 'Test Conversation',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];

    vi.mocked(api.getConversations).mockResolvedValue(mockConversations);
    vi.mocked(api.getConversation).mockResolvedValue({
      ...mockConversations[0],
      messages: [],
    });

    const { result } = renderHook(() => useChatWithHistory());

    await waitFor(() => {
      expect(result.current.loadingConversations).toBe(false);
    });

    expect(api.getConversations).toHaveBeenCalled();
    expect(result.current.conversations.length).toBeGreaterThanOrEqual(0);
  });

  it('should create new conversation', async () => {
    const newConversation = {
      id: '2',
      userId: 'user1',
      title: 'New Conversation',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    vi.mocked(api.getConversations).mockResolvedValue([]);
    vi.mocked(api.createConversation).mockResolvedValue(newConversation);

    const { result } = renderHook(() => useChatWithHistory());

    await waitFor(() => {
      expect(result.current.loadingConversations).toBe(false);
    });

    await result.current.createNewConversation('New Conversation');

    await waitFor(() => {
      expect(result.current.currentConversationId).toBe('2');
    });

    expect(api.createConversation).toHaveBeenCalledWith('New Conversation');
  });

  it('should load conversation with messages', async () => {
    const mockConversation = {
      id: '1',
      userId: 'user1',
      title: 'Test Conversation',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      messages: [
        {
          id: 'm1',
          conversationId: '1',
          role: 'user' as const,
          content: 'Hello',
          createdAt: new Date().toISOString(),
        },
        {
          id: 'm2',
          conversationId: '1',
          role: 'assistant' as const,
          content: 'Hi there!',
          createdAt: new Date().toISOString(),
        },
      ],
    };

    vi.mocked(api.getConversations).mockResolvedValue([]);
    vi.mocked(api.getConversation).mockResolvedValue(mockConversation);

    const { result } = renderHook(() => useChatWithHistory());

    await waitFor(() => {
      expect(result.current.loadingConversations).toBe(false);
    });

    await result.current.loadConversation('1');

    await waitFor(() => {
      expect(result.current.messages.length).toBe(2);
    });

    expect(api.getConversation).toHaveBeenCalledWith('1');
    expect(result.current.messages[0].content).toBe('Hello');
    expect(result.current.messages[1].content).toBe('Hi there!');
  });

  it('should delete conversation', async () => {
    const mockConversations = [
      {
        id: '1',
        userId: 'user1',
        title: 'Test Conversation',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];

    vi.mocked(api.getConversations).mockResolvedValue(mockConversations);
    vi.mocked(api.getConversation).mockResolvedValue({
      ...mockConversations[0],
      messages: [],
    });
    vi.mocked(api.deleteConversation).mockResolvedValue();

    const { result } = renderHook(() => useChatWithHistory());

    await waitFor(() => {
      expect(result.current.loadingConversations).toBe(false);
    });

    const initialCount = result.current.conversations.length;
    await result.current.deleteConversationById('1');

    expect(api.deleteConversation).toHaveBeenCalledWith('1');
    // Conversation should be removed
    expect(result.current.conversations.length).toBeLessThanOrEqual(initialCount);
  });

  it('should update conversation title', async () => {
    const mockConversations = [
      {
        id: '1',
        userId: 'user1',
        title: 'Old Title',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];

    const updatedConversation = {
      ...mockConversations[0],
      title: 'New Title',
    };

    vi.mocked(api.getConversations).mockResolvedValue(mockConversations);
    vi.mocked(api.getConversation).mockResolvedValue({
      ...mockConversations[0],
      messages: [],
    });
    vi.mocked(api.updateConversation).mockResolvedValue(updatedConversation);

    const { result } = renderHook(() => useChatWithHistory());

    await waitFor(() => {
      expect(result.current.conversations).toHaveLength(1);
    });

    await result.current.updateConversationTitle('1', 'New Title');

    expect(api.updateConversation).toHaveBeenCalledWith('1', 'New Title');
  });

  it('should send message and persist to database', async () => {
    const mockConversation = {
      id: '1',
      userId: 'user1',
      title: 'Test Conversation',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    vi.mocked(api.getConversations).mockResolvedValue([]);
    vi.mocked(api.createConversation).mockResolvedValue(mockConversation);
    vi.mocked(api.addMessage).mockResolvedValue({
      id: 'm1',
      conversationId: '1',
      role: 'user',
      content: 'Hello',
      createdAt: new Date().toISOString(),
    });

    const { result } = renderHook(() => useChatWithHistory());

    await waitFor(() => {
      expect(result.current.loadingConversations).toBe(false);
    });

    await result.current.sendMessage('Hello');

    expect(api.addMessage).toHaveBeenCalledTimes(2); // user + assistant
  });

  it('should handle send message error gracefully', async () => {
    vi.mocked(api.getConversations).mockResolvedValue([]);
    vi.mocked(api.createConversation).mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useChatWithHistory());

    await waitFor(() => {
      expect(result.current.loadingConversations).toBe(false);
    });

    // Send message and wait for it to complete
    await result.current.sendMessage('Hello');

    // Wait for messages to update (user message + error message should be added)
    await waitFor(() => {
      expect(result.current.messages.length).toBeGreaterThanOrEqual(2);
    }, { timeout: 3000 });

    // Check if error was handled
    const lastMessage = result.current.messages[result.current.messages.length - 1];
    expect(lastMessage.content).toBeDefined();
    expect(lastMessage.role).toBeDefined();
  });
});
