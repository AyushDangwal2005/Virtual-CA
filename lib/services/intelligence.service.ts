import axios from 'axios';
import NodeCache from 'node-cache';

interface MarketData {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  timestamp: number;
}

interface NewsArticle {
  title: string;
  description: string;
  source: string;
  url: string;
  publishedAt: string;
  category: string;
}

// Cache with 5 minute TTL for stock data, 1 hour for news
const cache = new NodeCache({ stdTTL: 300, checkperiod: 60 });

export async function getStockPrice(symbol: string): Promise<MarketData | null> {
  try {
    // Check cache first
    const cached = cache.get<MarketData>(`stock_${symbol}`);
    if (cached) return cached;

    const apiKey = process.env.ALPHA_VANTAGE_API_KEY;
    if (!apiKey) {
      console.warn('[Intelligence Service] ALPHA_VANTAGE_API_KEY not configured');
      return null;
    }

    const response = await axios.get('https://www.alphavantage.co/query', {
      params: {
        function: 'GLOBAL_QUOTE',
        symbol,
        apikey: apiKey,
      },
      timeout: 10000,
    });

    const quote = response.data['Global Quote'];
    if (!quote || !quote.price) {
      return null;
    }

    const data: MarketData = {
      symbol: quote.symbol || symbol,
      price: parseFloat(quote.price),
      change: parseFloat(quote.change) || 0,
      changePercent: parseFloat(quote.change_percent) || 0,
      timestamp: Date.now(),
    };

    cache.set(`stock_${symbol}`, data);
    return data;
  } catch (error) {
    console.error('[Intelligence Service] Error fetching stock price:', error);
    return null;
  }
}

export async function getIndexData(indexSymbol: string): Promise<MarketData | null> {
  try {
    // Map common index names to symbols
    const indexMap: Record<string, string> = {
      nifty: '^NSEI',
      sensex: '^BSESN',
      banknifty: '^NSEBANK',
      niftya: '^NSEAUTO',
      niftyit: '^NSEITSFT',
    };

    const symbol = indexMap[indexSymbol.toLowerCase()] || indexSymbol;
    return await getStockPrice(symbol);
  } catch (error) {
    console.error('[Intelligence Service] Error fetching index data:', error);
    return null;
  }
}

export async function getForexRate(fromCurrency: string, toCurrency: string): Promise<number | null> {
  try {
    const cacheKey = `forex_${fromCurrency}_${toCurrency}`;
    const cached = cache.get<number>(cacheKey);
    if (cached) return cached;

    const apiKey = process.env.ALPHA_VANTAGE_API_KEY;
    if (!apiKey) {
      return null;
    }

    const response = await axios.get('https://www.alphavantage.co/query', {
      params: {
        function: 'CURRENCY_EXCHANGE_RATE',
        from_currency: fromCurrency,
        to_currency: toCurrency,
        apikey: apiKey,
      },
      timeout: 10000,
    });

    const rate = parseFloat(response.data['Realtime Currency Exchange Rate']?.['5. Exchange Rate']);
    if (!isNaN(rate)) {
      cache.set(cacheKey, rate);
      return rate;
    }

    return null;
  } catch (error) {
    console.error('[Intelligence Service] Error fetching forex rate:', error);
    return null;
  }
}

export async function getFinancialNews(query: string = 'finance', limit: number = 10): Promise<NewsArticle[]> {
  try {
    const cacheKey = `news_${query}`;
    const cached = cache.get<NewsArticle[]>(cacheKey);
    if (cached) return cached;

    // Try NewsAPI first
    const newsApiKey = process.env.NEWS_API_KEY;
    if (newsApiKey) {
      try {
        const response = await axios.get('https://newsapi.org/v2/everything', {
          params: {
            q: query,
            language: 'en',
            sortBy: 'publishedAt',
            pageSize: limit,
            apiKey: newsApiKey,
          },
          timeout: 10000,
        });

        if (response.data.articles) {
          const articles: NewsArticle[] = response.data.articles.map((article: any) => ({
            title: article.title,
            description: article.description || '',
            source: article.source?.name || 'Unknown',
            url: article.url,
            publishedAt: article.publishedAt,
            category: 'finance',
          }));

          cache.set(cacheKey, articles, 3600); // 1 hour cache
          return articles;
        }
      } catch (error) {
        console.warn('[Intelligence Service] NewsAPI error:', error);
      }
    }

    // Fallback to mock news
    return getMockNews(limit);
  } catch (error) {
    console.error('[Intelligence Service] Error fetching news:', error);
    return getMockNews(limit);
  }
}

export async function getGSTUpdates(): Promise<NewsArticle[]> {
  try {
    return await getFinancialNews('GST India', 5);
  } catch (error) {
    console.error('[Intelligence Service] Error fetching GST updates:', error);
    return [];
  }
}

export async function getTaxUpdates(): Promise<NewsArticle[]> {
  try {
    return await getFinancialNews('income tax India', 5);
  } catch (error) {
    console.error('[Intelligence Service] Error fetching tax updates:', error);
    return [];
  }
}

export async function getCompanyFinancials(symbol: string): Promise<any> {
  try {
    const cacheKey = `company_${symbol}`;
    const cached = cache.get(cacheKey);
    if (cached) return cached;

    const finnhubKey = process.env.FINNHUB_API_KEY;
    if (!finnhubKey) {
      return null;
    }

    const response = await axios.get('https://finnhub.io/api/v1/company-basic-financials', {
      params: {
        symbol,
        metric: 'all',
        token: finnhubKey,
      },
      timeout: 10000,
    });

    const financials = {
      symbol,
      pe: response.data.metric?.peNormalizedAnnual,
      marketCap: response.data.metric?.marketCapitalization,
      revenue: response.data.metric?.revenueTTM,
      netProfitTTM: response.data.metric?.netProfitTTM,
      roic: response.data.metric?.roic,
    };

    cache.set(cacheKey, financials, 86400); // 1 day cache
    return financials;
  } catch (error) {
    console.error('[Intelligence Service] Error fetching company financials:', error);
    return null;
  }
}

function getMockNews(limit: number): NewsArticle[] {
  const mockArticles: NewsArticle[] = [
    {
      title: 'GST Revenue Shows Strong Growth in Recent Months',
      description: 'GST collection has reached a new record, indicating robust economic activity.',
      source: 'Financial Express',
      url: '#',
      publishedAt: new Date().toISOString(),
      category: 'gst',
    },
    {
      title: 'Income Tax Deadline Extended for Certain Taxpayers',
      description: 'The income tax department has announced an extension for ITR filing deadline.',
      source: 'Times of India',
      url: '#',
      publishedAt: new Date().toISOString(),
      category: 'tax',
    },
    {
      title: 'New Accounting Standards Released by ICAI',
      description: 'The Institute of Chartered Accountants of India has released updated accounting standards.',
      source: 'Business Today',
      url: '#',
      publishedAt: new Date().toISOString(),
      category: 'accounting',
    },
    {
      title: 'Market Indices Hit All-Time High',
      description: 'Sensex and Nifty reached new record levels on positive economic data.',
      source: 'Moneycontrol',
      url: '#',
      publishedAt: new Date().toISOString(),
      category: 'market',
    },
    {
      title: 'RBI Holds Interest Rates Steady',
      description: 'Reserve Bank of India maintains key interest rates amid inflation concerns.',
      source: 'Economic Times',
      url: '#',
      publishedAt: new Date().toISOString(),
      category: 'economics',
    },
  ];

  return mockArticles.slice(0, limit);
}
