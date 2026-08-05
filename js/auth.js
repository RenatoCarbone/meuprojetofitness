// ============================================================
// AUTH.JS — Autenticação Google via Supabase
// ============================================================

// ─── Login com Google ───
async function loginComGoogle() {
  const client = getSupabase();
  if (!client) return false;

  const { error } = await client.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: SITE_URL + '/resultado.html' }
  });

  if (error) { console.error('Google login error:', error.message); return false; }
  return true;
}

// ─── Obter usuário atual ───
async function getUsuarioAtual() {
  const client = getSupabase();
  if (!client) return null;
  try {
    const { data: { session } } = await client.auth.getSession();
    return session?.user || null;
  } catch (e) {
    return null;
  }
}

// ─── Logout ───
async function logout() {
  const client = getSupabase();
  if (client) await client.auth.signOut();
  ['miplanfit_perfil','miplanfit_plan30','miplanfit_plan_id',
   'miplanfit_imc','miplanfit_tmb','miplanfit_tdee'].forEach(k => localStorage.removeItem(k));
  window.location.href = 'index.html';
}

// ─── Salvar plano na nuvem ───
async function salvarPlanoNaNuvem(userId, dados) {
  const client = getSupabase();
  if (!client) return false;

  const { error } = await client.from('planos').upsert({
    user_id  : userId,
    perfil   : dados.perfil,
    plan30   : dados.plan30,
    plan_id  : dados.planId  || 'B',
    imc      : dados.imc     || {},
    tmb      : parseInt(dados.tmb)  || 0,
    tdee     : parseInt(dados.tdee) || 0,
    updated_at: new Date().toISOString()
  }, { onConflict: 'user_id' });

  if (error) { console.error('Erro ao salvar plano:', error.message); return false; }
  console.log('✅ Plano salvo na nuvem');
  return true;
}

// ─── Carregar plano da nuvem ───
async function carregarPlanoNaNuvem(userId) {
  const client = getSupabase();
  if (!client) return null;

  const { data, error } = await client
    .from('planos').select('*').eq('user_id', userId).single();

  if (error) {
    if (error.code !== 'PGRST116') console.error('Erro ao carregar plano:', error.message);
    return null;
  }
  return data;
}

// ─── Salvar progresso na nuvem ───
async function salvarProgressoNaNuvem(userId, progresso) {
  const client = getSupabase();
  if (!client) return false;

  const { error } = await client.from('planos').update({
    dias_completados: progresso.diasCompletados || [],
    streak_actual   : progresso.streakActual    || 0,
    max_streak      : progresso.maxStreak       || 0,
    logros          : progresso.logros          || [],
    updated_at      : new Date().toISOString()
  }).eq('user_id', userId);

  if (error) { console.error('Erro ao salvar progresso:', error.message); return false; }
  return true;
}
