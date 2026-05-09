import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { canUseCreditAmount } from '@/lib/credits/calculator';

export async function POST(request: Request) {
  try {
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { data: staff } = await supabase
      .from('members')
      .select('role')
      .eq('id', session.user.id)
      .single();

    if (!staff || (staff.role !== 'STAFF' && staff.role !== 'ADMIN')) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const {
      memberId,
      repairAmount,
      creditUsed,
      cashPaid,
      partsCost = 0,
      repairDescription,
      notes,
    } = await request.json();

    if (!memberId || repairAmount === undefined || creditUsed === undefined || cashPaid === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (creditUsed + cashPaid !== repairAmount) {
      return NextResponse.json(
        { error: 'Payment amounts do not match repair amount' },
        { status: 400 }
      );
    }

    if (creditUsed > 0) {
      const canUse = await canUseCreditAmount(memberId, creditUsed);
      if (!canUse.canUse) {
        return NextResponse.json(
          { error: canUse.reason || 'Cannot use credit' },
          { status: 400 }
        );
      }
    }

    const { data: usage, error: usageError } = await supabaseAdmin
      .from('credit_usage')
      .insert({
        member_id: memberId,
        repair_amount: repairAmount,
        credit_used: creditUsed,
        cash_paid: cashPaid,
        parts_cost: partsCost,
        parts_paid_separately: partsCost > 0,
        processed_by: session.user.id,
        repair_description: repairDescription,
        notes,
      })
      .select()
      .single();

    if (usageError) throw usageError;

    if (creditUsed > 0) {
      await supabaseAdmin.rpc('use_credit', {
        p_member_id: memberId,
        p_amount: creditUsed,
        p_usage_id: usage.id,
        p_description: repairDescription || 'Repair service',
      });
    }

    return NextResponse.json({
      success: true,
      usage,
    });
  } catch (error: any) {
    console.error('Process repair error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to process repair' },
      { status: 500 }
    );
  }
}
