import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// 浏览器端客户端（只读权限）
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// 服务端客户端（完整权限，仅用于 API Routes）
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
