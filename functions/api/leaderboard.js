// Top 100 per window, each browser (cookie) counted once at its best score.
// SQLite guarantee: with a MAX() aggregate, bare columns (name) come from the
// row where the max occurred.
const TOP = (where) => `
  SELECT name, MAX(tabs) AS tabs
  FROM scores
  ${where}
  GROUP BY cookie_id
  ORDER BY tabs DESC
  LIMIT 100`;

// Reads never stampede D1: responses are cached at the edge for 60 s under
// the canonical URL (query strings stripped, so ?x=1 can't bust the cache),
// and browsers re-use their copy for 30 s. See decision-5.md.
export async function onRequestGet({ request, env, waitUntil }) {
  const url = new URL(request.url);
  const cacheKey = url.origin + url.pathname;
  const cache = caches.default;

  const cached = await cache.match(cacheKey);
  if (cached) return cached;

  let hour, day, all;
  try {
    [hour, day, all] = await env.DB.batch([
      env.DB.prepare(TOP("WHERE created_at >= datetime('now', '-1 hour')")),
      env.DB.prepare(TOP("WHERE created_at >= datetime('now', '-1 day')")),
      env.DB.prepare(TOP('')),
    ]);
  } catch {
    return new Response(JSON.stringify({ error: 'Database error.' }), {
      status: 502,
      headers: { 'content-type': 'application/json' },
    });
  }

  const res = new Response(
    JSON.stringify({ hour: hour.results, day: day.results, all: all.results }),
    {
      headers: {
        'content-type': 'application/json',
        'cache-control': 'public, max-age=30, s-maxage=60',
      },
    },
  );
  waitUntil(cache.put(cacheKey, res.clone()));
  return res;
}
