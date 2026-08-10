// ============================================================
// AUTH.JS — Autenticação Google via Supabase
// ============================================================

// ─── Login com Google ───
async function loginComGoogle() {
  const client = getSupabase();
  if (!client) return false;

  const { error } = await client.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: SITE_URL + '/plano.html' }
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

// Helper: Generar código de referido único y limpio para un usuario
function generarCodigoReferido(userId, nombre) {
  const nameClean = (nombre || 'user').toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 8);
  const shortId = (userId || '').replace(/[^a-z0-9]/gi, '').substring(0, 4);
  return `${nameClean}_${shortId || 'ref'}`;
}

// ─── Salvar plano na nuvem ───
async function salvarPlanoNaNuvem(userId, dados) {
  const client = getSupabase();
  if (!client) return false;

  let email = dados.user_email || dados.perfil?.email || '';
  let nombre = dados.user_name || dados.perfil?.nombre || 'Usuario';

  try {
    const { data: { session } } = await client.auth.getSession();
    if (session?.user?.email) {
      email = session.user.email;
      nombre = session.user.user_metadata?.full_name || session.user.user_metadata?.name || nombre;
    }
  } catch(e) {}

  // Código de referido del usuario actual
  const myRefCode = dados.referral_code || generarCodigoReferido(userId, nombre);

  // Código del patrocinador (quien lo invitó)
  const referredByCode = dados.referred_by || localStorage.getItem('miplanfit_ref_by') || null;

  const payload = {
    user_id       : userId,
    user_email    : email,
    user_name     : nombre,
    referral_code : myRefCode,
    perfil        : dados.perfil,
    plan30        : dados.plan30,
    plan_id       : dados.planId  || 'B',
    imc           : dados.imc     || {},
    tmb           : parseInt(dados.tmb)  || 0,
    tdee          : parseInt(dados.tdee) || 0,
    updated_at    : new Date().toISOString()
  };

  // Solo incluir referred_by si existe y el usuario no se está refiriendo a sí mismo
  if (referredByCode && referredByCode !== myRefCode) {
    payload.referred_by = referredByCode;
  }

  // 1. Forzar upsert de perfil, plan30 e dados do usuário no Supabase
  const { error: upsertErr } = await client
    .from('planos')
    .upsert(payload, { onConflict: 'user_id' });

  if (upsertErr) {
    console.warn('Upsert falhou, executando update direto:', upsertErr.message);
    await client.from('planos').update(payload).eq('user_id', userId);
  }

  console.log('✅ Plano e perfil salvos com sucesso na nuvem:', myRefCode);

  // Se o usuário foi indicado por alguém, processar o crédito da indicação
  if (referredByCode && referredByCode !== myRefCode && !sessionStorage.getItem('miplanfit_ref_credited')) {
    sessionStorage.setItem('miplanfit_ref_credited', 'true');
    await processarIndicacaoNaNuvem(referredByCode, userId);
  }

  return true;
}

// ─── Incrementar contador del patrocinador y dar Premium al llegar a 3 ───
async function processarIndicacaoNaNuvem(referrerCode, newUserId) {
  const client = getSupabase();
  if (!client) return;

  try {
    // Buscar al usuario patrocinador por su código de referido
    const { data: referrer, error: searchErr } = await client
      .from('planos')
      .select('*')
      .eq('referral_code', referrerCode)
      .maybeSingle();

    if (searchErr || !referrer) {
      console.log('Patrocinador no encontrado para el código:', referrerCode);
      return;
    }

    // Evitar que el patrocinador sea la misma persona
    if (referrer.user_id === newUserId) return;

    let list = referrer.referrals_list || [];
    if (!Array.isArray(list)) list = [];

    // Si este nuevo usuario aún no ha sido contado para este patrocinador
    if (!list.includes(newUserId)) {
      list.push(newUserId);
      const newCount = (referrer.referrals_count || 0) + 1;

      // Si llega a 3 referidos y no era Premium, ¡DESBLOQUEAR PREMIUM AUTOMÁTICAMENTE!
      const shouldBePremium = referrer.is_premium || newCount >= 3;

      await client.from('planos').update({
        referrals_count: newCount,
        referrals_list : list,
        is_premium     : shouldBePremium,
        updated_at     : new Date().toISOString()
      }).eq('user_id', referrer.user_id);

      console.log(`🎉 ¡Indicación procesada! ${referrer.user_name} ahora tiene ${newCount} referidos. Premium: ${shouldBePremium}`);
    }

    // Limpiar localStorage de invitación
    localStorage.removeItem('miplanfit_ref_by');
  } catch(e) {
    console.error('Error al procesar indicación:', e);
  }
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
