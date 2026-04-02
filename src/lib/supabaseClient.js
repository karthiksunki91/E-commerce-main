import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('⚠️ Warning: Missing Supabase environment variables. App may not function correctly.');
}

// Provide fallback placeholders temporarily to prevent Vercel build crashes
// IMPORTANT: You still need to add these variables in your Vercel Dashboard!
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co', 
  supabaseAnonKey || 'public-anon-key'
);
