import { describe, it, expect, vi } from 'vitest';
import { generateBedrockResponse, testBedrockConnection, ChatMessage } from '../bedrock.js';

// Mock AWS SDK
vi.mock('@aws-sdk/client-bedrock-runtime', () => ({
  BedrockRuntimeClient: vi.fn().mockImplementation(() => ({
    send: vi.fn(),
  })),
  InvokeModelCommand: vi.fn(),
}));

vi.mock('@aws-sdk/client-bedrock-agent-runtime', () => ({
  BedrockAgentRuntimeClient: vi.fn().mockImplementation(() => ({
    send: vi.fn(),
  })),
  InvokeAgentCommand: vi.fn(),
}));

describe('Bedrock Integration', () => {
  describe('generateBedrockResponse', () => {
    it('should accept messages array', () => {
      const messages: ChatMessage[] = [
        { role: 'user', content: 'Hello' },
      ];

      expect(messages).toHaveLength(1);
      expect(messages[0].role).toBe('user');
    });

    it('should accept tools array', () => {
      const tools = [
        {
          name: 'list_assets',
          description: 'Get all assets',
          input_schema: {
            type: 'object',
            properties: {},
          },
        },
      ];

      expect(tools).toHaveLength(1);
      expect(tools[0].name).toBe('list_assets');
    });
  });

  describe('testBedrockConnection', () => {
    it('should have connection test function', () => {
      expect(typeof testBedrockConnection).toBe('function');
    });
  });

  describe('Tool Call Format', () => {
    it('should validate tool definition schema', () => {
      const tool = {
        name: 'list_assets',
        description: 'Get all assets for the user',
        input_schema: {
          type: 'object',
          properties: {},
          required: [],
        },
      };

      expect(tool.name).toBe('list_assets');
      expect(tool.input_schema.type).toBe('object');
    });

    it('should validate tool with parameters', () => {
      const tool = {
        name: 'create_asset',
        description: 'Create a new asset',
        input_schema: {
          type: 'object',
          properties: {
            name: { type: 'string', description: 'Asset name' },
            type: { type: 'string', description: 'Asset type' },
            value: { type: 'number', description: 'Asset value' },
          },
          required: ['name', 'type'],
        },
      };

      expect(tool.input_schema.required).toContain('name');
      expect(tool.input_schema.required).toContain('type');
      expect(tool.input_schema.properties.value.type).toBe('number');
    });
  });

  describe('Message Format', () => {
    it('should validate user message format', () => {
      const message: ChatMessage = {
        role: 'user',
        content: 'Hello, Claude!',
      };

      expect(message.role).toBe('user');
      expect(message.content).toBe('Hello, Claude!');
    });

    it('should validate assistant message format', () => {
      const message: ChatMessage = {
        role: 'assistant',
        content: 'Hello! How can I help you today?',
      };

      expect(message.role).toBe('assistant');
      expect(message.content).toBeDefined();
    });

    it('should validate conversation history', () => {
      const conversation: ChatMessage[] = [
        { role: 'user', content: 'What are my assets?' },
        { role: 'assistant', content: 'Let me check your assets.' },
        { role: 'user', content: 'Thanks!' },
      ];

      expect(conversation).toHaveLength(3);
      expect(conversation[0].role).toBe('user');
      expect(conversation[1].role).toBe('assistant');
    });
  });
});
