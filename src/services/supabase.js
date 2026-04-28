// src/services/supabase.js
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://nisrmncoersrhghasiob.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pc3JtbmNvZXJzcmhnaGFzaW9iIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzczMTE1NzcsImV4cCI6MjA5Mjg4NzU3N30.n964XrCxYaTwONpzY3HR-a3fbZkWYvwGcJGgEMYQ1fA';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
