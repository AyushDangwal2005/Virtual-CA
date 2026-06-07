import { NextRequest, NextResponse } from 'next/server';
import { ocrClient } from '@/lib/api-clients/ocr-client';
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
    const { imageBase64, documentType = 'invoice' } = body;

    if (!imageBase64) {
      throw new ValidationError('imageBase64 is required');
    }

    logger.info('DOCUMENT_API', 'Processing document', { documentType });

    // Process OCR
    const ocrResult = await ocrClient.processDocument(imageBase64);

    // Extract invoice data if it's an invoice
    let structuredData = null;
    if (documentType === 'invoice') {
      structuredData = await ocrClient.extractInvoiceData(ocrResult.text);
    }

    // Store in database
    const supabase = getSupabase();
    const { data: docData, error } = await supabase.from('ocr_results').insert({
      document_type: documentType,
      raw_text: ocrResult.text,
      confidence: ocrResult.confidence,
      structured_data: structuredData,
      image_data: imageBase64,
      processed_at: new Date().toISOString(),
    });

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    logger.info('DOCUMENT_API', 'Document processed successfully', { confidence: ocrResult.confidence });

    return NextResponse.json(
      {
        success: true,
        data: {
          id: docData?.[0]?.id,
          rawText: ocrResult.text,
          confidence: ocrResult.confidence,
          structuredData,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    const errorResponse = handleError(error);
    logger.error('DOCUMENT_API', 'Document processing failed', error);

    return NextResponse.json(errorResponse, { status: errorResponse.statusCode });
  }
}
