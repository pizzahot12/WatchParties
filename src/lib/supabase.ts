import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

let client: SupabaseClient;

if (supabaseUrl && supabaseAnonKey) {
  client = createClient(supabaseUrl, supabaseAnonKey);
} else {
  console.warn(
    'Supabase credentials not found. Using mock client. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file.'
  );
  
  // Create a dummy client that prevents crashes but logs warnings
  const mockChannel = {
    on: () => mockChannel,
    subscribe: () => {},
    unsubscribe: () => {},
    send: () => Promise.resolve(),
  };

  client = {
    channel: () => mockChannel,
    removeChannel: () => {},
    auth: {
      signInWithOAuth: () => {
        console.warn('Supabase Auth not configured');
        return Promise.resolve({ error: { message: 'Supabase not configured' } });
      },
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
      getSession: () => Promise.resolve({ data: { session: null }, error: null }),
    },
    from: () => ({
      select: () => ({
        ilike: () => Promise.resolve({ data: [], error: null }),
      }),
    }),
  } as unknown as SupabaseClient;
}

export const supabase = client;
