/**
 * Hydrates the Verdict section with the final tallies from the live API.
 *
 * The section renders statically with zero counts; this script fetches
 * /api/votes (place tally) and /api/date-votes (weekend voter rolls) on
 * mount, fills in numbers + voter names, and is done. No polling, no
 * interactivity — it's an archival display.
 */

interface VotesResponse {
  counts: Record<string, number>;
  configured?: boolean;
}

interface DateVotesResponse {
  voters: Record<string, string[]>;
  configured?: boolean;
}

function setText(el: Element | null, value: string): void {
  if (el) el.textContent = value;
}

async function hydrateDestinations(): Promise<void> {
  const rows = document.querySelectorAll<HTMLElement>(
    '[data-panel="destination"] .verdict-row'
  );
  const totalEl = document.querySelector<HTMLElement>(
    '[data-panel="destination"] [data-total-votes]'
  );
  if (rows.length === 0) return;

  try {
    const res = await fetch('/api/votes', { cache: 'no-store' });
    if (!res.ok) throw new Error(`votes ${res.status}`);
    const data = (await res.json()) as VotesResponse;
    const counts = data.counts ?? {};

    let total = 0;
    for (const row of rows) {
      const dest = row.dataset.dest;
      if (!dest) continue;
      const n = counts[dest] ?? 0;
      total += n;
      setText(row.querySelector('[data-count]'), String(n));
    }
    setText(totalEl, `${total} cast`);
  } catch (err) {
    console.warn('[verdict] destination fetch failed', err);
    setText(totalEl, 'tally unavailable');
  }
}

async function hydrateDates(): Promise<void> {
  const rows = document.querySelectorAll<HTMLElement>(
    '[data-panel="weekend"] .verdict-row'
  );
  if (rows.length === 0) return;

  try {
    const res = await fetch('/api/date-votes', { cache: 'no-store' });
    if (!res.ok) throw new Error(`date-votes ${res.status}`);
    const data = (await res.json()) as DateVotesResponse;
    const voters = data.voters ?? {};

    for (const row of rows) {
      const id = row.dataset.date;
      if (!id) continue;
      const names = voters[id] ?? [];
      setText(row.querySelector('[data-count]'), String(names.length));
      setText(
        row.querySelector('[data-voters]'),
        names.length ? names.join(' \u00b7 ') : ''
      );
    }
  } catch (err) {
    console.warn('[verdict] weekend fetch failed', err);
  }
}

export function initVerdict(): void {
  if (!document.querySelector('#verdict-section')) return;
  void hydrateDestinations();
  void hydrateDates();
}
