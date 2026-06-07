import pRetry from 'p-retry';

export interface RetryOptions {
  maxAttempts?: number;
  delay?: number;
  backoff?: boolean;
}

const DEFAULT_OPTIONS: RetryOptions = {
  maxAttempts: 3,
  delay: 1000,
  backoff: true,
};

/**
 * Retry a function with exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  return pRetry(fn, {
    retries: (opts.maxAttempts || 3) - 1,
    minTimeout: opts.delay || 1000,
    maxTimeout: 30000,
    backoffBase: 2,
  });
}

/**
 * Retry a function with linear backoff
 */
export async function retryLinear<T>(
  fn: () => Promise<T>,
  maxAttempts: number = 3,
  delayMs: number = 1000
): Promise<T> {
  let lastError: Error | null = null;

  for (let i = 0; i < maxAttempts; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      if (i < maxAttempts - 1) {
        await new Promise((resolve) => setTimeout(resolve, delayMs * (i + 1)));
      }
    }
  }

  throw lastError || new Error('Max retries reached');
}
