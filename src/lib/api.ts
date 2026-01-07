export const API_BASE_URL = (import.meta.env.VITE_API_URL as string | undefined) || '';

// Standardized API response interface
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Standardized error response
interface ApiError {
  success: false;
  error: string;
  message?: string;
  status?: number;
}

function getAuthHeaders(): HeadersInit {
  // JWT auth is handled via httpOnly cookies, no need for manual headers
  return { 'Content-Type': 'application/json' };
}

export async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let errorMessage = `Request failed: ${response.status}`;

    try {
      const errorData = await response.json();
      errorMessage = errorData.error || errorData.message || errorMessage;
    } catch {
      // If we can't parse the error response, use the status text
      errorMessage = response.statusText || errorMessage;
    }

    throw new Error(errorMessage);
  }

  try {
    const data = await response.json();
    return data;
  } catch (error) {
    throw new Error('Invalid JSON response from server');
  }
}

export async function apiGet<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, { 
    headers: getAuthHeaders(), 
    credentials: 'include' 
  });
  
  return handleResponse<T>(response);
}

export async function apiPost<T>(path: string, body: unknown): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(body),
    credentials: 'include',
  });
  
  return handleResponse<T>(response);
}

export async function apiPatch<T>(path: string, body: unknown): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify(body),
    credentials: 'include',
  });
  
  return handleResponse<T>(response);
}

export async function apiDelete(path: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
    credentials: 'include',
  });
  
  if (!response.ok) {
    let errorMessage = `Delete failed: ${response.status}`;
    
    try {
      const errorData = await response.json();
      errorMessage = errorData.error || errorData.message || errorMessage;
    } catch {
      errorMessage = response.statusText || errorMessage;
    }
    
    throw new Error(errorMessage);
  }
}

// Health check function
export async function checkApiHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/health`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    return response.ok;
  } catch {
    return false;
  }
}

// Chat Conversation API functions

export interface ChatConversation {
  id: string;
  userId: string;
  title: string | null;
  createdAt: string;
  updatedAt: string;
  messages?: ChatMessage[];
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  toolCalls?: unknown;
  createdAt: string;
}

export async function getConversations(): Promise<ChatConversation[]> {
  return apiGet<ChatConversation[]>('/api/conversations');
}

export async function createConversation(title?: string): Promise<ChatConversation> {
  return apiPost<ChatConversation>('/api/conversations', { title });
}

export async function getConversation(id: string): Promise<ChatConversation> {
  return apiGet<ChatConversation>(`/api/conversations/${id}`);
}

export async function updateConversation(id: string, title: string): Promise<ChatConversation> {
  return apiPatch<ChatConversation>(`/api/conversations/${id}`, { title });
}

export async function deleteConversation(id: string): Promise<void> {
  return apiDelete(`/api/conversations/${id}`);
}

export async function addMessage(
  conversationId: string,
  role: 'user' | 'assistant' | 'system',
  content: string,
  toolCalls?: unknown
): Promise<ChatMessage> {
  return apiPost<ChatMessage>(`/api/conversations/${conversationId}/messages`, {
    role,
    content,
    toolCalls,
  });
}


