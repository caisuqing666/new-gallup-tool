import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  const email = req.nextUrl.searchParams.get('email');
  if (!email) return NextResponse.json({ paid: false });

  const { data } = await supabaseAdmin
    .from('user_licenses')
    .select('paid')
    .eq('email', email)
    .single();

  return NextResponse.json({ paid: data?.paid === true });
}
