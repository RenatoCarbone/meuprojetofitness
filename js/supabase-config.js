// ============================================================
// SUPABASE CONFIG — MiPlanFit
// ============================================================

const SUPABASE_URL  = 'https://itiqhoyxfsrzbyeejtdn.supabase.co';
const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml0aXFob3l4ZnNyemJ5ZWVqdGRuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU5MjI3MzUsImV4cCI6MjEwMTQ5ODczNX0.msAe5xQPgvWPPp6zpP8zgptem5FcnkLhU4x9ovYVzPY';
const SITE_URL      = 'https://meuprojetofitness.pages.dev';

let _supabaseClient = null;

function getSupabase() {
  if (!_supabaseClient) {
    if (!window.supabase) { console.error('Supabase SDK não carregado!'); return null; }
    _supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON);
  }
  return _supabaseClient;
}
