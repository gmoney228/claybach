import { kv } from '@vercel/kv';
import { partyDateIds } from '../src/data/dates';

export const config = { runtime: 'edge' };

const keyFor = (id: string) => `datevoters:${id}`;

function emptyVoters(): Record<string, string[]> {
  return Object.fromEntries(partyDateIds.map((d) => [d, []]));
}

function isKvConfigured(): boolean {
  return Boolean(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);
}

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== 'GET') {
    return new Response('Method not allowed', { status: 405 });
  }

  if (!isKvConfigured()) {
    return Response.json({ voters: emptyVoters(), configured: false });
  }

  try {
    // SMEMBERS in parallel — one Redis round-trip per date, still fast at edge.
    const results = await Promise.all(
      partyDateIds.map((id) => kv.smembers(keyFor(id)))
    );
    const voters: Record<string, string[]> = {};
    partyDateIds.forEach((id, i) => {
      voters[id] = (results[i] as string[] | null) ?? [];
    });
    return Response.json({ voters, configured: true });
  } catch (err) {
    console.error('[api/date-votes] kv error', err);
    return Response.json({ voters: emptyVoters(), configured: false });
  }
}
