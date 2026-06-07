import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase/server-admin';
import { uploadAndProcessDocument, getDocumentsByUser } from '@/lib/services/document.service';
import { generateInvoiceAnalytics } from '@/lib/services/analytics.service';

export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    const supabase = getSupabaseServer();
    const { data: invoices, error: invoiceError, count } = await supabase
      .from('invoices')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)
      .order('invoice_date', { ascending: false })
      .range(offset, offset + limit - 1);

    if (invoiceError) {
      return NextResponse.json({ error: invoiceError.message }, { status: 500 });
    }

    // Get analytics
    const analytics = await generateInvoiceAnalytics(userId);

    return NextResponse.json({
      success: true,
      data: {
        invoices: invoices || [],
        total: count || 0,
        analytics,
      },
    });
  } catch (error) {
    console.error('[Invoice API] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'File required' }, { status: 400 });
    }

    // Process document with OCR
    const result = await uploadAndProcessDocument(userId, file, 'invoice');

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('[Invoice API] Upload error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Upload failed' },
      { status: 500 }
    );
  }
}
