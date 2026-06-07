import { getSupabaseServer } from '@/lib/supabase/server-admin';
import { v4 as uuidv4 } from 'uuid';
import { processDocumentOCR, detectDuplicateInvoice } from './ocr.service';
import * as pdfParse from 'pdf-parse';

export interface DocumentUploadResponse {
  documentId: string;
  fileName: string;
  status: string;
  extractedData?: any;
  confidence?: number;
  isDuplicate?: boolean;
}

export async function uploadAndProcessDocument(
  userId: string,
  file: File,
  documentType: string = 'invoice'
): Promise<DocumentUploadResponse> {
  const supabase = getSupabaseServer();
  const fileName = `${userId}/${Date.now()}-${file.name}`;
  const documentId = uuidv4();

  try {
    // 1. Store original file in Supabase Storage
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const { error: uploadError } = await supabase.storage
      .from('documents')
      .upload(fileName, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      throw new Error(`File upload failed: ${uploadError.message}`);
    }

    // 2. Create document record in DB
    const { error: docError } = await supabase
      .from('documents')
      .insert({
        id: documentId,
        user_id: userId,
        file_name: file.name,
        file_path: fileName,
        file_type: file.type,
        file_size: file.size,
        document_type: documentType,
        processing_status: 'processing',
      });

    if (docError) {
      throw new Error(`Failed to create document record: ${docError.message}`);
    }

    // 3. Process OCR asynchronously
    setImmediate(async () => {
      try {
        let imageBase64 = '';

        // Convert file to base64 for OCR
        if (file.type.startsWith('image/')) {
          imageBase64 = `data:${file.type};base64,${buffer.toString('base64')}`;
        } else if (file.type === 'application/pdf') {
          // Extract first page from PDF and convert to image
          const pdf = await pdfParse(buffer);
          const firstPageText = pdf.text.substring(0, 1000);
          // For PDF, we'll use text directly as OCR
          imageBase64 = firstPageText;
        }

        // Run OCR
        const { ocrResult, extraction, confidence } = await processDocumentOCR(
          imageBase64,
          documentType
        );

        // Check for duplicates
        let isDuplicate = false;
        if (extraction.invoiceNumber && extraction.vendorName) {
          isDuplicate = await detectDuplicateInvoice(
            userId,
            extraction.invoiceNumber,
            extraction.vendorName,
            extraction.totalAmount || 0
          );
        }

        // Update document with OCR results
        await supabase
          .from('documents')
          .update({
            ocr_data: ocrResult,
            extracted_data: extraction,
            confidence_score: confidence,
            processing_status: 'completed',
          })
          .eq('id', documentId);

        // Create invoice record if it's an invoice
        if (documentType === 'invoice' && extraction.invoiceNumber) {
          const { error: invoiceError } = await supabase
            .from('invoices')
            .insert({
              user_id: userId,
              document_id: documentId,
              invoice_number: extraction.invoiceNumber || 'Unknown',
              invoice_date: extraction.invoiceDate || new Date().toISOString().split('T')[0],
              due_date: extraction.dueDate,
              vendor_name: extraction.vendorName || 'Unknown',
              customer_name: extraction.customerName,
              gst_number: extraction.gstNumber,
              amount: extraction.amount || 0,
              gst_amount: extraction.gstAmount,
              total_amount: extraction.totalAmount || extraction.amount || 0,
              payment_status: 'pending',
            });

          if (invoiceError && !isDuplicate) {
            console.error('[Document Service] Error creating invoice:', invoiceError);
          }
        }
      } catch (error) {
        console.error('[Document Service] Error processing document:', error);
        await supabase
          .from('documents')
          .update({
            processing_status: 'failed',
            error_message: error instanceof Error ? error.message : 'Unknown error',
          })
          .eq('id', documentId);
      }
    });

    return {
      documentId,
      fileName: file.name,
      status: 'processing',
    };
  } catch (error) {
    // Update document status to failed
    await supabase
      .from('documents')
      .update({
        processing_status: 'failed',
        error_message: error instanceof Error ? error.message : 'Unknown error',
      })
      .eq('id', documentId);

    throw error;
  }
}

export async function getDocumentsByUser(userId: string, limit: number = 50, offset: number = 0) {
  const supabase = getSupabaseServer();

  const { data, error, count } = await supabase
    .from('documents')
    .select('*', { count: 'exact' })
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error('[Document Service] Error fetching documents:', error);
    return { documents: [], total: 0 };
  }

  return { documents: data || [], total: count || 0 };
}

export async function getDocumentById(documentId: string, userId: string) {
  const supabase = getSupabaseServer();

  const { data, error } = await supabase
    .from('documents')
    .select('*')
    .eq('id', documentId)
    .eq('user_id', userId)
    .single();

  if (error) {
    console.error('[Document Service] Error fetching document:', error);
    return null;
  }

  return data;
}
