import axios from 'axios';
import { getSupabaseServer } from '@/lib/supabase/server-admin';

interface OCRResult {
  text: string;
  confidence: number;
  data: Array<{
    text: string;
    confidence: number;
    box: Array<[number, number]>;
  }>;
}

interface InvoiceExtraction {
  invoiceNumber?: string;
  gstNumber?: string;
  vendorName?: string;
  customerName?: string;
  amount?: number;
  gstAmount?: number;
  totalAmount?: number;
  invoiceDate?: string;
  dueDate?: string;
  paymentMethod?: string;
}

export async function processDocumentOCR(
  imageBase64: string,
  documentType: string = 'invoice'
): Promise<{ ocrResult: OCRResult; extraction: InvoiceExtraction; confidence: number }> {
  try {
    // Call PaddleOCR via Hugging Face
    const hfToken = process.env.HF_TOKEN;
    if (!hfToken) {
      throw new Error('HF_TOKEN not configured');
    }

    const response = await axios.post(
      'https://api-inference.huggingface.co/models/PaddleOCR/PaddleOCR',
      {
        inputs: imageBase64.replace(/^data:image\/\w+;base64,/, ''),
      },
      {
        headers: {
          Authorization: `Bearer ${hfToken}`,
          'Content-Type': 'application/json',
        },
        timeout: 30000,
      }
    );

    // Parse OCR results
    const ocrResult: OCRResult = {
      text: response.data
        .map((line: any) => line.text)
        .join('\n'),
      confidence: response.data.length > 0 
        ? response.data.reduce((acc: number, line: any) => acc + (line.confidence || 0), 0) / response.data.length
        : 0,
      data: response.data,
    };

    // Extract structured invoice data from OCR text
    const extraction = extractInvoiceData(ocrResult.text);

    return {
      ocrResult,
      extraction,
      confidence: ocrResult.confidence,
    };
  } catch (error) {
    console.error('[OCR Service] Error processing document:', error);
    throw new Error('Failed to process document with OCR');
  }
}

function extractInvoiceData(text: string): InvoiceExtraction {
  const result: InvoiceExtraction = {};

  // Invoice Number patterns
  const invoiceMatch = text.match(/invoice\s*(?:no|number|#)?[\s:]*([A-Z0-9-]+)/i);
  if (invoiceMatch) result.invoiceNumber = invoiceMatch[1].trim();

  // GST Number pattern (format: 15-digit alphanumeric)
  const gstMatch = text.match(/\b([0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1})\b/);
  if (gstMatch) result.gstNumber = gstMatch[1];

  // Vendor/Supplier name (often after "Bill To:" or "From:")
  const vendorMatch = text.match(/(?:from|bill\s+from|supplier|vendor)\s*:?\s*([A-Za-z\s&.,]+?)(?:\n|phone|email|address)/i);
  if (vendorMatch) result.vendorName = vendorMatch[1].trim();

  // Customer name (often after "Bill To:" or "Ship To:")
  const customerMatch = text.match(/(?:bill\s+to|ship\s+to|customer)\s*:?\s*([A-Za-z\s&.,]+?)(?:\n|phone|email|address)/i);
  if (customerMatch) result.customerName = customerMatch[1].trim();

  // Amount patterns
  const amountMatch = text.match(/(?:subtotal|amount|total|sum)\s*:?\s*₹?\s*([\d,]+\.?\d*)/i);
  if (amountMatch) {
    result.amount = parseFloat(amountMatch[1].replace(/,/g, ''));
  }

  // GST Amount
  const gstAmountMatch = text.match(/(?:gst|tax|vat)\s*:?\s*₹?\s*([\d,]+\.?\d*)/i);
  if (gstAmountMatch) {
    result.gstAmount = parseFloat(gstAmountMatch[1].replace(/,/g, ''));
  }

  // Total Amount
  const totalMatch = text.match(/(?:total|grand\s+total|final\s+amount)\s*:?\s*₹?\s*([\d,]+\.?\d*)/i);
  if (totalMatch) {
    result.totalAmount = parseFloat(totalMatch[1].replace(/,/g, ''));
  }

  // Date patterns (Indian format)
  const dateMatch = text.match(/(\d{1,2}[-/]\d{1,2}[-/]\d{2,4})/);
  if (dateMatch) {
    result.invoiceDate = formatDate(dateMatch[1]);
  }

  // Due Date
  const dueDateMatch = text.match(/(?:due|payment\s+due)\s*:?\s*(\d{1,2}[-/]\d{1,2}[-/]\d{2,4})/i);
  if (dueDateMatch) {
    result.dueDate = formatDate(dueDateMatch[1]);
  }

  // Payment Method
  const paymentMatch = text.match(/(?:payment|method)\s*:?\s*(cash|check|draft|online|bank\s+transfer|upi)/i);
  if (paymentMatch) result.paymentMethod = paymentMatch[1].trim();

  return result;
}

function formatDate(dateStr: string): string {
  try {
    const [day, month, year] = dateStr.split(/[-/]/);
    const fullYear = year.length === 2 ? `20${year}` : year;
    return `${fullYear}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  } catch {
    return dateStr;
  }
}

export async function detectDuplicateInvoice(
  userId: string,
  invoiceNumber: string,
  vendorName: string,
  amount: number
): Promise<boolean> {
  const supabase = getSupabaseServer();

  const { data, error } = await supabase
    .from('invoices')
    .select('id')
    .eq('user_id', userId)
    .eq('invoice_number', invoiceNumber)
    .eq('vendor_name', vendorName)
    .eq('amount', amount)
    .limit(1);

  if (error) {
    console.error('[OCR Service] Error checking duplicates:', error);
    return false;
  }

  return (data?.length || 0) > 0;
}
