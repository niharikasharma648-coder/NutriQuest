import { createClient } from '@supabase/supabase-js';
import { env } from './env.js';

if (!env.supabaseUrl || !env.supabaseServiceRoleKey) {
  console.warn('[supabase] Admin client created without full credentials; API DB calls will fail until configured.');
}

export const supabaseAdmin = createClient(
  env.supabaseUrl || 'https://placeholder.supabase.co',
  env.supabaseServiceRoleKey || 'placeholder-service-role-key',
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  }
);
