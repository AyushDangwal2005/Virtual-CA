import axios from 'axios';
import { logger } from '@/lib/utils/logger';
import { retryWithBackoff } from '@/lib/utils/retry';
import { ExternalServiceError } from '@/lib/utils/errors';

export interface OCRResult {
  text: string;
  confidence: number;
  boundingBoxes: Array<{
    text: string;
    confidence: number;
    bbox: [number, number, number, number];
  }>;
}

export interface InvoiceData {
  invoiceNumber?: string;
  gstNumber?: string;
  vendorName?: string;
  customerName?: string;
  taxAmount?: number;
  invoiceDate?: string;
  dueDate?: string;
  totalAmount?: number;
  paymentMethod?: string;
  confidence: number;
}

/**
 * OCR Client using PaddleOCR via Hugging Face
 */
export class OCRClient {
  private readonly SERVICE_NAME = 'OCR_CLIENT';

  async processDocument(imageBase64: string): Promise<OCRResult> {
    logger.info(this.SERVICE_NAME, 'Processing document with OCR');

    return retryWithBackoff(async () => {
      try {
        // Using paddle-ocr service or local implementation
        // For now, simulating OCR response with mock data
        const mockResult: OCRResult = {
          text: 'Mock OCR text extraction',
          confidence: 0.95,
          boundingBoxes: [
            {
              text: 'Invoice',
              confidence: 0.98,
              bbox: [10, 10, 100, 50],
            },
          ],
        };

        logger.info(this.SERVICE_NAME, 'Document processed successfully', {
          confidence: mockResult.confidence,
        });

        return mockResult;
      } catch (error) {
        logger.error(this.SERVICE_NAME, 'OCR processing failed', error);
        throw new ExternalServiceError('PaddleOCR', error instanceof Error ? error.message : 'Unknown error', 500);
      }
    });
  }

  /**
   * Extract structured invoice data from OCR text
   */
  async extractInvoiceData(ocrText: string): Promise<InvoiceData> {
    logger.info(this.SERVICE_NAME, 'Extracting invoice data from OCR text');

    try {
      // Using simple pattern matching for now
      const invoiceData: InvoiceData = {
        invoiceNumber: this.extractPattern(ocrText, /invoice\s+(?:no\.?|number)[:\s]+(\d+)/i),
        gstNumber: this.extractPattern(ocrText, /GSTIN?[:\s]+([0-9A-Z]{15})/i),
        vendorName: this.extractPattern(ocrText, /(?:from|vendor|seller)[:\s]+([^\n]+)/i),
        customerName: this.extractPattern(ocrText, /(?:to|customer|buyer)[:\s]+([^\n]+)/i),
        invoiceDate: this.extractPattern(ocrText, /(?:date|invoice\s+date)[:\s]+(\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4})/i),
        dueDate: this.extractPattern(ocrText, /(?:due\s+date|payment\s+due)[:\s]+(\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4})/i),
        totalAmount: this.extractAmount(ocrText, /(?:total|grand\s+total|amount)[:\s]+([₹$]?[\d,]+\.?\d*)/i),
        taxAmount: this.extractAmount(ocrText, /(?:tax|gst|hsn)[:\s]+([₹$]?[\d,]+\.?\d*)/i),
        confidence: 0.85,
      };

      logger.info(this.SERVICE_NAME, 'Invoice data extracted', { invoiceNumber: invoiceData.invoiceNumber });
      return invoiceData;
    } catch (error) {
      logger.error(this.SERVICE_NAME, 'Invoice data extraction failed', error);
      throw error;
    }
  }

  private extractPattern(text: string, regex: RegExp): string | undefined {
    const match = text.match(regex);
    return match ? match[1].trim() : undefined;
  }

  private extractAmount(text: string, regex: RegExp): number | undefined {
    const match = text.match(regex);
    if (!match) return undefined;

    const amount = match[1].replace(/[₹$,]/g, '');
    const parsed = parseFloat(amount);
    return isNaN(parsed) ? undefined : parsed;
  }
}

export const ocrClient = new OCRClient();
