import { useState, useCallback } from 'react';

interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  statusCode?: number;
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  headers?: Record<string, string>;
  timeout?: number;
}

/**
 * Custom hook for API calls with error handling and loading states
 */
export function useAPI() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const request = useCallback(async <T = any>(endpoint: string, body?: any, options: RequestOptions = {}): Promise<APIResponse<T>> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(endpoint, {
        method: options.method || (body ? 'POST' : 'GET'),
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        body: body ? JSON.stringify(body) : undefined,
        signal: AbortSignal.timeout(options.timeout || 30000),
      });

      const data = await response.json();

      if (!response.ok) {
        const errorMessage = data.message || data.error || 'Request failed';
        setError(errorMessage);
        return {
          success: false,
          error: errorMessage,
          statusCode: response.status,
        };
      }

      return {
        success: true,
        data: data.data || data,
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
      return {
        success: false,
        error: errorMessage,
      };
    } finally {
      setLoading(false);
    }
  }, []);

  return { request, loading, error, setError };
}

/**
 * API service methods
 */
export const apiService = {
  // Documents
  async processDocument(imageBase64: string, documentType: string = 'invoice') {
    const response = await fetch('/api/v1/documents/process', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageBase64, documentType }),
    });
    return response.json();
  },

  // Chat
  async sendChatMessage(message: string, category: string = 'general', includeRag: boolean = true) {
    const response = await fetch('/api/v1/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, category, includeRag }),
    });
    return response.json();
  },

  // Market Data
  async getMarketData(type: string, query?: string) {
    const params = new URLSearchParams();
    params.append('type', type);
    if (query) params.append('query', query);

    const response = await fetch(`/api/v1/market-data?${params}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    return response.json();
  },

  // Insights
  async generateInsights(insightType: string, data: any) {
    const response = await fetch('/api/v1/insights', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ insightType, data }),
    });
    return response.json();
  },

  // Knowledge Base
  async queryKnowledgeBase(query: string) {
    const response = await fetch('/api/v1/knowledge-base', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'query', query }),
    });
    return response.json();
  },

  async searchKnowledgeBase(query: string) {
    const response = await fetch('/api/v1/knowledge-base', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'search', query }),
    });
    return response.json();
  },

  async addToKnowledgeBase(title: string, content: string, category: string, source: string) {
    const response = await fetch('/api/v1/knowledge-base', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'add',
        document: { title, content, category, source },
      }),
    });
    return response.json();
  },

  async initializeKnowledgeBase() {
    const response = await fetch('/api/v1/knowledge-base', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'initialize' }),
    });
    return response.json();
  },

  // Health Check
  async checkHealth() {
    const response = await fetch('/api/v1/health', {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    return response.json();
  },
};
