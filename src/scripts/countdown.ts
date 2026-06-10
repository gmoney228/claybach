/**
 * Live countdown for the locked trip.
 *
 * Renders one of four states based on the current time:
 *   - PRE   (>24h out)         "T-MINUS  X  DAYS"
 *   - FINAL (<24h, before start) "T-MINUS  HH:MM"
 *   - LIVE  (between start & end) "THE WEEKEND IS LIVE"
 *   - DONE  (after end)        "CLEARED FOR THE WEDDING"
 *
 * The progress bar shows % time elapsed between an anchor day (the day the
 * trip was locked) and the trip start — it climbs from 0% to 100% as the
 * weekend approaches, then sits at 100% during/after the trip.
 */

import { TRIP } from '../data/trip';

/**
 * The progress bar represents the 90-day "final approach" window before
 * the trip. T-90 = 0%. Trip start = 100%. Days outside the window clamp.
 *
 * Inside the window, an ease-in curve (^1.6) accelerates the bar as the
 * trip nears — final 2 weeks visually fill more than the first 6 weeks.
 * That matches the felt experience of a countdown: time creeps, then runs.
 */
const COUNTDOWN_WINDOW_DAYS = 90;
const ANCHOR = TRIP.start.getTime() - COUNTDOWN_WINDOW_DAYS * 24 * 60 * 60 * 1000;
const PROGRESS_EXP = 1.6;

function pad(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

interface CountdownState {
  label: string;
  value: string;
  units: string;
}

function compute(now: number): CountdownState {
  const startMs = TRIP.start.getTime();
  const endMs = TRIP.end.getTime();
  const diff = startMs - now;

  if (now >= endMs) {
    return { label: 'Status', value: 'Cleared', units: 'for the wedding' };
  }
  if (now >= startMs) {
    return { label: 'Status', value: 'LIVE', units: 'the weekend is on' };
  }
  if (diff < 24 * 60 * 60 * 1000) {
    const hours = Math.floor(diff / (60 * 60 * 1000));
    const minutes = Math.floor((diff % (60 * 60 * 1000)) / (60 * 1000));
    return {
      label: 'T\u2013Minus',
      value: `${pad(hours)}:${pad(minutes)}`,
      units: 'until insertion',
    };
  }
  const days = Math.ceil(diff / (24 * 60 * 60 * 1000));
  return {
    label: 'T\u2013Minus',
    value: String(days),
    units: days === 1 ? 'day' : 'days',
  };
}

function progressPct(now: number): number {
  const startMs = TRIP.start.getTime();
  const endMs = TRIP.end.getTime();

  if (now >= endMs) return 100;
  if (now >= startMs) return 100;
  if (now <= ANCHOR) return 0;

  const linear = (now - ANCHOR) / (startMs - ANCHOR);
  const eased = Math.pow(Math.max(0, Math.min(1, linear)), PROGRESS_EXP);
  return eased * 100;
}

export function initCountdown(): void {
  const section = document.querySelector<HTMLElement>('#date-section');
  if (!section) return;

  const labelEl = section.querySelector<HTMLElement>('[data-countdown-label]');
  const valueEl = section.querySelector<HTMLElement>('[data-countdown-value]');
  const unitsEl = section.querySelector<HTMLElement>('[data-countdown-units]');
  const pctEl   = section.querySelector<HTMLElement>('[data-progress-pct]');
  const fillEl  = section.querySelector<HTMLElement>('[data-progress-fill]');

  if (!labelEl || !valueEl || !unitsEl || !pctEl || !fillEl) return;

  function update(): void {
    const now = Date.now();
    const state = compute(now);
    labelEl!.textContent = state.label;
    valueEl!.textContent = state.value;
    unitsEl!.textContent = state.units;

    const pct = progressPct(now);
    fillEl!.style.width = `${pct.toFixed(2)}%`;
    pctEl!.textContent = `${pad(Math.floor(pct))}%`;
  }

  update();
  // One minute is granular enough; the final-day HH:MM state still feels live.
  window.setInterval(update, 60_000);
}
