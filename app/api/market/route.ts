import { NextRequest, NextResponse } from 'next/server';
import {
  getStockPrice,
  getIndexData,
  getForexRate,
  getFinancialNews,
  getGSTUpdates,
  getTaxUpdates,
} from '@/lib/services/intelligence.service';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'all';
    const symbol = searchParams.get('symbol');
    const limit = parseInt(searchParams.get('limit') || '10');

    const data: Record<string, any> = {};

    if (type === 'all' || type === 'indices') {
      data.nifty = await getIndexData('nifty');
      data.sensex = await getIndexData('sensex');
      data.bankNifty = await getIndexData('banknifty');
      data.niftyIT = await getIndexData('niftyit');
    }

    if (type === 'all' || type === 'stock') {
      if (symbol) {
        data.stock = await getStockPrice(symbol);
      }
    }

    if (type === 'all' || type === 'forex') {
      data.inrUsd = await getForexRate('INR', 'USD');
      data.inrEur = await getForexRate('INR', 'EUR');
      data.inrGbp = await getForexRate('INR', 'GBP');
    }

    if (type === 'all' || type === 'news') {
      data.financialNews = await getFinancialNews('finance', limit);
      data.gstUpdates = await getGSTUpdates();
      data.taxUpdates = await getTaxUpdates();
    }

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error('[Market API] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
