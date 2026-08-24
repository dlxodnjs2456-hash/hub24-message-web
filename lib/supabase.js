import { createClient } from '@supabase/supabase-js';

const url = 'https://xpsomjclpwklfqatjxxt.supabase.co';
const key = 'sb_publishable_uK5OlDbhDINzMnhflDpYrg_yGmDS7hO';

export const supabase = createClient(url, key, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
  realtime: {
    params: { eventsPerSecond: 20 },
  },
});
