import { NextRequest, NextResponse } from 'next/server';
import { ragService } from '@/lib/services/rag-service';
import { logger } from '@/lib/utils/logger';
import { handleError, ValidationError } from '@/lib/utils/errors';

// Initialize RAG service on first use
let ragInitialized = false;
async function initializeRAG() {
  if (!ragInitialized) {
    try {
      await ragService.initializeSampleDocuments();
      ragInitialized = true;
    } catch (error) {
      logger.warn('KB_API', 'Failed to initialize RAG service', error);
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, query, document } = body;

    if (!action) {
      throw new ValidationError('action is required (search, add, initialize)');
    }

    logger.info('KB_API', 'Knowledge base request', { action });

    let result;

    switch (action) {
      case 'search':
        if (!query) throw new ValidationError('query is required for search');
        result = await ragService.search(query);
        break;

      case 'query':
        if (!query) throw new ValidationError('query is required');
        result = await ragService.query(query);
        break;

      case 'add':
        if (!document || !document.title || !document.content) {
          throw new ValidationError('document with title and content is required');
        }
        const docId = await ragService.addDocument({
          title: document.title,
          content: document.content,
          category: document.category || 'general',
          source: document.source || 'User Upload',
        });
        result = { id: docId, message: 'Document added successfully' };
        break;

      case 'initialize':
        await initializeRAG();
        result = { message: 'Sample documents initialized' };
        break;

      default:
        throw new ValidationError(`Unknown action: ${action}`);
    }

    logger.info('KB_API', 'Knowledge base request completed', { action });

    return NextResponse.json(
      {
        success: true,
        action,
        result,
      },
      { status: 200 }
    );
  } catch (error) {
    const errorResponse = handleError(error);
    logger.error('KB_API', 'Knowledge base request failed', error);

    return NextResponse.json(errorResponse, { status: errorResponse.statusCode });
  }
}
