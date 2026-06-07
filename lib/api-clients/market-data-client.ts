import axios from 'axios';
import { logger } from '@/lib/utils/logger';
import { retryWithBackoff } from '@/lib/utils/retry';
import { ExternalServiceError, RateLimitError } from '@/lib/utils/errors';
import { getOrSetCache, CACHE_DURATIONS, createCacheKey } from '@/lib/utils/cache';

export interface StockQuote {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  timestamp: string;
  currency: string;
}

export interface IndexData {
  name: string;
  value: number;
  change: number;
  changePercent: number;
  timestamp: string;
}

export interface NewsArticle {
  title: string;
  description?: string;
  url: string;
  source: string;
  publishedAt: string;
  imageUrl?: string;
}

/**
 * Alpha Vantage API Client
 */
export class AlphaVantageClient {
  private readonly SERVICE_NAME = 'ALPHA_VANTAGE';
  private readonly BASE_URL = 'https://www.alphavantage.co/query';
  private readonly API_KEY = process.env.ALPHA_VANTAGE_API_KEY;

  constructor() {
    if (!this.API_KEY) {
      logger.warn(this.SERVICE_NAME, 'ALPHA_VANTAGE_API_KEY not set - market data will be limited');
    }
  }

  /**
   * Get stock quote
   */
  async getStockQuote(symbol: string): Promise<StockQuote> {
    logger.info(this.SERVICE_NAME, 'Fetching stock quote', { symbol });

    const cacheKey = createCacheKey('stock_quote', symbol);

    return getOrSetCache(
      cacheKey,
      async () => {
        return retryWithBackoff(async () => {
          try {
            const response = await axios.get(this.BASE_URL, {
              params: {
                function: 'GLOBAL_QUOTE',
                symbol,
                apikey: this.API_KEY,
              },
              timeout: 10000,
            });

            if (response.data['Error Message']) {
              throw new ExternalServiceError(this.SERVICE_NAME, response.data['Error Message']);
            }

            const quote = response.data['Global Quote'];
            if (!quote || !quote['05. price']) {
              // Return mock data if API fails
              return this.getMockStockQuote(symbol);
            }

            return {
              symbol,
              price: parseFloat(quote['05. price']),
              change: parseFloat(quote['09. change'] || 0),
              changePercent: parseFloat(quote['10. change percent']?.replace('%', '') || 0),
              timestamp: new Date().toISOString(),
              currency: 'USD',
            };
          } catch (error) {
            logger.error(this.SERVICE_NAME, 'Stock quote fetch failed', error);
            // Return mock data as fallback
            return this.getMockStockQuote(symbol);
          }
        });
      },
      CACHE_DURATIONS.MEDIUM
    );
  }

  /**
   * Get forex rate
   */
  async getForexRate(fromCurrency: string, toCurrency: string): Promise<{ rate: number; timestamp: string }> {
    logger.info(this.SERVICE_NAME, 'Fetching forex rate', { fromCurrency, toCurrency });

    const cacheKey = createCacheKey('forex', fromCurrency, toCurrency);

    return getOrSetCache(
      cacheKey,
      async () => {
        return retryWithBackoff(async () => {
          try {
            const response = await axios.get(this.BASE_URL, {
              params: {
                function: 'CURRENCY_EXCHANGE_RATE',
                from_currency: fromCurrency,
                to_currency: toCurrency,
                apikey: this.API_KEY,
              },
              timeout: 10000,
            });

            const data = response.data['Realtime Currency Exchange Rate'];
            if (!data || !data['5. Exchange Rate']) {
              return { rate: 1, timestamp: new Date().toISOString() };
            }

            return {
              rate: parseFloat(data['5. Exchange Rate']),
              timestamp: new Date().toISOString(),
            };
          } catch (error) {
            logger.error(this.SERVICE_NAME, 'Forex rate fetch failed', error);
            return { rate: 1, timestamp: new Date().toISOString() };
          }
        });
      },
      CACHE_DURATIONS.MEDIUM
    );
  }

  private getMockStockQuote(symbol: string): StockQuote {
    const mockPrices: Record<string, number> = {
      'NIFTY': 23150.0,
      'SENSEX': 76430.0,
      'INFY': 2750.0,
      'TCS': 3950.0,
      'RELIANCE': 3087.0,
    };

    const price = mockPrices[symbol] || 100 + Math.random() * 500;
    const change = (Math.random() - 0.5) * 100;

    return {
      symbol,
      price,
      change,
      changePercent: (change / price) * 100,
      timestamp: new Date().toISOString(),
      currency: 'INR',
    };
  }
}

/**
 * Finnhub API Client
 */
export class FinnhubClient {
  private readonly SERVICE_NAME = 'FINNHUB';
  private readonly BASE_URL = 'https://finnhub.io/api/v1';
  private readonly API_KEY = process.env.FINNHUB_API_KEY;

  constructor() {
    if (!this.API_KEY) {
      logger.warn(this.SERVICE_NAME, 'FINNHUB_API_KEY not set - financial data will be limited');
    }
  }

  /**
   * Get company news
   */
  async getNews(category: string = 'general', limit: number = 10): Promise<NewsArticle[]> {
    logger.info(this.SERVICE_NAME, 'Fetching news', { category, limit });

    const cacheKey = createCacheKey('news', category, limit);

    return getOrSetCache(
      cacheKey,
      async () => {
        return retryWithBackoff(async () => {
          try {
            const response = await axios.get(`${this.BASE_URL}/news`, {
              params: {
                category,
                min_id: 0,
              },
              headers: {
                'X-Finnhub-Token': this.API_KEY,
              },
              timeout: 10000,
            });

            if (!Array.isArray(response.data)) {
              return this.getMockNews();
            }

            return response.data.slice(0, limit).map((item: any) => ({
              title: item.headline,
              description: item.summary,
              url: item.url,
              source: item.source,
              publishedAt: new Date(item.datetime * 1000).toISOString(),
              imageUrl: item.image,
            }));
          } catch (error) {
            logger.error(this.SERVICE_NAME, 'News fetch failed', error);
            return this.getMockNews();
          }
        });
      },
      CACHE_DURATIONS.LONG
    );
  }

  private getMockNews(): NewsArticle[] {
    return [
      {
        title: 'GST Rate Adjustment Announced',
        description: 'New GST rates effective from next quarter',
        url: '#',
        source: 'Financial Express',
        publishedAt: new Date().toISOString(),
      },
      {
        title: 'Budget Allocations for SMEs',
        description: 'Government increases budget for small and medium enterprises',
        url: '#',
        source: 'Economic Times',
        publishedAt: new Date(Date.now() - 86400000).toISOString(),
      },
    ];
  }
}

/**
 * News API Client
 */
export class NewsAPIClient {
  private readonly SERVICE_NAME = 'NEWS_API';
  private readonly BASE_URL = 'https://newsapi.org/v2';
  private readonly API_KEY = process.env.NEWS_API_KEY;

  constructor() {
    if (!this.API_KEY) {
      logger.warn(this.SERVICE_NAME, 'NEWS_API_KEY not set - business news will be unavailable');
    }
  }

  /**
   * Get business news
   */
  async getBusinessNews(query: string = 'GST', limit: number = 10): Promise<NewsArticle[]> {
    logger.info(this.SERVICE_NAME, 'Fetching business news', { query, limit });

    const cacheKey = createCacheKey('business_news', query, limit);

    return getOrSetCache(
      cacheKey,
      async () => {
        return retryWithBackoff(async () => {
          try {
            const response = await axios.get(`${this.BASE_URL}/everything`, {
              params: {
                q: query,
                sortBy: 'publishedAt',
                language: 'en',
                pageSize: limit,
              },
              headers: {
                'X-Api-Key': this.API_KEY,
              },
              timeout: 10000,
            });

            if (!response.data.articles) {
              return [];
            }

            return response.data.articles.map((article: any) => ({
              title: article.title,
              description: article.description,
              url: article.url,
              source: article.source.name,
              publishedAt: article.publishedAt,
              imageUrl: article.urlToImage,
            }));
          } catch (error) {
            logger.error(this.SERVICE_NAME, 'Business news fetch failed', error);
            return [];
          }
        });
      },
      CACHE_DURATIONS.LONG
    );
  }

  /**
   * Get tax and compliance news
   */
  async getTaxNews(limit: number = 10): Promise<NewsArticle[]> {
    return this.getBusinessNews('tax GST compliance India', limit);
  }
}

export const alphaVantageClient = new AlphaVantageClient();
export const finnhubClient = new FinnhubClient();
export const newsAPIClient = new NewsAPIClient();
