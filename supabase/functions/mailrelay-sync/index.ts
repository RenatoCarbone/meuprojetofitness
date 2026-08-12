// ============================================================
// SUPABASE EDGE FUNCTION — mailrelay-sync
// MiPlanFit · Triggered by Database Webhook on table: planos
// ============================================================
//
// TRIGGER EVENTS:
//   INSERT  → Novo lead cadastrado → adiciona ao Grupo 2 (Leads Quiz)
//   UPDATE  → is_premium mudou para true → promove para Grupo 3 (Premium)
//             e remove do Grupo 2 (interrompe sequência de cobrança)
//
// DEPLOY:
//   npx supabase functions deploy mailrelay-sync --project-ref itiqhoyxfsrzbyeejtdn
//
// WEBHOOK (configurar no painel Supabase > Database > Webhooks):
//   Name:    mailrelay-sync-insert
//   Table:   public.planos
//   Events:  INSERT, UPDATE
//   URL:     https://itiqhoyxfsrzbyeejtdn.supabase.co/functions/v1/mailrelay-sync
//   Headers: Authorization: Bearer <SUPABASE_SERVICE_ROLE_KEY>
// ============================================================

const MAILRELAY_BASE   = 'https://miplanfit.ipzmarketing.com/api/v1';
const MAILRELAY_TOKEN  = 'eQfsDz5ZM5uRxiC8hEAyeyctapan6DcxsC5RcToV';
const GROUP_FREE       = 2; // Leads Quiz (Gratuitos)
const GROUP_PREMIUM    = 3; // Clientes Premium (Pagos)

// ── Helpers ──────────────────────────────────────────────────

function mailrelayHeaders(): Record<string, string> {
  return {
    'X-AUTH-TOKEN': MAILRELAY_TOKEN,
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };
}

/** Busca o ID interno do subscriber no Mailrelay pelo e-mail */
async function findSubscriberId(email: string): Promise<number | null> {
  const url = `${MAILRELAY_BASE}/subscribers?q[email_eq]=${encodeURIComponent(email)}&per_page=1`;
  const res  = await fetch(url, { headers: mailrelayHeaders() });
  if (!res.ok) return null;
  const list = await res.json();
  return Array.isArray(list) && list.length > 0 ? list[0].id : null;
}

/** Adiciona o lead ao Grupo 2 (Leads Quiz) */
async function addLeadToFreeGroup(email: string, name: string): Promise<boolean> {
  console.log(`[mailrelay-sync] ADD LEAD → ${email}`);

  // Tenta encontrar se já existe
  const existingId = await findSubscriberId(email);

  const payload = {
    email:      email.trim().toLowerCase(),
    name:       name || 'amiga',
    group_ids:  [GROUP_FREE],
    status:     'active',
  };

  let res: Response;

  if (existingId) {
    // PATCH — já existe, só adiciona ao grupo
    res = await fetch(`${MAILRELAY_BASE}/subscribers/${existingId}`, {
      method:  'PATCH',
      headers: mailrelayHeaders(),
      body:    JSON.stringify(payload),
    });
  } else {
    // POST — novo subscriber
    res = await fetch(`${MAILRELAY_BASE}/subscribers`, {
      method:  'POST',
      headers: mailrelayHeaders(),
      body:    JSON.stringify(payload),
    });
  }

  const ok = res.ok || res.status === 422; // 422 = já cadastrado (idempotente)
  console.log(`[mailrelay-sync] addLead status: ${res.status} | ok: ${ok}`);
  return ok;
}

/** Promove o subscriber para o Grupo 3 (Premium) e remove do Grupo 2 */
async function upgradeToPremiun(email: string, name: string): Promise<boolean> {
  console.log(`[mailrelay-sync] UPGRADE PREMIUM → ${email}`);

  const existingId = await findSubscriberId(email);

  const payload = {
    email:            email.trim().toLowerCase(),
    name:             name || 'amiga',
    group_ids:        [GROUP_PREMIUM],
    delete_group_ids: [GROUP_FREE],
    status:           'active',
  };

  let res: Response;

  if (existingId) {
    res = await fetch(`${MAILRELAY_BASE}/subscribers/${existingId}`, {
      method:  'PATCH',
      headers: mailrelayHeaders(),
      body:    JSON.stringify(payload),
    });
  } else {
    // Subscriber não existia ainda — cria direto como Premium
    res = await fetch(`${MAILRELAY_BASE}/subscribers`, {
      method:  'POST',
      headers: mailrelayHeaders(),
      body:    JSON.stringify(payload),
    });
  }

  const ok = res.ok || res.status === 422;
  console.log(`[mailrelay-sync] upgradePremiun status: ${res.status} | ok: ${ok}`);
  return ok;
}

// ── Handler Principal ─────────────────────────────────────────

Deno.serve(async (req: Request) => {
  // Healthcheck rápido
  if (req.method === 'GET') {
    return new Response(JSON.stringify({ status: 'ok', service: 'mailrelay-sync' }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return new Response('Invalid JSON', { status: 400 });
  }

  // O Supabase Database Webhook envia: { type, table, schema, record, old_record }
  const type      = (body.type as string || '').toUpperCase();   // INSERT | UPDATE
  const record    = body.record    as Record<string, unknown>;
  const oldRecord = body.old_record as Record<string, unknown> | null;

  if (!record) {
    return new Response('No record in payload', { status: 400 });
  }

  const email = (record.user_email as string || '').trim().toLowerCase();
  const name  = (record.user_name  as string || 'amiga').trim();

  if (!email || !email.includes('@')) {
    console.warn('[mailrelay-sync] E-mail inválido ou ausente no record:', email);
    return new Response(JSON.stringify({ skipped: true, reason: 'invalid email' }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    if (type === 'INSERT') {
      // Novo usuário cadastrado → adiciona ao Grupo 2
      await addLeadToFreeGroup(email, name);
      return new Response(JSON.stringify({ ok: true, action: 'lead_added', email }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (type === 'UPDATE') {
      const isPremiumNow = record.is_premium    === true;
      const wasPremium   = oldRecord?.is_premium === true;

      // Só promove se acabou de virar Premium (transição false → true)
      if (isPremiumNow && !wasPremium) {
        await upgradeToPremiun(email, name);
        return new Response(JSON.stringify({ ok: true, action: 'upgraded_to_premium', email }), {
          headers: { 'Content-Type': 'application/json' },
        });
      }

      // UPDATE sem mudança de premium — ignorar
      return new Response(JSON.stringify({ ok: true, action: 'no_action_needed' }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ ok: true, action: 'event_ignored', type }), {
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (err) {
    console.error('[mailrelay-sync] Erro ao processar webhook:', err);
    return new Response(JSON.stringify({ ok: false, error: String(err) }), {
      status:  500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
