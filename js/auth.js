// ============================================================
// AUTH.JS — Autenticação Google via Supabase
// ============================================================

// ─── Perfil pendente do quiz ───
function perfilQuizValido(perfil) {
  if (!perfil || typeof perfil !== 'object' || Array.isArray(perfil)) return false;
  const keys = Object.keys(perfil);
  if (keys.length === 0) return false;
  return !!(perfil.nombre || perfil.sexo || perfil.edad || perfil.peso || perfil.pesoActual || perfil.objetivo_kg || perfil.altura);
}

function normalizarPerfilQuiz(perfil) {
  if (!perfilQuizValido(perfil)) return null;

  const perfilNormalizado = { ...perfil };
  const numPeso = Number(perfilNormalizado.pesoActual || perfilNormalizado.peso || 0);
  if (numPeso > 0) {
    perfilNormalizado.peso = numPeso;
    perfilNormalizado.pesoActual = numPeso;
  }
  return perfilNormalizado;
}

function parsePerfilQuiz(raw) {
  if (!raw || typeof raw !== 'string') return null;
  try {
    return normalizarPerfilQuiz(JSON.parse(raw));
  } catch (e) {
    return null;
  }
}

function recuperarPerfilQuiz() {
  const fontes = [
    localStorage.getItem('miplanfit_perfil'),
    sessionStorage.getItem('miplanfit_perfil'),
    sessionStorage.getItem('miplanfit_perfil_backup'),
    localStorage.getItem('miplanfit_perfil_backup')
  ];

  for (const fonte of fontes) {
    const perfil = parsePerfilQuiz(fonte);
    if (perfil) return perfil;
  }

  const cookieMatch = document.cookie.match(/(?:^|; )miplanfit_perfil_ck=([^;]+)/);
  if (cookieMatch) {
    try {
      const perfil = normalizarPerfilQuiz(JSON.parse(decodeURIComponent(cookieMatch[1])));
      if (perfil) return perfil;
    } catch (e) {}
  }

  // Compatibilidade temporária com links OAuth criados por versões antigas.
  const url = new URL(window.location.href);
  const legacyPdata = url.searchParams.get('pdata');
  if (legacyPdata) {
    try {
      const perfil = normalizarPerfilQuiz(JSON.parse(decodeURIComponent(escape(atob(legacyPdata.replace(/\s/g, '+'))))));
      if (perfil) return perfil;
    } catch (e) {}
  }

  return null;
}

function removerPdataLegadoDaUrl() {
  const url = new URL(window.location.href);
  if (!url.searchParams.has('pdata')) return;
  url.searchParams.delete('pdata');
  window.history.replaceState({}, document.title, url.pathname + (url.search ? url.search : '') + url.hash);
}

// ─── Login com Google ───
async function loginComGoogle() {
  const client = getSupabase();
  if (!client) return false;

  const localPerfil = localStorage.getItem('miplanfit_perfil') || sessionStorage.getItem('miplanfit_perfil_backup');
  
  try {
    // Save profile to both cookie and localStorage before redirect
    const perfil = JSON.parse(localPerfil || '{}');
    if (perfil.nombre) {
      document.cookie = `miplanfit_perfil=${JSON.stringify(perfil)}; Path=/`;
      localStorage.setItem('miplanfit_perfil', JSON.stringify(perfil));
    }
  } catch(e) {}
  const refCode = localStorage.getItem('miplanfit_ref_by') || sessionStorage.getItem('miplanfit_ref_by') || new URLSearchParams(window.location.search).get('ref');

  let redirectTarget = SITE_URL + '/plano.html';
  const params = new URLSearchParams();

  if (refCode) {
    params.set('ref', refCode.trim().toLowerCase());
  }

  if (localPerfil) {
    try {
      const b64 = btoa(unescape(encodeURIComponent(localPerfil)));
      params.set('pdata', b64);
    } catch(e) {}
  }

  if ([...params].length > 0) {
    redirectTarget += `?${params.toString()}`;
  }

  const { error } = await client.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: redirectTarget }
  });

  if (error) {
    console.error('Google login error:', error.message);
    return false;
  }
  return true;
}

// ─── Login Direto com E-mail ───
async function loginComEmail(emailDigitado) {
  const client = getSupabase();
  const cleanEmail = (emailDigitado || '').trim().toLowerCase();

  if (!cleanEmail || !cleanEmail.includes('@')) {
    alert('Por favor, introduce un e-mail válido.');
    return false;
  }

  const perfil = typeof recuperarPerfilQuiz === 'function' ? recuperarPerfilQuiz() : null;
  const localPlan30 = JSON.parse(localStorage.getItem('miplanfit_plan30') || 'null');
  const localPlanId = localStorage.getItem('miplanfit_plan_id') || 'B';
  const imc = JSON.parse(localStorage.getItem('miplanfit_imc') || '{}');
  const tmb = parseInt(localStorage.getItem('miplanfit_tmb') || '0', 10);
  const tdee = parseInt(localStorage.getItem('miplanfit_tdee') || '0', 10);

  let userId = null;

  if (client) {
    const password = 'MiPlanFitUserPass123!';
    try {
      let { data: authData, error: authErr } = await client.auth.signInWithPassword({
        email: cleanEmail,
        password: password
      });

      if (authErr || !authData?.user) {
        const { data: signUpData } = await client.auth.signUp({
          email: cleanEmail,
          password: password,
          options: {
            data: { full_name: perfil?.nombre || cleanEmail.split('@')[0] }
          }
        });
        if (signUpData?.user) userId = signUpData.user.id;
      } else {
        userId = authData.user.id;
      }
    } catch(e) {}
  }

  if (!userId) {
    const hashStr = cleanEmail.split('').reduce((acc, char) => (acc * 31 + char.charCodeAt(0)) >>> 0, 0).toString(16).padStart(12, '0');
    userId = `e0000000-0000-4000-8000-${hashStr.slice(-12)}`;
  }

  if (client && userId) {
    const payload = {
      user_id: userId,
      user_email: cleanEmail,
      user_name: perfil?.nombre || cleanEmail.split('@')[0],
      referral_code: typeof generarCodigoReferido === 'function' ? generarCodigoReferido(userId, cleanEmail.split('@')[0]) : 'ref',
      perfil: perfil || { nombre: cleanEmail.split('@')[0] },
      plan30: localPlan30 || [],
      plan_id: localPlanId,
      imc,
      tmb,
      tdee,
      updated_at: new Date().toISOString()
    };

    try {
      let { error } = await client.from('planos').upsert(payload, { onConflict: 'user_id' });
      if (error) {
        const { data: existingRow } = await client.from('planos').select('user_id').eq('user_email', cleanEmail).maybeSingle();
        if (existingRow) {
          await client.from('planos').update(payload).eq('user_email', cleanEmail);
        } else {
          await client.from('planos').insert(payload);
        }
      }
    } catch(e) {
      console.warn('Erro ao salvar plano por e-mail:', e);
    }
  }

  localStorage.setItem('miplanfit_active_email', cleanEmail);
  localStorage.setItem('miplanfit_active_userid', userId);
  localStorage.removeItem('miplanfit_quiz_pending_sync');

  window.location.href = 'plano.html';
  return true;
}

// ─── Obter usuário atual ───
async function getUsuarioAtual() {
  const client = getSupabase();
  if (client) {
    try {
      const { data: { session } } = await client.auth.getSession();
      if (session?.user) return session.user;
    } catch (e) {}
  }

  // Fallback para sessão direta de e-mail
  const activeEmail = localStorage.getItem('miplanfit_active_email');
  const activeUserId = localStorage.getItem('miplanfit_active_userid');
  if (activeEmail && activeUserId) {
    return {
      id: activeUserId,
      email: activeEmail,
      user_metadata: { full_name: activeEmail.split('@')[0] }
    };
  }

  return null;
}

// ─── Logout ───
async function logout() {
  const client = getSupabase();
  if (client) await client.auth.signOut().catch(() => {});
  ['miplanfit_perfil','miplanfit_plan30','miplanfit_plan_id',
   'miplanfit_imc','miplanfit_tmb','miplanfit_tdee',
   'miplanfit_active_email','miplanfit_active_userid'].forEach(k => localStorage.removeItem(k));
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
async function salvarPlanoNaNuvem(userId, dados = {}) {
  const client = getSupabase();
  if (!client || !userId) return false;

  const perfil = normalizarPerfilQuiz(dados.perfil);
  if (!perfil) {
    console.error('Perfil inválido: o plano não foi salvo para evitar gravar perfil vazio.', dados.perfil);
    return false;
  }

  let email = dados.user_email || perfil.email || '';
  let nombre = dados.user_name || perfil.nombre || 'Usuario';

  try {
    const { data: { session } } = await client.auth.getSession();
    if (session?.user?.email) {
      email = session.user.email;
      const gName = session.user.user_metadata?.full_name || session.user.user_metadata?.name;
      if (gName && gName.trim() && gName.toLowerCase() !== 'usuario') {
        nombre = gName;
      }
    }
  } catch (e) {
    console.warn('Não foi possível obter a sessão ao salvar o plano.', e);
  }

  const myRefCode = dados.referral_code || generarCodigoReferido(userId, nombre);
  const urlRef = new URLSearchParams(window.location.search).get('ref');
  const referredByCode = dados.referred_by || localStorage.getItem('miplanfit_ref_by') || sessionStorage.getItem('miplanfit_ref_by') || urlRef || null;

  const payload = {
    user_id: userId,
    user_email: email,
    user_name: nombre,
    referral_code: myRefCode,
    perfil,
    updated_at: new Date().toISOString()
  };

  if (Array.isArray(dados.plan30)) payload.plan30 = dados.plan30;
  if (referredByCode && referredByCode !== myRefCode) payload.referred_by = referredByCode;

  // 1. Tentar upsert primeiro
  let { error } = await client
    .from('planos')
    .upsert(payload, { onConflict: 'user_id' });

  // 2. Se o upsert falhar por ausência de índice único em user_id ou erro PostgREST, usar fallback atômico de update/insert
  if (error) {
    console.warn('Upsert direto falhou, usando fallback de update/insert:', error.message);
    const { data: existingRow } = await client.from('planos').select('user_id').eq('user_id', userId).maybeSingle();
    if (existingRow) {
      const res = await client.from('planos').update(payload).eq('user_id', userId);
      error = res.error;
    } else {
      const res = await client.from('planos').insert(payload);
      error = res.error;
    }
  }

  if (error) {
    console.error('Erro ao salvar plano e perfil no Supabase:', error.message, error);
    return false;
  }

  console.log('Plano e perfil salvos com sucesso na nuvem:', myRefCode);

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
    .from('planos').select('*').eq('user_id', userId).maybeSingle();

  if (error) {
    console.error('Erro ao carregar plano:', error.message);
    return null;
  }
  return data || null;
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
