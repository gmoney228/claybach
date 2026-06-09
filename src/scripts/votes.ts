import { track } from '@vercel/analytics';
import { destinationNames } from '../data/destinations';

interface VotesResponse {
  counts: Record<string, number>;
  configured?: boolean;
}

interface VoteResponse {
  ok: boolean;
  configured?: boolean;
  count?: number;
}

/**
 * Determines the unique leader given a counts map.
 * - Returns null if all counts are zero (no real leader).
 * - Returns null when the top score is shared (a tie is not a leader).
 */
function uniqueLeader(counts: Record<string, number>): string | null {
  let leader: string | null = null;
  let max = 0;
  let tied = false;

  for (const name of destinationNames) {
    const c = counts[name] ?? 0;
    if (c > max) {
      leader = name;
      max = c;
      tied = false;
    } else if (c === max && c > 0) {
      tied = true;
    }
  }

  return tied || max === 0 ? null : leader;
}

export function initVotes(): void {
  const buttons = Array.from(
    document.querySelectorAll<HTMLButtonElement>('.vote-btn')
  );
  if (buttons.length === 0) return;

  function applyCounts(counts: Record<string, number>): void {
    const leader = uniqueLeader(counts);

    for (const btn of buttons) {
      const dest = btn.dataset.dest;
      if (!dest) continue;

      const countEl = btn.querySelector<HTMLElement>('.vote-count');
      if (countEl) countEl.textContent = String(counts[dest] ?? 0);

      btn.dataset.leading = leader === dest ? 'true' : 'false';
    }
  }

  async function refresh(): Promise<void> {
    try {
      const res = await fetch('/api/votes', { cache: 'no-store' });
      if (!res.ok) throw new Error(`votes ${res.status}`);
      const data = (await res.json()) as VotesResponse;
      applyCounts(data.counts ?? {});
    } catch (err) {
      console.warn('[votes] failed to fetch', err);
    }
  }

  for (const btn of buttons) {
    btn.addEventListener('click', async () => {
      const dest = btn.dataset.dest;
      if (!dest || btn.disabled) return;

      btn.disabled = true;

      // Optimistic bump so the click feels instant.
      const countEl = btn.querySelector<HTMLElement>('.vote-count');
      const prev = Number(countEl?.textContent ?? '0');
      if (countEl) countEl.textContent = String(prev + 1);

      try {
        const res = await fetch('/api/vote', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ destination: dest }),
        });
        if (!res.ok) throw new Error(`vote ${res.status}`);
        const data = (await res.json()) as VoteResponse;
        track('vote_cast', { destination: dest });
        // Pull authoritative counts so the leader indicator stays in sync.
        if (data.configured) {
          await refresh();
        }
      } catch (err) {
        console.warn('[votes] vote failed', err);
        if (countEl) countEl.textContent = String(prev);
      } finally {
        btn.disabled = false;
      }
    });
  }

  refresh();
}
