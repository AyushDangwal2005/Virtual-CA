import { useState, useCallback } from 'react';

interface ApiOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  headers?: Record<string, string>;
  body?: any;
}

export function useBackendApi() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const call = useCallback(
    async <T = any,>(endpoint: string, options: ApiOptions = {}): Promise<T | null> => {
      setLoading(true);
      setError(null);

      try {
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
          ...options.headers,
        };

        // Add user ID from localStorage or session
        const userId = localStorage.getItem('user_id') || sessionStorage.getItem('user_id');
        if (userId) {
          headers['x-user-id'] = userId;
        }

        const response = await fetch(endpoint, {
          method: options.method || 'GET',
          headers,
          body: options.body ? JSON.stringify(options.body) : undefined,
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `API error: ${response.status}`);
        }

        const data = await response.json();

        if (!data.success) {
          throw new Error(data.error || 'API returned error');
        }

        return data.data as T;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        setError(errorMessage);
        console.error('[Backend API] Error:', errorMessage);
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return { call, loading, error };
}

// Specific hooks for common operations
export function useInvoices() {
  const { call, loading, error } = useBackendApi();

  return {
    fetchInvoices: (limit = 50, offset = 0) =>
      call('/api/invoices?limit=' + limit + '&offset=' + offset),
    uploadInvoice: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);

      const userId = localStorage.getItem('user_id') || sessionStorage.getItem('user_id');
      const response = await fetch('/api/invoices', {
        method: 'POST',
        headers: {
          'x-user-id': userId || '',
        },
        body: formData,
      });

      return response.json();
    },
    loading,
    error,
  };
}

export function useAccounting() {
  const { call, loading, error } = useBackendApi();

  return {
    fetchStatements: () => call('/api/accounting?type=statements'),
    fetchTrialBalance: () => call('/api/accounting?type=trial-balance'),
    fetchMetrics: () => call('/api/accounting?type=metrics'),
    loading,
    error,
  };
}

export function useAnalytics() {
  const { call, loading, error } = useBackendApi();

  return {
    fetchAll: () => call('/api/analytics?type=all'),
    fetchInvoices: () => call('/api/analytics?type=invoices'),
    fetchExpenses: () => call('/api/analytics?type=expenses'),
    fetchRevenue: () => call('/api/analytics?type=revenue'),
    fetchGST: () => call('/api/analytics?type=gst'),
    loading,
    error,
  };
}

export function useAIChat() {
  const { call, loading, error } = useBackendApi();

  return {
    fetchHistory: (limit = 50) => call(`/api/ai/chat?limit=${limit}`),
    sendMessage: (message: string, category = 'general') =>
      call('/api/ai/chat', {
        method: 'POST',
        body: { message, category, useRAG: true },
      }),
    loading,
    error,
  };
}

export function useMarketData() {
  const { call, loading, error } = useBackendApi();

  return {
    fetchAll: () => call('/api/market?type=all'),
    fetchIndices: () => call('/api/market?type=indices'),
    fetchNews: (limit = 10) => call(`/api/market?type=news&limit=${limit}`),
    loading,
    error,
  };
}

export function useDashboard() {
  const { call, loading, error } = useBackendApi();

  return {
    fetchDashboard: () => call('/api/dashboard'),
    loading,
    error,
  };
}

export function useCustomers() {
  const { call, loading, error } = useBackendApi();

  return {
    fetchCustomers: (limit = 50, offset = 0) =>
      call(`/api/customers?limit=${limit}&offset=${offset}`),
    addCustomer: (customerData: any) =>
      call('/api/customers', {
        method: 'POST',
        body: customerData,
      }),
    loading,
    error,
  };
}

export function useVendors() {
  const { call, loading, error } = useBackendApi();

  return {
    fetchVendors: (limit = 50, offset = 0) =>
      call(`/api/vendors?limit=${limit}&offset=${offset}`),
    addVendor: (vendorData: any) =>
      call('/api/vendors', {
        method: 'POST',
        body: vendorData,
      }),
    loading,
    error,
  };
}

export function useExpenses() {
  const { call, loading, error } = useBackendApi();

  return {
    fetchExpenses: (limit = 50, offset = 0, category?: string) => {
      let url = `/api/expenses?limit=${limit}&offset=${offset}`;
      if (category) url += `&category=${category}`;
      return call(url);
    },
    addExpense: (expenseData: any) =>
      call('/api/expenses', {
        method: 'POST',
        body: expenseData,
      }),
    loading,
    error,
  };
}
