import { NextRequest, NextResponse } from 'next/server';
import { ragService } from '@/lib/services/rag-service';
import { llmClient } from '@/lib/api-clients/llm-client';
import { logger } from '@/lib/utils/logger';
import { ValidationError, handleError } from '@/lib/utils/errors';
import { createClient } from '@supabase/supabase-js';

function getSupabase() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_ANON_KEY;
  
  if (!url || !key) {
    throw new Error('Supabase environment variables not configured');
  }
  
  return createClient(url, key);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, category = 'general', includeRag = true } = body;

    if (!message) {
      throw new ValidationError('message is required');
    }

    logger.info('CHAT_API', 'Processing chat request', { category, messageLength: message.length });

    let response;

    // Use RAG for knowledge-based questions
    if (includeRag && (category === 'gst' || category === 'tax' || category === 'accounting')) {
      response = await ragService.query(message);
    } else {
      // Use LLM directly for general questions
      let guidance = '';

      switch (category) {
        case 'gst':
          guidance = await llmClient.getGSTGuidance(message);
          break;
        case 'accounting':
          guidance = await llmClient.getAccountingGuidance(message);
          break;
        default:
          guidance = await llmClient.complete(message);
      }

      response = {
        answer: guidance,
        sources: [],
        citations: [],
      };
    }

    // Store chat history
    const supabase = getSupabase();
    const { data: chatData, error: chatError } = await supabase.from('chat_history').insert({
      user_message: message,
      assistant_response: response.answer,
      category,
      sources: response.sources,
      created_at: new Date().toISOString(),
    });

    if (chatError) {
      logger.warn('CHAT_API', 'Failed to store chat history', chatError);
    }

    logger.info('CHAT_API', 'Chat completed', { sourceCount: response.sources.length });

    return NextResponse.json(
      {
        success: true,
        data: response,
      },
      { status: 200 }
    );
  } catch (error) {
    const errorResponse = handleError(error);
    logger.error('CHAT_API', 'Chat request failed', error);

    return NextResponse.json(errorResponse, { status: errorResponse.statusCode });
  }
}
