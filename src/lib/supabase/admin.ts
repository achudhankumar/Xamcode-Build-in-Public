import { createClient } from '@supabase/supabase-js';
import { PUBLIC_SUPABASE_URL, SERVICE_ROLE_KEY } from '@/lib/supabase/constants';

export function getServerAdminClient() {
  if (!PUBLIC_SUPABASE_URL || !SERVICE_ROLE_KEY) {
    throw new Error(
      `Database operations require Supabase configuration. Missing: ${!PUBLIC_SUPABASE_URL ? 'NEXT_PUBLIC_SUPABASE_URL' : ''}${!PUBLIC_SUPABASE_URL && !SERVICE_ROLE_KEY ? ', ' : ''}${!SERVICE_ROLE_KEY ? 'SUPABASE_SERVICE_ROLE_KEY' : ''}`,
    );
  }

  return createClient(PUBLIC_SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: {
      persistSession: false,
    },
  });
}
