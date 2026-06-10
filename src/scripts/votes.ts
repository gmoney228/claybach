import { track } from '@vercel/analytics';
import { destinationNames } from '../data/destinations';
import { partyDateIds } from '../data/dates';

interface VotesResponse {
  counts: Record<string, number>;
  configured?: boolean;
}

interface VoteResponse {
  ok: boolean;
  configured?: boolean;
  count?: number;
}

export interface PollConfig {
  /** Selector for the button list — each button must carry a `data-${dataAttr}` id. */
  buttonSelector: string;
  /** Camel-cased dataset attribute name on each button (e.g. "dest" → button.dataset.dest). */
  dataAttr: string;
  /** Allowed ids — anything else is treated as invalid and ignored. */
  validIds: readonly string[];
  /** GET endpoint that returns { counts, configured }. */
  votesEndpoint: string;
  /** POST endpoint that accepts { [bodyKey]: id } and returns { ok, configured, count }. */
  voteEndpoint: string;
  /** JSON body key on the POST payload (e.g. "destination" or "date"). */
  bodyKey: string;
  /** @vercel/analytics event name fired on a successful click. */
  trackEvent: string;
}

/**
 * Determines the unique leader given a counts map.
 * - Returns null if all counts are zero (no real leader).
 * - Returns null when the top score is shared (a tie is not a leader).
 */
function uniqueLeader(
  counts: Record<string, number>,
  validIds: readonly string[]
): string | null {
  let leader: string | null = null;
  let max = 0;
  let tied = false;

  for (const id of validIds) {
    const c = counts[id] ?? 0;
    if (c > max) {
      leader = id;
      max = c;
      tied = false;
    } else if (c === max && c > 0) {
      tied = true;
    }
  }

  return tied || max === 0 ? null : leader;
}

export function initPoll(config: PollConfig): void {
  const buttons = Array.from(
    document.querySelectorAll<HTMLButtonElement>(config.buttonSelector)
  );
  if (buttons.length === 0) return;

  function applyCounts(counts: Record<string, number>): void {
    const leader = uniqueLeader(counts, config.validIds);

    for (const btn of buttons) {
      const id = btn.dataset[config.dataAttr];
      if (!id) continue;

      const countEl = btn.querySelector<HTMLElement>('.vote-count');
      if (countEl) countEl.textContent = String(counts[id] ?? 0);

      btn.dataset.leading = leader === id ? 'true' : 'false';
    }
  }

  async function refresh(): Promise<void> {
    try {
      const res = await fetch(config.votesEndpoint, { cache: 'no-store' });
      if (!res.ok) throw new Error(`votes ${res.status}`);
      const data = (await res.json()) as VotesResponse;
      applyCounts(data.counts ?? {});
    } catch (err) {
      console.warn(`[${config.trackEvent}] failed to fetch`, err);
    }
  }

  for (const btn of buttons) {
    btn.addEventListener('click', async () => {
      const id = btn.dataset[config.dataAttr];
      if (!id || btn.disabled) return;

      btn.disabled = true;

      // Optimistic bump so the click feels instant.
      const countEl = btn.querySelector<HTMLElement>('.vote-count');
      const prev = Number(countEl?.textContent ?? '0');
      if (countEl) countEl.textContent = String(prev + 1);

      try {
        const res = await fetch(config.voteEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ [config.bodyKey]: id }),
        });
        if (!res.ok) throw new Error(`vote ${res.status}`);
        const data = (await res.json()) as VoteResponse;
        track(config.trackEvent, { [config.bodyKey]: id });
        // Pull authoritative counts so the leader indicator stays in sync.
        if (data.configured) {
          await refresh();
        }
      } catch (err) {
        console.warn(`[${config.trackEvent}] vote failed`, err);
        if (countEl) countEl.textContent = String(prev);
      } finally {
        btn.disabled = false;
      }
    });
  }

  refresh();
}

/** Place-vote wiring used by VoteSection.astro. */
export function initVotes(): void {
  initPoll({
    buttonSelector: '.vote-btn',
    dataAttr: 'dest',
    validIds: destinationNames,
    votesEndpoint: '/api/votes',
    voteEndpoint: '/api/vote',
    bodyKey: 'destination',
    trackEvent: 'vote_cast',
  });
}

// ──────────────────────────────────────────────────────────────────────────────
// Date vote — different model entirely from the place vote:
//   - Each voter enters their name (persisted in localStorage).
//   - Clicking a date toggles their membership in that date's voter set.
//   - Each button shows the list of voters underneath the label.
// ──────────────────────────────────────────────────────────────────────────────

const NAME_STORAGE_KEY = 'claybach:voter-name';
const NAME_MAX = 32;

interface DateVotesResponse {
  voters: Record<string, string[]>;
  configured?: boolean;
}

interface DateVoteResponse {
  ok: boolean;
  configured?: boolean;
  voters?: string[];
  count?: number;
}

function normalizeName(raw: string): string {
  return raw.replace(/\s+/g, ' ').trim().slice(0, NAME_MAX);
}

function getStoredName(): string {
  try {
    return normalizeName(localStorage.getItem(NAME_STORAGE_KEY) ?? '');
  } catch {
    return '';
  }
}

function storeName(name: string): void {
  try {
    if (name) localStorage.setItem(NAME_STORAGE_KEY, name);
    else localStorage.removeItem(NAME_STORAGE_KEY);
  } catch {
    /* private mode / disabled storage — silently ignore */
  }
}

export function initDateVotes(): void {
  const grid = document.querySelector<HTMLElement>('#date-vote-grid');
  if (!grid) return;

  const buttons = Array.from(
    grid.querySelectorAll<HTMLButtonElement>('.date-vote-btn')
  );
  if (buttons.length === 0) return;

  const nameInput = document.querySelector<HTMLInputElement>('#date-voter-name');
  if (!nameInput) return;

  // Local cache so optimistic updates feel instant.
  let votersByDate: Record<string, string[]> = Object.fromEntries(
    partyDateIds.map((d) => [d, []])
  );

  // Restore the voter's name if they've been here before.
  const initial = getStoredName();
  if (initial) nameInput.value = initial;

  function currentName(): string {
    return normalizeName(nameInput!.value);
  }

  function applyUI(): void {
    const me = currentName();
    const meLower = me.toLowerCase();

    const counts: Record<string, number> = {};
    for (const id of partyDateIds) {
      counts[id] = (votersByDate[id] ?? []).length;
    }
    const leader = uniqueLeader(counts, partyDateIds);

    for (const btn of buttons) {
      const id = btn.dataset.date;
      if (!id) continue;

      const voters = votersByDate[id] ?? [];
      const mine = me !== '' && voters.some((v) => v.toLowerCase() === meLower);

      btn.dataset.leading = leader === id ? 'true' : 'false';
      btn.dataset.mine = mine ? 'true' : 'false';
      btn.setAttribute(
        'aria-pressed',
        mine ? 'true' : 'false'
      );

      const countEl = btn.querySelector<HTMLElement>('.vote-count');
      if (countEl) countEl.textContent = String(voters.length);

      const votersEl = btn.querySelector<HTMLElement>('.date-vote-voters');
      if (votersEl) {
        // Me first, then everyone else alphabetically — keeps the user grounded.
        const sorted = [...voters].sort((a, b) => {
          if (me && a.toLowerCase() === meLower) return -1;
          if (me && b.toLowerCase() === meLower) return 1;
          return a.localeCompare(b);
        });

        votersEl.replaceChildren();
        sorted.forEach((v, i) => {
          const span = document.createElement('span');
          const isMine = me !== '' && v.toLowerCase() === meLower;
          span.className = isMine
            ? 'date-vote-voter date-vote-voter-mine'
            : 'date-vote-voter';
          span.textContent = v;
          votersEl.appendChild(span);
          if (i < sorted.length - 1) {
            const sep = document.createElement('span');
            sep.className = 'date-vote-voter-sep';
            sep.textContent = ' · ';
            votersEl.appendChild(sep);
          }
        });
      }
    }
  }

  async function refresh(): Promise<void> {
    try {
      const res = await fetch('/api/date-votes', { cache: 'no-store' });
      if (!res.ok) throw new Error(`date-votes ${res.status}`);
      const data = (await res.json()) as DateVotesResponse;
      votersByDate = Object.fromEntries(
        partyDateIds.map((id) => [id, data.voters?.[id] ?? []])
      );
      applyUI();
    } catch (err) {
      console.warn('[date_vote_cast] failed to fetch', err);
    }
  }

  nameInput.addEventListener('input', () => {
    storeName(currentName());
    // Re-render so existing "you" highlights update as the name changes.
    applyUI();
  });

  function flashNameInput(): void {
    nameInput!.classList.add('date-voter-input-error');
    nameInput!.focus();
    window.setTimeout(
      () => nameInput!.classList.remove('date-voter-input-error'),
      1400
    );
  }

  for (const btn of buttons) {
    btn.addEventListener('click', async () => {
      const id = btn.dataset.date;
      if (!id || btn.disabled) return;

      const me = currentName();
      if (!me) {
        flashNameInput();
        return;
      }
      // Persist the name now even if they hadn't blurred the input yet.
      storeName(me);

      const meLower = me.toLowerCase();
      const current = votersByDate[id] ?? [];
      const alreadyIn = current.some((v) => v.toLowerCase() === meLower);
      const action: 'add' | 'remove' = alreadyIn ? 'remove' : 'add';

      // Optimistic update.
      const prev = [...current];
      votersByDate[id] =
        action === 'add'
          ? [...current, me]
          : current.filter((v) => v.toLowerCase() !== meLower);
      applyUI();

      btn.disabled = true;
      try {
        const res = await fetch('/api/date-vote', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ date: id, name: me, action }),
        });
        if (!res.ok) throw new Error(`date-vote ${res.status}`);
        const data = (await res.json()) as DateVoteResponse;
        track('date_vote_cast', { date: id, action });
        if (data.configured && Array.isArray(data.voters)) {
          votersByDate[id] = data.voters;
          applyUI();
        }
      } catch (err) {
        console.warn('[date_vote_cast] vote failed', err);
        votersByDate[id] = prev;
        applyUI();
      } finally {
        btn.disabled = false;
      }
    });
  }

  applyUI();
  refresh();
}
