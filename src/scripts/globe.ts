import {
  geoOrthographic,
  geoPath,
  geoGraticule10,
  geoDistance,
  type GeoProjection,
  type GeoPath,
} from 'd3-geo';
import { feature } from 'topojson-client';
import type { Topology, GeometryCollection } from 'topojson-specification';
import type { FeatureCollection, GeoJsonProperties, Geometry } from 'geojson';
import { track } from '@vercel/analytics';

import { destinations, type Destination } from '../data/destinations';
import { TRIP } from '../data/trip';

interface InitOptions {
  /** Path to the world land topojson, served from /public. */
  worldUrl: string;
}

/**
 * Boots the orthographic globe inside the markup rendered by GlobeSection.astro.
 *
 * Post-decision behavior: the winning destination is highlighted permanently,
 * losing destinations stay dimmed on the globe, and the "spin" button always
 * lands on the winner and opens a Field Intel card.
 */
export function initGlobe({ worldUrl }: InitOptions): void {
  const svg     = document.getElementById('globe-svg');
  const pinsG   = document.getElementById('pins');
  const landEl  = document.getElementById('land');
  const gratEl  = document.getElementById('graticule');
  const spinBtn = document.getElementById('spinBtn') as HTMLButtonElement | null;

  const modal         = document.getElementById('modal');
  const modalEyebrow  = document.getElementById('modal-eyebrow');
  const modalDest     = document.getElementById('modal-dest');
  const modalLine     = document.getElementById('modal-line');
  const modalRespin   = document.getElementById('modal-respin');
  const modalLock     = document.getElementById('modal-lock');
  const scoutingCard  = document.getElementById('scouting-report');

  if (
    !svg || !pinsG || !landEl || !gratEl || !spinBtn ||
    !modal || !modalEyebrow || !modalDest || !modalLine || !modalRespin || !modalLock
  ) {
    console.warn('[globe] required elements missing, skipping init');
    return;
  }

  const winner =
    destinations.find((d) => d.name === TRIP.winningDestinationName) ?? null;
  if (!winner) {
    console.warn('[globe] winning destination not found in dataset');
  }

  const projection: GeoProjection = geoOrthographic()
    .scale(170)
    .translate([200, 200])
    .clipAngle(90)
    .rotate([110, -25]);

  const pathGen: GeoPath = geoPath(projection);
  const graticule = geoGraticule10();

  let landFeatures: FeatureCollection<Geometry, GeoJsonProperties> | null = null;
  let spinning = false;
  let baseLambda = 110;
  const basePhi = -25;
  let lastTs: number | null = null;

  const SVG_NS = 'http://www.w3.org/2000/svg';
  const pinNodes = new Map<string, {
    group: SVGGElement;
    dot: SVGCircleElement;
    label: SVGTextElement;
  }>();

  // Build one <g class="pin"> per destination up-front; we just transform/style on each frame.
  for (const d of destinations) {
    const g = document.createElementNS(SVG_NS, 'g');
    const isWinner = winner != null && d.name === winner.name;
    g.setAttribute('class', isWinner ? 'pin winner-pin' : 'pin');

    const [lx, ly] = d.labelOffset;
    // Leader line starts just outside the dot edge and ends just shy of the text.
    const len = Math.hypot(lx, ly);
    const inset = 3.5;   // pixels from pin center → line starts past the dot
    const outset = 3;    // pixels short of label start → leaves a small gap
    const sx = (lx / len) * inset;
    const sy = (ly / len) * inset;
    const ex = lx - (lx / len) * outset;
    const ey = ly - (ly / len) * outset;

    const leader = document.createElementNS(SVG_NS, 'line');
    leader.setAttribute('class', 'pin-leader');
    leader.setAttribute('x1', String(sx));
    leader.setAttribute('y1', String(sy));
    leader.setAttribute('x2', String(ex));
    leader.setAttribute('y2', String(ey));

    const ripple = document.createElementNS(SVG_NS, 'circle');
    ripple.setAttribute('class', 'pin-ripple');
    ripple.setAttribute('cx', '0');
    ripple.setAttribute('cy', '0');

    const dot = document.createElementNS(SVG_NS, 'circle');
    dot.setAttribute('class', isWinner ? 'pin-dot winner' : 'pin-dot');
    dot.setAttribute('cx', '0');
    dot.setAttribute('cy', '0');
    dot.setAttribute('r', '3.2');

    const label = document.createElementNS(SVG_NS, 'text');
    label.setAttribute('class', 'pin-label');
    label.setAttribute('x', String(lx));
    label.setAttribute('y', String(ly));
    label.setAttribute('text-anchor', d.labelAnchor);
    label.textContent = d.name.toUpperCase();

    g.appendChild(leader);
    g.appendChild(ripple);
    g.appendChild(dot);
    g.appendChild(label);
    pinsG.appendChild(g);

    pinNodes.set(d.name, { group: g, dot, label });
  }

  function render(): void {
    if (landFeatures) landEl!.setAttribute('d', pathGen(landFeatures) ?? '');
    gratEl!.setAttribute('d', pathGen(graticule) ?? '');
    renderPins();
  }

  function renderPins(): void {
    const [rotLon, rotLat] = projection.rotate();
    const center: [number, number] = [-rotLon, -rotLat];

    for (const d of destinations) {
      const nodes = pinNodes.get(d.name);
      if (!nodes) continue;

      const visible = geoDistance(d.coords, center) < Math.PI / 2.05;
      const projected = projection(d.coords);
      const [x, y] = projected ?? [0, 0];

      nodes.group.setAttribute('transform', `translate(${x}, ${y})`);
      nodes.group.style.pointerEvents = visible ? 'auto' : 'none';

      // Visibility on the back of the globe still hides the pin completely.
      // Winner stays at full brightness on the front; losers stay dim via CSS.
      const baseOpacity = winner && d.name === winner.name ? 1 : 0.32;
      nodes.group.style.opacity = visible ? String(baseOpacity) : '0';

      // Labels: only the winner shows persistently. Losers' labels fade with the pin.
      let labelOpacity = 0;
      if (visible) {
        labelOpacity = winner && d.name === winner.name ? 1 : 0.5;
      }
      nodes.label.style.opacity = String(labelOpacity);
    }
  }

  // Fetch the world topology once, then start rendering.
  fetch(worldUrl)
    .then((r) => r.json() as Promise<Topology<{ land: GeometryCollection }>>)
    .then((world) => {
      landFeatures = feature(world, world.objects.land) as FeatureCollection<Geometry, GeoJsonProperties>;
      render();
    })
    .catch((err) => {
      console.warn('[globe] world data failed to load, rendering empty sphere', err);
      render();
    });

  // Slow continuous polar-axis rotation.
  function tick(ts: number): void {
    if (lastTs == null) lastTs = ts;
    const dt = ts - lastTs;
    lastTs = ts;

    if (!spinning) {
      baseLambda = (baseLambda + dt * 0.006) % 360;
      projection.rotate([baseLambda, basePhi]);
      render();
    }
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);

  function easeOutCubic(t: number): number {
    return 1 - Math.pow(1 - t, 3);
  }

  // Post-decision: spin always lands on the winner.
  function spin(): void {
    if (spinning || !winner) return;
    spinning = true;
    spinBtn!.disabled = true;

    track('spin_globe');

    const targetLambda = -winner.coords[0];
    const startLambda = projection.rotate()[0];

    let lambdaDelta = (((targetLambda - startLambda) % 360) + 360) % 360;
    lambdaDelta += 720;

    const duration = 2400;
    const startTs = performance.now();

    function step(now: number): void {
      const t = Math.min((now - startTs) / duration, 1);
      const eased = easeOutCubic(t);
      const lambda = startLambda + lambdaDelta * eased;
      projection.rotate([lambda, basePhi]);
      render();

      if (t < 1) {
        requestAnimationFrame(step);
      } else {
        renderPins();
        showModal(winner!);
        baseLambda = ((lambda % 360) + 360) % 360;

        track('spin_result', { destination: winner!.name });
      }
    }
    requestAnimationFrame(step);
  }

  function showModal(pick: Destination): void {
    modalDest!.innerHTML = `<em>${pick.name}</em>.`;
    modalLine!.textContent = pick.line;

    modalEyebrow!.textContent = 'Destination locked';
    modalEyebrow!.classList.add('locked');
    // Field Intel card is always shown for the winner.
    if (scoutingCard) scoutingCard.hidden = false;

    modal!.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function closeModal({ resume = true } = {}): void {
    modal!.classList.remove('open');
    document.body.style.overflow = '';
    if (resume) {
      spinning = false;
      spinBtn!.disabled = false;
      lastTs = null;
    }
  }

  spinBtn.addEventListener('click', spin);
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('open')) closeModal();
  });
  modalRespin.addEventListener('click', () => {
    closeModal();
    setTimeout(spin, 180);
  });
  modalLock.addEventListener('click', () => {
    if (winner) track('modal_lock', { destination: winner.name });
    closeModal({ resume: false });
    spinBtn.disabled = false;
    spinning = false;
    lastTs = null;
  });
}
