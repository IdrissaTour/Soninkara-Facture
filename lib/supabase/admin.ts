import { createClient } from '@supabase/supabase-js';

const DEFAULT_URL = 'https://wogvyptgitqkiyozafdm.supabase.co';
const DEFAULT_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndvZ3Z5cHRnaXRxa2l5b3phZmRtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjEyODcxOCwiZXhwIjoyMDk3NzA0NzE4fQ.8eW-E6lhC6rKDoLED-6uBsKG01LCooK9Ybd3yOpf0I8';

export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || DEFAULT_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || DEFAULT_SERVICE_KEY;

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
