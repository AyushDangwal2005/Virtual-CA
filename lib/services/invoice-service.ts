import { createClient } from '@/lib/supabase/client';

export interface ExtractedInvoiceData {
  invoiceNumber?: string;
  invoiceDate?: string;
  dueDate?: string;
  vendorName?: string;
  vendorGST?: string;
  customerName?: string;
  customerGST?: string;
  amount?: number;
  gstAmount?: number;
  totalAmount?: number;
  paymentStatus?: string;
  description?: string;
}

/**
 * Upload and process invoice documents
 */
export async function uploadInvoiceDocument(
  file: File,
  documentType: string = 'invoice',
  userId: string
) {
  const supabase = createClient();
  
  // Upload file to storage
  const fileName = `${userId}/${Date.now()}-${file.name}`;
  const { data: uploadData, error: uploadError } = await supabase.storage
    .from('invoices')
    .upload(fileName, file);

  if (uploadError) throw uploadError;

  // Create document record
  const { data: docData, error: docError } = await supabase
    .from('documents')
    .insert([{
      user_id: userId,
      file_name: file.name,
      file_path: uploadData.path,
      file_type: file.type,
      file_size: file.size,
      document_type: documentType,
      processing_status: 'pending',
    }])
    .select()
    .single();

  if (docError) throw docError;
  return docData;
}

/**
 * Process document with OCR (mock implementation)
 * In production, integrate with PaddleOCR or similar
 */
export async function processDocumentOCR(documentId: string) {
  const supabase = createClient();

  // Update status to processing
  await supabase
    .from('documents')
    .update({ processing_status: 'processing' })
    .eq('id', documentId);

  try {
    // Mock OCR processing - replace with actual PaddleOCR call
    const mockOCRData = {
      text: 'Invoice processing in progress...',
      confidence: 0.85,
    };

    const { error } = await supabase
      .from('documents')
      .update({
        ocr_data: mockOCRData,
        processing_status: 'completed',
      })
      .eq('id', documentId);

    if (error) throw error;
    return mockOCRData;
  } catch (error) {
    await supabase
      .from('documents')
      .update({
        processing_status: 'failed',
        error_message: String(error),
      })
      .eq('id', documentId);
    throw error;
  }
}

/**
 * Extract structured data from invoice
 */
export async function extractInvoiceData(
  documentId: string
): Promise<ExtractedInvoiceData> {
  const supabase = createClient();

  // Get document
  const { data: doc, error: getError } = await supabase
    .from('documents')
    .select('*')
    .eq('id', documentId)
    .single();

  if (getError) throw getError;

  // Mock extraction - replace with actual AI extraction
  const extracted: ExtractedInvoiceData = {
    invoiceNumber: 'INV-' + Math.random().toString(36).substr(2, 9),
    invoiceDate: new Date().toISOString().split('T')[0],
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    vendorName: 'Sample Vendor',
    vendorGST: '29ABCDE1234F1Z5',
    customerName: 'Sample Customer',
    customerGST: '18ABCDE1234F1Z5',
    amount: 10000,
    gstAmount: 1800,
    totalAmount: 11800,
    paymentStatus: 'pending',
  };

  // Save extracted data
  const { error: updateError } = await supabase
    .from('documents')
    .update({
      extracted_data: extracted,
      confidence_score: 0.92,
    })
    .eq('id', documentId);

  if (updateError) throw updateError;
  return extracted;
}

/**
 * Create invoice from extracted data
 */
export async function createInvoiceFromData(
  userId: string,
  documentId: string,
  data: ExtractedInvoiceData
) {
  const supabase = createClient();

  // Check for duplicate
  const { data: existing } = await supabase
    .from('invoices')
    .select('id')
    .eq('user_id', userId)
    .eq('invoice_number', data.invoiceNumber || '')
    .single();

  if (existing) {
    throw new Error('Invoice already exists - duplicate detected');
  }

  // Create invoice
  const { data: invoice, error } = await supabase
    .from('invoices')
    .insert([{
      user_id: userId,
      document_id: documentId,
      invoice_number: data.invoiceNumber,
      invoice_date: data.invoiceDate,
      due_date: data.dueDate,
      vendor_name: data.vendorName,
      customer_name: data.customerName,
      gst_number: data.vendorGST,
      amount: data.amount,
      gst_amount: data.gstAmount,
      total_amount: data.totalAmount,
      payment_status: data.paymentStatus || 'pending',
    }])
    .select()
    .single();

  if (error) throw error;
  return invoice;
}

/**
 * Search invoices with advanced filters
 */
export async function searchInvoices(
  userId: string,
  filters: {
    vendorName?: string;
    customerName?: string;
    dateFrom?: string;
    dateTo?: string;
    paymentStatus?: string;
    minAmount?: number;
    maxAmount?: number;
  }
) {
  const supabase = createClient();

  let query = supabase
    .from('invoices')
    .select('*')
    .eq('user_id', userId);

  if (filters.vendorName) {
    query = query.ilike('vendor_name', `%${filters.vendorName}%`);
  }
  if (filters.customerName) {
    query = query.ilike('customer_name', `%${filters.customerName}%`);
  }
  if (filters.dateFrom) {
    query = query.gte('invoice_date', filters.dateFrom);
  }
  if (filters.dateTo) {
    query = query.lte('invoice_date', filters.dateTo);
  }
  if (filters.paymentStatus) {
    query = query.eq('payment_status', filters.paymentStatus);
  }
  if (filters.minAmount !== undefined) {
    query = query.gte('total_amount', filters.minAmount);
  }
  if (filters.maxAmount !== undefined) {
    query = query.lte('total_amount', filters.maxAmount);
  }

  const { data, error } = await query.order('invoice_date', { ascending: false });

  if (error) throw error;
  return data;
}

/**
 * Get invoice analytics
 */
export async function getInvoiceAnalytics(userId: string) {
  const supabase = createClient();

  // Get all invoices
  const { data: invoices, error } = await supabase
    .from('invoices')
    .select('*')
    .eq('user_id', userId);

  if (error) throw error;

  // Calculate analytics
  const total = invoices.length;
  const paid = invoices.filter((inv) => inv.payment_status === 'paid').length;
  const pending = invoices.filter((inv) => inv.payment_status === 'pending').length;
  const overdue = invoices.filter((inv) => {
    const dueDate = new Date(inv.due_date);
    return inv.payment_status !== 'paid' && dueDate < new Date();
  }).length;

  const totalAmount = invoices.reduce((sum, inv) => sum + (inv.total_amount || 0), 0);
  const paidAmount = invoices
    .filter((inv) => inv.payment_status === 'paid')
    .reduce((sum, inv) => sum + (inv.total_amount || 0), 0);
  const pendingAmount = invoices
    .filter((inv) => inv.payment_status === 'pending')
    .reduce((sum, inv) => sum + (inv.total_amount || 0), 0);

  const gstCollected = invoices.reduce((sum, inv) => sum + (inv.gst_amount || 0), 0);

  return {
    total,
    paid,
    pending,
    overdue,
    totalAmount,
    paidAmount,
    pendingAmount,
    gstCollected,
    avgInvoiceValue: total > 0 ? totalAmount / total : 0,
    paidPercentage: total > 0 ? (paid / total) * 100 : 0,
  };
}

/**
 * Update invoice status
 */
export async function updateInvoiceStatus(
  userId: string,
  invoiceId: string,
  status: string,
  paymentDate?: string
) {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('invoices')
    .update({
      payment_status: status,
      payment_date: paymentDate || null,
      updated_at: new Date(),
    })
    .eq('user_id', userId)
    .eq('id', invoiceId)
    .select()
    .single();

  if (error) throw error;
  return data;
}
