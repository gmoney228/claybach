import { kv } from '@vercel/kv';
import { partyDateIds } from '../src/data/dates';

export const config = { runtime: 'edge' };

const NAME_MAX = 32;

function isKvConfigured(): boolean {
  return Boolean(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);
}

function normalizeName(raw: unknown): string | null {
  if (typeof raw !== 'string') return null;
  // Collapse internal whitespace and trim — keeps "Brock " and "Brock" from
  // becoming two distinct set members.
  const trimmed = raw.replace(/\s+/g, ' ').trim().slice(0, NAME_MAX);
  return trimmed.length === 0 ? null : trimmed;
}

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return new Response('Invalid JSON', { status: 400 });
  }

  const { date, name, action } = (body as {
    date?: unknown;
    name?: unknown;
    action?: unknown;
  }) ?? {};

  if (typeof date !== 'string' || !partyDateIds.includes(date)) {
    return new Response('Invalid date', { status: 400 });
  }

  const cleanName = normalizeName(name);
  if (!cleanName) {
    return new Response('Name required', { status: 400 });
  }

  if (action !== 'add' && action !== 'remove') {
    return new Response('Invalid action', { status: 400 });
  }

  if (!isKvConfigured()) {
    // Local dev / pre-KV deploys: accept the click so the UI is still useful.
    return Response.json({ ok: true, configured: false, voters: [], count: 0 });
  }

  try {
    const key = `datevoters:${date}`;
    if (action === 'add') {
      await kv.sadd(key, cleanName);
    } else {
      await kv.srem(key, cleanName);
    }
    const voters = ((await kv.smembers(key)) as string[] | null) ?? [];
    return Response.json({ ok: true, configured: true, voters, count: voters.length });
  } catch (err) {
    console.error('[api/date-vote] kv error', err);
    return Response.json({ ok: false, configured: false }, { status: 500 });
  }
}
