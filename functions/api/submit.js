import { validateName, validateTabs, isUuid, getCookie, isAllowedOrigin } from '../../lib/validate.js';

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });

// Turnstile is dormant until TURNSTILE_SECRET is set as a Pages env var: with
// no secret we skip verification (local dev, and prod before you configure
// keys). Once the secret is set, a valid token is required. Set the matching
// site key in public/index.html to make the page send tokens.
async function turnstileOk(env, token, ip) {
  if (!env.TURNSTILE_SECRET) return true;
  if (!token) return false;
  const form = new URLSearchParams({ secret: env.TURNSTILE_SECRET, response: token });
  if (ip) form.set('remoteip', ip);
  try {
    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      body: form,
    });
    const data = await res.json();
    return data.success === true;
  } catch {
    return false;
  }
}

export async function onRequestPost({ request, env }) {
  // Cheapest gate first: real browser fetch()es carry an Origin from our own
  // site. Blocks lazy curl and cross-site posts before any work. See lib/validate.js.
  if (!isAllowedOrigin(request.headers.get('Origin'))) {
    return json({ error: 'Forbidden.' }, 403);
  }

  // Requirement 4b: no browser cookie (Incognito that never kept one,
  // cookies disabled, or a bare bot) -> drop the score. See decision-1.md.
  const tabid = getCookie(request.headers.get('Cookie'), 'tabid');
  if (!isUuid(tabid)) {
    return json({ error: 'A browser cookie is required to submit a score.' }, 403);
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Invalid JSON.' }, 400);
  }

  const name = validateName(body?.name);
  const tabs = validateTabs(body?.tabs);
  if (name === null || tabs === null) {
    return json({ error: 'Name must be 1-24 characters and tabs a whole number from 1 to 99999.' }, 400);
  }

  // Human check last among the gates — it costs a network round trip, so only
  // spend it on requests that already look well-formed.
  const ok = await turnstileOk(env, body?.token, request.headers.get('CF-Connecting-IP'));
  if (!ok) {
    return json({ error: 'Verification failed — reload and try again.' }, 403);
  }

  try {
    await env.DB.prepare(
      'INSERT INTO scores (unique_key, name, tabs, cookie_id) VALUES (?1, ?2, ?3, ?4)'
    ).bind(crypto.randomUUID(), name, tabs, tabid).run();
  } catch {
    return json({ error: 'Database error, try again.' }, 502);
  }

  return json({ ok: true }, 201);
}
