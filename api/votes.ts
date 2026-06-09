import { kv } from '@vercel/kv';
import { destinationNames } from '../src/data/destinations';

export const config = { runtime: 'edge' };

const keyFor = (dest: string) => `votes:${dest}`;

function emptyCounts(): Record<string, number> {
  return Object.fromEntries(destinationNames.map((d) => [d, 0]));
}

function isKvConfigured(): boolean {
  return Boolean(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);
}

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== 'GET') {
    return new Response('Method not allowed', { status: 405 });
  }

  if (!isKvConfigured()) {
    return Response.json({ counts: emptyCounts(), configured: false });
  }

  try {
    const values = await kv.mget<(number | null)[]>(...destinationNames.map(keyFor));
    const counts: Record<string, number> = {};
    destinationNames.forEach((name, i) => {
      counts[name] = Number(values?.[i] ?? 0);
    });
    return Response.json({ counts, configured: true });
  } catch (err) {
    console.error('[api/votes] kv error', err);
    return Response.json({ counts: emptyCounts(), configured: false });
  }
}
