import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase/server-admin';
import { v4 as uuidv4 } from 'uuid';

export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const category = searchParams.get('category');

    const supabase = getSupabaseServer();
    let query = supabase
      .from('expenses')
      .select('*', { count: 'exact' })
      .eq('user_id', userId);

    if (category) {
      query = query.eq('category', category);
    }

    const { data: expenses, error, count } = await query
      .order('date', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: {
        expenses: expenses || [],
        total: count || 0,
      },
    });
  } catch (error) {
    console.error('[Expenses API] Error:', error);
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

    const body = await request.json();
    const {
      vendorId,
      date,
      category,
      description,
      amount,
      gstAmount,
      totalAmount,
      paymentStatus,
      paymentMethod,
      notes,
    } = body;

    if (!date || !category || !amount) {
      return NextResponse.json(
        { error: 'Date, category, and amount required' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseServer();
    const { data, error } = await supabase.from('expenses').insert({
      id: uuidv4(),
      user_id: userId,
      vendor_id: vendorId,
      date,
      category,
      description,
      amount,
      gst_amount: gstAmount,
      total_amount: totalAmount || amount + (gstAmount || 0),
      payment_status: paymentStatus || 'pending',
      payment_method: paymentMethod,
      notes,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error('[Expenses API] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
