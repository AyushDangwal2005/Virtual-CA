import { NextRequest, NextResponse } from 'next/server';
import { alphaVantageClient, finnhubClient, newsAPIClient } from '@/lib/api-clients/market-data-client';
import { logger } from '@/lib/utils/logger';
import { handleError, ValidationError } from '@/lib/utils/errors';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type'); // 'stock', 'news', 'forex', 'indices'
    const query = searchParams.get('query'); // symbol, keyword, etc.

    if (!type) {
      throw new ValidationError('type parameter is required (stock, news, forex, indices)');
    }

    logger.info('MARKET_DATA_API', 'Fetching market data', { type, query });

    let data;

    switch (type) {
      case 'stock':
        if (!query) throw new ValidationError('query (symbol) is required for stock');
        data = await alphaVantageClient.getStockQuote(query);
        break;

      case 'news':
        data = await newsAPIClient.getBusinessNews(query || 'GST', 10);
        break;

      case 'forex':
        if (!query) throw new ValidationError('query (CURRENCY1/CURRENCY2) is required for forex');
        const [fromCurrency, toCurrency] = query.split('/');
        data = await alphaVantageClient.getForexRate(fromCurrency, toCurrency);
        break;

      case 'indices':
        // Fetch multiple indices
        const nifty = await alphaVantageClient.getStockQuote('NIFTY');
        const sensex = await alphaVantageClient.getStockQuote('SENSEX');
        const bankNifty = await alphaVantageClient.getStockQuote('BANKNIFTY');
        data = { nifty, sensex, bankNifty };
        break;

      case 'financial-news':
        data = await finnhubClient.getNews(query || 'general');
        break;

      case 'tax-news':
        data = await newsAPIClient.getTaxNews(10);
        break;

      default:
        throw new ValidationError(`Unknown type: ${type}`);
    }

    logger.info('MARKET_DATA_API', 'Market data fetched successfully', { type });

    return NextResponse.json(
      {
        success: true,
        type,
        data,
      },
      { status: 200 }
    );
  } catch (error) {
    const errorResponse = handleError(error);
    logger.error('MARKET_DATA_API', 'Market data fetch failed', error);

    return NextResponse.json(errorResponse, { status: errorResponse.statusCode });
  }
}
