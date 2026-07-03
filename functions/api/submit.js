import { validateName, validateTabs, isUuid, getCookie } from '../../lib/validate.js';

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });

export async function onRequestPost({ request, env }) {
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

  try {
    await env.DB.prepare(
      'INSERT INTO scores (unique_key, name, tabs, cookie_id) VALUES (?1, ?2, ?3, ?4)'
    ).bind(crypto.randomUUID(), name, tabs, tabid).run();
  } catch {
    return json({ error: 'Database error, try again.' }, 502);
  }

  return json({ ok: true }, 201);
}
