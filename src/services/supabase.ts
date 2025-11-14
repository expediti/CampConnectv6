import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://zuppeovnrixndolhzbnw.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp1cHBlb3Zucml4bmRvbGh6Ym53Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI3OTQxNjAsImV4cCI6MjA3ODM3MDE2MH0.LCWSp-fBRzbj1GDZUCmYvVZdPOACXcUyOkxuXM1A0os';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);