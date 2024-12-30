import { useState } from 'react';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { executeCommand } from '../lib/chatCommands';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const CONTEXT = `You are an AI assistant for an asset management application called Fortivo. The application helps users:
- Manage and track physical, financial, and digital assets
- Add beneficiaries for asset inheritance
- Upload and store important documents
- Choose between Free, Pro ($9.99/mo), and Premium ($19.99/mo) subscription tiers

Key features:
- Asset tracking with value estimation
- Document storage and organization
- Beneficiary management
- Secure data encryption
- Multi-factor authentication

You can use the following commands to manage assets and beneficiaries:
- add asset [name] - Add a new asset
- remove asset [name] - Remove an existing asset
- add beneficiary [name] - Add a new beneficiary
- remove beneficiary [name] - Remove an existing beneficiary

Example: "add asset My House" or "remove beneficiary John Doe"

Only answer questions related to using the Fortivo application and its features. For any other questions, politely explain that you can only help with Fortivo-related queries.`;

export function useChat() {
  const [messages, setMessages] = useState<Message[]>([{
    role: 'assistant',
    content: 'Hi! I\'m your Fortivo assistant. How can I help you manage your assets today?'
  }]);
  const [loading, setLoading] = useState(false);

  const sendMessage = async (content: string) => {
    try {
      setLoading(true);
      setMessages(prev => [...prev, { role: 'user', content }]);

      // Check if the message is a command
      if (content.toLowerCase().startsWith('add ') || content.toLowerCase().startsWith('remove ')) {
        const result = await executeCommand(content);
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: result.message
        }]);
        setLoading(false);
        return;
      }

      const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({ model: "gemini-pro" });

      const prompt = `${CONTEXT}\n\nPrevious messages:\n${messages
        .map(msg => `${msg.role}: ${msg.content}`)
        .join('\n')}\n\nUser: ${content}`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      setMessages(prev => [...prev, { role: 'assistant', content: text }]);
    } catch (error) {
      console.error('Chat error:', error);
      if (error instanceof Error) {
        console.error('Error details:', error.message);
      }
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'I apologize, but I\'m having trouble responding right now. Please try again later.'
      }]);
    } finally {
      setLoading(false);
    }
  };

  return {
    messages,
    sendMessage,
    loading,
  };
}