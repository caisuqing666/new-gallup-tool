import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import crypto from 'crypto';

// Creem webhook 不需要 body parser，需要原始 body 验证签名
export async function POST(req: NextRequest) {
  const body = await req.text();

  // 签名验证（有 webhook secret 时启用）
  const webhookSecret = process.env.CREEM_WEBHOOK_SECRET;
  if (webhookSecret) {
    const signature = req.headers.get('creem-signature') || req.headers.get('x-creem-signature') || '';
    const expected = crypto
      .createHmac('sha256', webhookSecret)
      .update(body)
      .digest('hex');
    if (signature !== expected) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }
  }

  let event: Record<string, unknown>;
  try {
    event = JSON.parse(body);
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  // Creem 支付成功事件
  const eventType = event.eventType as string;
  if (eventType === 'checkout.completed' || eventType === 'payment.succeeded') {
    const obj = (event.object || event.data) as Record<string, unknown>;
    const customer = obj?.customer as Record<string, unknown> | undefined;
    const email = (customer?.email as string) || (event.customer_email as string);
    const orderId = (obj?.id as string) || (obj?.order_id as string);

    if (email) {
      const { error } = await supabaseAdmin.from('user_licenses').upsert(
        {
          email,
          paid: true,
          paid_at: new Date().toISOString(),
          creem_order_id: orderId || null,
        },
        { onConflict: 'email' }
      );

      if (error) {
        console.error('Supabase upsert error:', error);
        return NextResponse.json({ error: 'DB error' }, { status: 500 });
      }

      console.log(`✅ 支付成功，已解锁: ${email}`);
    }
  }

  return NextResponse.json({ received: true });
}
