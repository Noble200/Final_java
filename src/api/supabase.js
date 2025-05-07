import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://rgqmwhpxrmrzbffjzkqf.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJncW13aHB4cm1yemJmZmp6a3FmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY1NDc5MDEsImV4cCI6MjA2MjEyMzkwMX0.QU936bAwmnFwuccIHhiDno5y18FumMYMPh7A1KcKNE4'; // La clave anon/public, NO la service_role

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  }
});