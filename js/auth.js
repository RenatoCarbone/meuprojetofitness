// ============================================================
// AUTH.JS — Autenticação Google via Supabase
// ============================================================

// ─── Login com Google ───
async function loginComGoogle() {
  const client = getSupabase();
  if (!client) return false;

  // Preservar datos del perfil del quiz antes del redireccionamiento OAuth
  const localPerfil = localStorage.getItem('miplanfit_perfil');
  if (localPerfil) {
    sessionStorage.setItem('miplanfit_perfil_backup', localPerfil);
    localStorage.setItem('miplanfit_perfil_backup', localPerfil);
  }

  // Preservar código de referido en la URL de redirección de OAuth para que nunca se pierda
  const refCode = localStorage.getItem('miplanfit_ref_by') || sessionStorage.getItem('miplanfit_ref_by') || new URLSearchParams(window.location.search).get('ref');
  let redirectTarget = SITE_URL + '/plano.html';
  if (refCode) {
    redirectTarget += `?ref=${encodeURIComponent(refCode.trim().toLowerCase())}`;
  }

  const { error } = await client.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: redirectTarget }
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

// Helper: Generar código de referido único, limpio y consistente usando el primer nombre
function generarCodigoReferido(userId, nombre) {
  const firstName = (nombre || 'user').trim().split(/\s+/)[0];
  const nameClean = firstName.toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 8) || 'user';
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
      const gName = session.user.user_metadata?.full_name || session.user.user_metadata?.name;
      if (gName && gName.trim() !== '' && gName.toLowerCase() !== 'usuario') {
        nombre = gName;
      } else if (dados.perfil?.nombre && dados.perfil.nombre.trim() !== '' && dados.perfil.nombre.toLowerCase() !== 'usuario') {
        nombre = dados.perfil.nombre;
      } else {
        nombre = session.user.email.split('@')[0];
      }
    }
  } catch(e) {}

  // Código de referido del usuario actual
  const myRefCode = dados.referral_code || generarCodigoReferido(userId, nombre);

  // Código del patrocinador (quien lo invitó)
  const urlRef = new URLSearchParams(window.location.search).get('ref');
  const referredByCode = dados.referred_by || localStorage.getItem('miplanfit_ref_by') || sessionStorage.getItem('miplanfit_ref_by') || urlRef || null;

  // Garantizar que el perfil contenga pesoActual si tiene peso
  if (dados.perfil && dados.perfil.peso && !dados.perfil.pesoActual) {
    dados.perfil.pesoActual = dados.perfil.peso;
  }

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
  if (referredByCode && referredByCode !== myRefCode && !sessionStorage.getItem(`miplanfit_ref_credited_${userId}`)) {
    sessionStorage.setItem(`miplanfit_ref_credited_${userId}`, 'true');
    await processarIndicacaoNaNuvem(referredByCode, userId);
  }

  return true;
}

// ─── Incrementar contador del patrocinador y dar Premium al llegar a 3 ───
async function processarIndicacaoNaNuvem(referrerCode, newUserId) {
  const client = getSupabase();
  if (!client || !referrerCode) return;

  try {
    const cleanCode = referrerCode.trim().toLowerCase();

    // 1. Buscar al usuario patrocinador por su código exacto de referido
    let { data: referrer, error: searchErr } = await client
      .from('planos')
      .select('*')
      .eq('referral_code', cleanCode)
      .maybeSingle();

    // Fallback: si no lo encuentra con coincidencia exacta, buscar por el prefijo del nombre (ej: renato_)
    if (!referrer) {
      const codePart = cleanCode.split('_')[0];
      if (codePart && codePart.length >= 3) {
        const { data: fallbackList } = await client
          .from('planos')
          .select('*')
          .ilike('referral_code', `${codePart}_%`);

        if (fallbackList && fallbackList.length > 0) {
          referrer = fallbackList[0];
        }
      }
    }

    if (searchErr || !referrer) {
      console.log('Patrocinador no encontrado para el código:', cleanCode);
      return;
    }

    // Evitar que el patrocinador sea la misma persona
    if (referrer.user_id === newUserId) return;

    let list = referrer.referrals_list || [];
    if (!Array.isArray(list)) list = [];

    // Si este nuevo usuario aún no ha sido contado para este patrocinador
    if (!list.includes(newUserId)) {
      list.push(newUserId);
    }

    const newCount = list.length;
    const shouldBePremium = referrer.is_premium || newCount >= 3;

    await client.from('planos').update({
      referrals_count: newCount,
      referrals_list : list,
      is_premium     : shouldBePremium,
      updated_at     : new Date().toISOString()
    }).eq('user_id', referrer.user_id);

    console.log(`🎉 ¡Indicación procesada! ${referrer.user_name} ahora tiene ${newCount} referidos. Premium: ${shouldBePremium}`);

    // Limpiar localStorage de invitación
    localStorage.removeItem('miplanfit_ref_by');
    sessionStorage.removeItem('miplanfit_ref_by');
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

  if (error) {
    console.error('Erro ao salvar progresso:', error.message);
    return false;
  }
  return true;
}
