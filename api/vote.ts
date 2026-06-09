import { kv } from '@vercel/kv';
import { destinationNames } from '../src/data/destinations';

export const config = { runtime: 'edge' };

function isKvConfigured(): boolean {
  return Boolean(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);
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

  const destination = (body as { destination?: unknown })?.destination;
  if (typeof destination !== 'string' || !destinationNames.includes(destination)) {
    return new Response('Invalid destination', { status: 400 });
  }

  if (!isKvConfigured()) {
    // Accept the click silently so local dev / pre-KV deploys don't break.
    return Response.json({ ok: true, configured: false, count: 0 });
  }

  try {
    const count = await kv.incr(`votes:${destination}`);
    return Response.json({ ok: true, configured: true, count });
  } catch (err) {
    console.error('[api/vote] kv error', err);
    return Response.json({ ok: false, configured: false }, { status: 500 });
  }
}
