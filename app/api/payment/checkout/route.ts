import { NextRequest, NextResponse } from 'next/server';

export async function POST(_req: NextRequest) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001';

  // {CUSTOMER_EMAIL} 是 Creem 模板变量，支付后自动替换为用户真实邮箱
  const res = await fetch('https://api.creem.io/v1/checkouts', {
    method: 'POST',
    headers: {
      'x-api-key': process.env.CREEM_API_KEY!,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      product_id: process.env.CREEM_PRODUCT_ID,
      success_url: `${appUrl}/payment/success?email={CUSTOMER_EMAIL}`,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error('Creem checkout error:', err);
    return NextResponse.json({ error: '创建支付失败，请稍后重试' }, { status: 500 });
  }

  const data = await res.json();
  return NextResponse.json({ url: data.checkout_url });
}
