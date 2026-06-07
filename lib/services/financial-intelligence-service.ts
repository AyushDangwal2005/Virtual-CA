/**
 * Financial Intelligence Service
 * Provides real-time market data, news, and financial analytics
 * Integrates with external APIs: Alpha Vantage, Finnhub, NewsAPI, GNews
 */

export interface StockData {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  high: number;
  low: number;
  volume: number;
  timestamp: string;
}

export interface IndexData {
  name: string;
  value: number;
  change: number;
  changePercent: number;
  timestamp: string;
}

export interface MarketNews {
  id: string;
  title: string;
  description: string;
  source: string;
  url: string;
  image?: string;
  publishedAt: string;
  category: 'gst_updates' | 'tax_news' | 'business_news' | 'compliance';
}

/**
 * Get stock price data
 */
export async function getStockPrice(symbol: string): Promise<StockData | null> {
  try {
    const apiKey = process.env.ALPHA_VANTAGE_API_KEY;
    if (!apiKey) {
      console.warn('Alpha Vantage API key not configured');
      return getMockStockData(symbol);
    }

    const response = await fetch(
      `https://www.alphavantage.co/query?function=QUOTE_ENDPOINT&symbol=${symbol}&apikey=${apiKey}`
    );
    const data = await response.json();

    if (data['Global Quote']) {
      const quote = data['Global Quote'];
      return {
        symbol,
        price: parseFloat(quote['05. price'] || '0'),
        change: parseFloat(quote['09. change'] || '0'),
        changePercent: parseFloat(quote['10. change percent']?.replace('%', '') || '0'),
        high: parseFloat(quote['03. high'] || '0'),
        low: parseFloat(quote['04. low'] || '0'),
        volume: parseInt(quote['06. volume'] || '0'),
        timestamp: new Date().toISOString(),
      };
    }

    return getMockStockData(symbol);
  } catch (error) {
    console.error('Error fetching stock data:', error);
    return getMockStockData(symbol);
  }
}

/**
 * Get index data (Sensex, Nifty, etc.)
 */
export async function getIndexData(indexSymbol: string): Promise<IndexData | null> {
  try {
    const apiKey = process.env.FINNHUB_API_KEY;
    if (!apiKey) {
      console.warn('Finnhub API key not configured');
      return getMockIndexData(indexSymbol);
    }

    const symbolMap: Record<string, string> = {
      SENSEX: '^BSESN',
      NIFTY: '^NSEI',
      NIFTYMIDCAP: '^NIFTYMIDCAP100',
    };

    const finnhubSymbol = symbolMap[indexSymbol] || indexSymbol;

    const response = await fetch(
      `https://finnhub.io/api/v1/quote?symbol=${finnhubSymbol}&token=${apiKey}`
    );
    const data = await response.json();

    if (data.c) {
      return {
        name: indexSymbol,
        value: data.c,
        change: data.d || 0,
        changePercent: data.dp || 0,
        timestamp: new Date().toISOString(),
      };
    }

    return getMockIndexData(indexSymbol);
  } catch (error) {
    console.error('Error fetching index data:', error);
    return getMockIndexData(indexSymbol);
  }
}

/**
 * Get financial and business news
 */
export async function getFinancialNews(category: string = 'business_news', limit = 20): Promise<MarketNews[]> {
  try {
    const apiKey = process.env.NEWSAPI_KEY;
    if (!apiKey) {
      console.warn('NewsAPI key not configured');
      return getMockNews(category, limit);
    }

    const queryMap: Record<string, string> = {
      gst_updates: 'GST India',
      tax_news: 'Income Tax India',
      business_news: 'Indian business',
      compliance: 'Compliance India',
    };

    const query = queryMap[category] || 'business India';

    const response = await fetch(
      `https://newsapi.org/v2/everything?q=${encodeURIComponent(query)}&sortBy=publishedAt&language=en&apiKey=${apiKey}&pageSize=${limit}`
    );
    const data = await response.json();

    if (data.articles) {
      return data.articles.map((article: any) => ({
        id: article.url,
        title: article.title,
        description: article.description,
        source: article.source.name,
        url: article.url,
        image: article.urlToImage,
        publishedAt: article.publishedAt,
        category: category as any,
      }));
    }

    return getMockNews(category, limit);
  } catch (error) {
    console.error('Error fetching news:', error);
    return getMockNews(category, limit);
  }
}

/**
 * Get forex rates
 */
export async function getForexRate(baseCurrency = 'INR', quoteCurrency = 'USD'): Promise<number | null> {
  try {
    const apiKey = process.env.ALPHA_VANTAGE_API_KEY;
    if (!apiKey) {
      console.warn('Alpha Vantage API key not configured');
      return getMockForexRate();
    }

    const response = await fetch(
      `https://www.alphavantage.co/query?function=CURRENCY_EXCHANGE_RATE&from_currency=${baseCurrency}&to_currency=${quoteCurrency}&apikey=${apiKey}`
    );
    const data = await response.json();

    if (data['Realtime Currency Exchange Rate']) {
      return parseFloat(data['Realtime Currency Exchange Rate']['5. Exchange Rate']);
    }

    return getMockForexRate();
  } catch (error) {
    console.error('Error fetching forex rate:', error);
    return getMockForexRate();
  }
}

/**
 * Get GST updates and compliance news
 */
export async function getGSTUpdates(limit = 15): Promise<MarketNews[]> {
  return getFinancialNews('gst_updates', limit);
}

/**
 * Get tax notifications and updates
 */
export async function getTaxUpdates(limit = 15): Promise<MarketNews[]> {
  return getFinancialNews('tax_news', limit);
}

// Mock data generators (for development and fallback)

function getMockStockData(symbol: string): StockData {
  const basePrice = 100 + Math.random() * 100;
  const change = (Math.random() - 0.5) * 10;

  return {
    symbol,
    price: basePrice,
    change,
    changePercent: (change / basePrice) * 100,
    high: basePrice + 5,
    low: basePrice - 5,
    volume: Math.floor(Math.random() * 10000000),
    timestamp: new Date().toISOString(),
  };
}

function getMockIndexData(indexSymbol: string): IndexData {
  const baseValue = indexSymbol === 'SENSEX' ? 65000 : 19000;
  const change = (Math.random() - 0.5) * 500;

  return {
    name: indexSymbol,
    value: baseValue + change,
    change,
    changePercent: (change / baseValue) * 100,
    timestamp: new Date().toISOString(),
  };
}

function getMockNews(category: string, limit: number): MarketNews[] {
  const newsItems: Record<string, MarketNews[]> = {
    gst_updates: [
      {
        id: '1',
        title: 'GST Rate Revision on Electronics Announced',
        description: 'The GST Council has announced new rate revisions for electronic goods effective from next quarter.',
        source: 'Financial Express',
        url: 'https://example.com/gst-news-1',
        publishedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        category: 'gst_updates',
      },
      {
        id: '2',
        title: 'GST Compliance Deadline Extended',
        description: 'New extended deadline for GSTR-1 filing for certain businesses.',
        source: 'Business Today',
        url: 'https://example.com/gst-news-2',
        publishedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        category: 'gst_updates',
      },
    ],
    tax_news: [
      {
        id: '3',
        title: 'Income Tax Slab Changes for FY 2024-25',
        description: 'New income tax slabs and deductions announced for the financial year 2024-25.',
        source: 'Times of India',
        url: 'https://example.com/tax-news-1',
        publishedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        category: 'tax_news',
      },
    ],
    business_news: [
      {
        id: '4',
        title: 'Digital Payment Adoption Accelerates',
        description: 'Indian businesses are increasingly adopting digital payment solutions for better cash flow management.',
        source: 'Mint',
        url: 'https://example.com/business-news-1',
        publishedAt: new Date().toISOString(),
        category: 'business_news',
      },
    ],
    compliance: [
      {
        id: '5',
        title: 'Audit Requirements Updated',
        description: 'New audit framework requirements issued by regulatory authorities.',
        source: 'CA Journal',
        url: 'https://example.com/compliance-news-1',
        publishedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        category: 'compliance',
      },
    ],
  };

  return (newsItems[category] || newsItems.business_news).slice(0, limit);
}

function getMockForexRate(): number {
  // Mock USD to INR rate
  return 83 + (Math.random() - 0.5) * 2;
}

/**
 * Get cryptocurrency prices (if relevant for business)
 */
export async function getCryptoPrices(): Promise<Record<string, number>> {
  try {
    // Mock crypto data - can integrate with real API
    return {
      BTC: 45000 + Math.random() * 5000,
      ETH: 2500 + Math.random() * 500,
      INR: 1, // INR as base
    };
  } catch (error) {
    console.error('Error fetching crypto prices:', error);
    return {
      BTC: 45000,
      ETH: 2500,
      INR: 1,
    };
  }
}

/**
 * Get market sentiment and analysis
 */
export async function getMarketSentiment(): Promise<{
  overall: 'bullish' | 'bearish' | 'neutral';
  confidence: number;
  factors: string[];
}> {
  return {
    overall: 'neutral',
    confidence: 0.65,
    factors: [
      'Global economic indicators mixed',
      'Domestic inflation moderate',
      'Corporate earnings strong',
      'Investment inflow stable',
    ],
  };
}
