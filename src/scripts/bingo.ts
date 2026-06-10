/**
 * Click-to-mark behavior for the bingo card.
 *
 * Marks persist in localStorage under "claybach:bingo:v1" as a JSON array
 * of marked indices, so the same crew member's card survives reloads.
 * No server state — this is intentionally a per-device toy.
 *
 * Wins (5-in-a-row across, down, diagonal) flip a `data-bingo="true"` flag
 * on the section, which CSS uses to light up a "BINGO" stamp.
 */

const STORAGE_KEY = 'claybach:bingo:v1';
const FREE_INDEX = 12;

// All winning lines in a 5x5 grid: 5 rows, 5 cols, 2 diagonals.
const LINES: readonly (readonly number[])[] = [
  [0, 1, 2, 3, 4],
  [5, 6, 7, 8, 9],
  [10, 11, 12, 13, 14],
  [15, 16, 17, 18, 19],
  [20, 21, 22, 23, 24],
  [0, 5, 10, 15, 20],
  [1, 6, 11, 16, 21],
  [2, 7, 12, 17, 22],
  [3, 8, 13, 18, 23],
  [4, 9, 14, 19, 24],
  [0, 6, 12, 18, 24],
  [4, 8, 12, 16, 20],
];

function loadMarks(): Set<number> {
  // FREE space is always marked.
  const marks = new Set<number>([FREE_INDEX]);
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const arr = JSON.parse(raw) as number[];
      for (const n of arr) {
        if (Number.isInteger(n) && n >= 0 && n <= 24) marks.add(n);
      }
    }
  } catch {
    /* private mode / corrupted storage — silently ignore */
  }
  return marks;
}

function saveMarks(marks: Set<number>): void {
  try {
    // Exclude the FREE cell — it's always implicit.
    const arr = Array.from(marks).filter((i) => i !== FREE_INDEX);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(arr));
  } catch {
    /* ignore */
  }
}

function hasBingo(marks: Set<number>): boolean {
  return LINES.some((line) => line.every((i) => marks.has(i)));
}

export function initBingo(): void {
  const section = document.querySelector<HTMLElement>('#bingo-section');
  if (!section) return;

  const cells = Array.from(
    section.querySelectorAll<HTMLButtonElement>('.bingo-cell')
  );
  if (cells.length === 0) return;

  const marks = loadMarks();

  function applyMarks(): void {
    for (const cell of cells) {
      const idx = Number(cell.dataset.idx);
      const marked = marks.has(idx);
      cell.dataset.marked = marked ? 'true' : 'false';
      cell.setAttribute('aria-pressed', marked ? 'true' : 'false');
    }
    section!.dataset.bingo = hasBingo(marks) ? 'true' : 'false';
  }

  for (const cell of cells) {
    const idx = Number(cell.dataset.idx);
    // FREE cell is locked open; clicks do nothing.
    if (idx === FREE_INDEX) {
      cell.disabled = false; // still focusable for keyboard a11y
      continue;
    }
    cell.addEventListener('click', () => {
      if (marks.has(idx)) marks.delete(idx);
      else marks.add(idx);
      saveMarks(marks);
      applyMarks();
    });
  }

  applyMarks();

  // Reset button (small "clear card" affordance).
  const resetBtn = section.querySelector<HTMLButtonElement>('#bingo-reset');
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      marks.clear();
      marks.add(FREE_INDEX);
      saveMarks(marks);
      applyMarks();
    });
  }
}
