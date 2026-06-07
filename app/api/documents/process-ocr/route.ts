import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const documentId = formData.get('documentId') as string;
    const userId = formData.get('userId') as string;

    if (!file || !documentId || !userId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Update document status to processing
    await supabase
      .from('documents')
      .update({ processing_status: 'processing' })
      .eq('id', documentId);

    // TODO: Integrate with PaddleOCR or similar service
    // For now, mock the OCR processing

    const mockOCRData = {
      text: `Invoice Document\n\nInvoice Number: INV-${Math.random().toString(36).substr(2, 9)}\nDate: ${new Date().toLocaleDateString()}\nVendor: Sample Company\nAmount: ₹10,000\nGST: ₹1,800\nTotal: ₹11,800`,
      confidence: 0.92,
      textBlocks: [
        { text: 'Invoice Number', confidence: 0.98 },
        { text: 'Date', confidence: 0.95 },
        { text: 'Vendor Name', confidence: 0.91 },
        { text: 'Amount', confidence: 0.89 },
        { text: 'GST', confidence: 0.92 },
      ],
    };

    // Mock extracted structured data
    const extractedData = {
      invoiceNumber: `INV-${Math.random().toString(36).substr(2, 9)}`,
      invoiceDate: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      vendorName: 'Sample Vendor',
      vendorGST: '29ABCDE1234F1Z5',
      amount: 10000,
      gstAmount: 1800,
      totalAmount: 11800,
      paymentStatus: 'pending',
    };

    // Update document with OCR data and extracted data
    const { error: updateError } = await supabase
      .from('documents')
      .update({
        ocr_data: mockOCRData,
        extracted_data: extractedData,
        confidence_score: 0.92,
        processing_status: 'completed',
        updated_at: new Date(),
      })
      .eq('id', documentId);

    if (updateError) throw updateError;

    return NextResponse.json({
      success: true,
      ocrData: mockOCRData,
      extractedData,
    });
  } catch (error) {
    console.error('OCR processing error:', error);
    return NextResponse.json(
      { error: 'OCR processing failed' },
      { status: 500 }
    );
  }
}
