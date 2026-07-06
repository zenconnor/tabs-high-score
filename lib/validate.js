// Shared input validation for the Pages Functions.
// Rules here mirror the CHECK constraints in schema.sql.

const CONTROL_CHARS = /[\u0000-\u001f\u007f]/;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function validateName(raw) {
  if (typeof raw !== 'string') return null;
  const name = raw.trim();
  if (name.length < 1 || name.length > 24) return null;
  if (CONTROL_CHARS.test(name)) return null;
  return name;
}

export function validateTabs(raw) {
  if (typeof raw !== 'number' || !Number.isInteger(raw)) return null;
  if (raw < 1 || raw > 99999) return null;
  return raw;
}

export function isUuid(s) {
  return typeof s === 'string' && UUID.test(s);
}

// Hosts whose fetch()es may write scores. Browsers always send Origin on a
// POST, so a request lacking one (or bearing a foreign one) is not our page.
// Spoofable with curl -H, so this is a speed bump, not a wall — Turnstile is
// the real gate. localhost/127.0.0.1 keep `wrangler pages dev` working.
const ALLOWED_ORIGIN_HOSTS = new Set([
  'tabshighscore.com',
  'www.tabshighscore.com',
  'localhost',
  '127.0.0.1',
]);

export function isAllowedOrigin(origin) {
  if (typeof origin !== 'string' || origin === '') return false;
  let host;
  try {
    host = new URL(origin).hostname;
  } catch {
    return false;
  }
  return ALLOWED_ORIGIN_HOSTS.has(host);
}

export function getCookie(header, name) {
  if (!header) return null;
  for (const part of header.split(';')) {
    const eq = part.indexOf('=');
    if (eq === -1) continue;
    if (part.slice(0, eq).trim() === name) return part.slice(eq + 1).trim();
  }
  return null;
}
