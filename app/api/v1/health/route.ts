import { NextResponse } from 'next/server';
import { logger } from '@/lib/utils/logger';

export async function GET() {
  try {
    const services = {
      supabase: process.env.SUPABASE_URL ? 'configured' : 'not-configured',
      ocr: process.env.HF_TOKEN ? 'available' : 'not-configured',
      llm: process.env.HF_TOKEN ? 'available' : 'not-configured',
      embeddings: process.env.HF_TOKEN ? 'available' : 'not-configured',
      alphaVantage: process.env.ALPHA_VANTAGE_API_KEY ? 'available' : 'not-configured',
      finnhub: process.env.FINNHUB_API_KEY ? 'available' : 'not-configured',
      newsAPI: process.env.NEWS_API_KEY ? 'available' : 'not-configured',
    };

    const timestamp = new Date().toISOString();

    logger.info('HEALTH_API', 'Health check passed', { services });

    return NextResponse.json(
      {
        success: true,
        status: 'healthy',
        timestamp,
        services,
        version: '1.0.0',
      },
      { status: 200 }
    );
  } catch (error) {
    logger.error('HEALTH_API', 'Health check failed', error);

    return NextResponse.json(
      {
        success: false,
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
