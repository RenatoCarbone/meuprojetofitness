// ============================================================
// MAILRELAY INTEGRATION — MiPlanFit
// ============================================================

const MAILRELAY_API_URL   = 'https://miplanfit.ipzmarketing.com/api/v1';
const MAILRELAY_API_TOKEN = 'eQfsDz5ZM5uRxiC8hEAyeyctapan6DcxsC5RcToV';
const MAILRELAY_GROUP_FREE    = 2; // Leads Quiz (Gratuitos)
const MAILRELAY_GROUP_PREMIUM = 3; // Clientes Premium (Pagos)

/**
 * Registra um novo lead no Mailrelay (Grupo Leads Quiz ID 2)
 */
async function syncMailrelayLead(email, nombre = '') {
  if (!email || !email.includes('@')) return false;

  try {
    const payload = {
      email: email.trim().toLowerCase(),
      name: nombre ? nombre.trim() : 'amiga',
      group_ids: [MAILRELAY_GROUP_FREE],
      status: 'active'
    };

    const res = await fetch(`${MAILRELAY_API_URL}/subscribers`, {
      method: 'POST',
      headers: {
        'X-AUTH-TOKEN': MAILRELAY_API_TOKEN,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (res.ok) {
      console.log('✅ Lead sincronizado com sucesso no Mailrelay (Grupo Leads Quiz):', email);
      return true;
    } else {
      const err = await res.json().catch(() => ({}));
      console.warn('Mailrelay Sync Warning:', err);
    }
  } catch (e) {
    console.error('Mailrelay Sync Error:', e);
  }
  return false;
}

/**
 * Move o assinante para o Grupo Clientes Premium (ID 3) e remove do Leads Quiz (ID 2)
 */
async function syncMailrelayUpgrade(email, nombre = '') {
  if (!email || !email.includes('@')) return false;

  try {
    const searchRes = await fetch(`${MAILRELAY_API_URL}/subscribers?q[email_eq]=${encodeURIComponent(email.trim().toLowerCase())}`, {
      headers: { 'X-AUTH-TOKEN': MAILRELAY_API_TOKEN, 'Accept': 'application/json' }
    });

    let existingId = null;
    if (searchRes.ok) {
      const list = await searchRes.json();
      if (Array.isArray(list) && list.length > 0) {
        existingId = list[0].id;
      }
    }

    const payload = {
      email: email.trim().toLowerCase(),
      name: nombre ? nombre.trim() : 'amiga',
      group_ids: [MAILRELAY_GROUP_PREMIUM],
      delete_group_ids: [MAILRELAY_GROUP_FREE],
      status: 'active'
    };

    const endpoint = existingId ? `${MAILRELAY_API_URL}/subscribers/${existingId}` : `${MAILRELAY_API_URL}/subscribers`;
    const method   = existingId ? 'PATCH' : 'POST';

    const res = await fetch(endpoint, {
      method,
      headers: {
        'X-AUTH-TOKEN': MAILRELAY_API_TOKEN,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (res.ok) {
      console.log('🎉 Lead promovido com sucesso no Mailrelay para Clientes Premium:', email);
      return true;
    }
  } catch (e) {
    console.error('Mailrelay Upgrade Error:', e);
  }
  return false;
}
