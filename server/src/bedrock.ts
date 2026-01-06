import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';
import { BedrockAgentRuntimeClient, InvokeAgentCommand } from '@aws-sdk/client-bedrock-agent-runtime';

const AWS_REGION = process.env.AWS_REGION || 'us-east-1';
const BEDROCK_MODEL_ID = process.env.BEDROCK_MODEL_ID || 'anthropic.claude-3-5-sonnet-20241022-v2:0';
const BEDROCK_AGENT_ID = process.env.BEDROCK_AGENT_ID; // Optional: for Bedrock Agents
const BEDROCK_AGENT_ALIAS_ID = process.env.BEDROCK_AGENT_ALIAS_ID || 'TSTALIASID'; // Optional: for Bedrock Agents

// Initialize Bedrock clients
const bedrockClient = new BedrockRuntimeClient({ region: AWS_REGION });
const bedrockAgentClient = BEDROCK_AGENT_ID 
  ? new BedrockAgentRuntimeClient({ region: AWS_REGION })
  : null;

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface BedrockResponse {
  content: string;
  error?: string;
  toolCalls?: Array<{
    name: string;
    arguments: any;
  }>;
}

/**
 * Generate response using Claude Sonnet 4.5 via Bedrock
 */
export async function generateBedrockResponse(
  messages: ChatMessage[],
  tools?: Array<{
    name: string;
    description: string;
    parameters: any;
  }>
): Promise<BedrockResponse> {
  try {
    // Convert messages to Claude format
    const systemMessages = messages.filter(m => m.role === 'system');
    const conversationMessages = messages.filter(m => m.role !== 'system');
    
    const system = systemMessages.map(m => m.content).join('\n\n');
    
    // Convert to Claude message format
    const claudeMessages = conversationMessages.map(msg => ({
      role: msg.role === 'assistant' ? 'assistant' : 'user',
      content: [{ type: 'text', text: msg.content }]
    }));

    // Convert tools to Claude format if provided
    const claudeTools = tools?.map(tool => ({
      name: tool.name,
      description: tool.description,
      inputSchema: {
        type: 'object',
        properties: tool.parameters?.properties || {},
        required: tool.parameters?.required || []
      }
    }));

    const requestBody: any = {
      anthropic_version: 'bedrock-2023-05-31',
      max_tokens: 4096,
      temperature: 0.7,
      messages: claudeMessages,
    };

    if (system) {
      requestBody.system = system;
    }

    if (claudeTools && claudeTools.length > 0) {
      requestBody.tools = claudeTools;
      requestBody.tool_choice = { type: 'auto' };
    }

    const command = new InvokeModelCommand({
      modelId: BEDROCK_MODEL_ID,
      contentType: 'application/json',
      accept: 'application/json',
      body: JSON.stringify(requestBody),
    });

    const response = await bedrockClient.send(command);
    const responseBody = JSON.parse(new TextDecoder().decode(response.body));

    // Handle tool calls if present
    if (responseBody.stop_reason === 'tool_use' && responseBody.content) {
      const toolCalls = responseBody.content
        .filter((item: any) => item.type === 'tool_use')
        .map((item: any) => ({
          name: item.name,
          arguments: item.input,
          id: item.id
        }));

      // If we have tool calls, we need to execute them and get a follow-up response
      // For now, return the tool calls so the frontend can handle them
      // In a full implementation, you'd execute tools here and make a follow-up call
      return {
        content: '',
        toolCalls
      };
    }

    // Extract text content
    const textContent = responseBody.content
      ?.filter((item: any) => item.type === 'text')
      .map((item: any) => item.text)
      .join('') || '';

    return {
      content: textContent || 'No response generated',
    };
  } catch (error) {
    console.error('Bedrock API error:', error);
    return {
      content: '',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Generate response using Bedrock Agents (if configured)
 */
export async function generateBedrockAgentResponse(
  sessionId: string,
  input: string
): Promise<BedrockResponse> {
  if (!bedrockAgentClient || !BEDROCK_AGENT_ID) {
    throw new Error('Bedrock Agent not configured');
  }

  try {
    const command = new InvokeAgentCommand({
      agentId: BEDROCK_AGENT_ID,
      agentAliasId: BEDROCK_AGENT_ALIAS_ID,
      sessionId,
      inputText: input,
    });

    const response = await bedrockAgentClient.send(command);
    
    // Stream the response
    let content = '';
    for await (const event of response.completion || []) {
      if (event.chunk?.bytes) {
        const chunk = JSON.parse(new TextDecoder().decode(event.chunk.bytes));
        if (chunk.content) {
          content += chunk.content;
        }
      }
    }

    return {
      content: content || 'No response generated',
    };
  } catch (error) {
    console.error('Bedrock Agent API error:', error);
    return {
      content: '',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Test Bedrock connection
 */
export async function testBedrockConnection(): Promise<{ success: boolean; message: string }> {
  try {
    const testResponse = await generateBedrockResponse([
      { role: 'user', content: 'Hello' }
    ]);

    if (testResponse.error) {
      return {
        success: false,
        message: `Bedrock connection failed: ${testResponse.error}`,
      };
    }

    return {
      success: true,
      message: `Bedrock connected successfully with Claude Sonnet 4.5`,
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Connection test failed',
    };
  }
}

