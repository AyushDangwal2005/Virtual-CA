import { NextRequest, NextResponse } from 'next/server';
import {
  getFinancialStatements,
  getTrialBalance,
  calculateFinancialMetrics,
  createJournalEntry,
} from '@/lib/services/accounting.service';

export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'statements';

    if (type === 'statements') {
      const statements = await getFinancialStatements(userId);
      return NextResponse.json({ success: true, data: statements });
    }

    if (type === 'trial-balance') {
      const trialBalance = await getTrialBalance(userId);
      return NextResponse.json({ success: true, data: trialBalance });
    }

    if (type === 'metrics') {
      const metrics = await calculateFinancialMetrics(userId);
      return NextResponse.json({ success: true, data: metrics });
    }

    return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
  } catch (error) {
    console.error('[Accounting API] Error:', error);
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
    const { action, entry } = body;

    if (action === 'create-entry') {
      const result = await createJournalEntry(userId, entry);
      return NextResponse.json({ success: true, data: result });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('[Accounting API] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
