import { useState, useCallback } from 'react';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sources?: Array<{
    title: string;
    category: string;
    referenceUrl?: string;
  }>;
  timestamp: Date;
}

interface UseChatReturn {
  messages: ChatMessage[];
  loading: boolean;
  error: string | null;
  sendMessage: (message: string, category?: string) => Promise<void>;
  clearMessages: () => void;
  loadHistory: () => Promise<void>;
}

export function useAIChat(): UseChatReturn {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get or create user ID
  const getUserId = useCallback(() => {
    if (typeof window === 'undefined') return 'server-user';
    let userId = localStorage.getItem('userId');
    if (!userId) {
      userId = `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('userId', userId);
    }
    return userId;
  }, []);

  // Send message to AI
  const sendMessage = useCallback(
    async (message: string, category: string = 'general') => {
      if (!message.trim()) return;

      setLoading(true);
      setError(null);

      try {
        const userId = getUserId();

        const response = await fetch('/api/ai/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-user-id': userId,
          },
          body: JSON.stringify({
            message: message.trim(),
            category,
            useRAG: true,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || `HTTP ${response.status}`);
        }

        const result = await response.json();

        if (!result.success && result.error) {
          throw new Error(result.error);
        }

        const assistantMessage: ChatMessage = {
          id: Date.now().toString(),
          role: 'assistant',
          content: result.data?.answer || result.answer || 'No response generated',
          sources: result.data?.sources || result.sources || [],
          timestamp: new Date(),
        };

        setMessages((prev) => [...prev, assistantMessage]);
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to send message';
        setError(errorMsg);
        console.error('[AI Chat] Error:', errorMsg);
      } finally {
        setLoading(false);
      }
    },
    [getUserId]
  );

  // Load chat history
  const loadHistory = useCallback(async () => {
    try {
      const userId = getUserId();

      const response = await fetch(`/api/ai/chat?limit=50`, {
        headers: {
          'x-user-id': userId,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const result = await response.json();

      if (result.success && Array.isArray(result.data)) {
        const historyMessages: ChatMessage[] = result.data.map((item: any) => ({
          id: item.id,
          role: 'user' as const,
          content: item.question,
          timestamp: new Date(item.created_at),
        }));

        // Reverse to show oldest first, then interleave responses
        setMessages(historyMessages.reverse());
      }
    } catch (err) {
      console.error('[AI Chat] Error loading history:', err);
    }
  }, [getUserId]);

  const clearMessages = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  return {
    messages,
    loading,
    error,
    sendMessage,
    clearMessages,
    loadHistory,
  };
}
