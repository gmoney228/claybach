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

interface InitOptions {
  /** Path to the world land topojson, served from /public. */
  worldUrl: string;
}

/**
 * Boots the orthographic globe inside the markup rendered by GlobeSection.astro.
 * Continuously rotates around the polar axis, lets the user spin to a random
 * destination, and surfaces a modal with the result.
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

  const projection: GeoProjection = geoOrthographic()
    .scale(170)
    .translate([200, 200])
    .clipAngle(90)
    .rotate([110, -25]);

  const pathGen: GeoPath = geoPath(projection);
  const graticule = geoGraticule10();

  let landFeatures: FeatureCollection<Geometry, GeoJsonProperties> | null = null;
  let spinning = false;
  let landed: Destination | null = null;
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
    g.setAttribute('class', 'pin');

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
    dot.setAttribute('class', 'pin-dot');
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
      nodes.group.style.opacity = visible ? '1' : '0';
      nodes.group.style.pointerEvents = visible ? 'auto' : 'none';

      nodes.dot.classList.toggle('winner', landed?.name === d.name);

      let labelOpacity = 0.9;
      if (!visible) labelOpacity = 0;
      else if (landed) labelOpacity = landed.name === d.name ? 1 : 0.35;
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

  function spin(): void {
    if (spinning) return;
    spinning = true;
    landed = null;
    spinBtn!.disabled = true;

    track('spin_globe');

    const pick = destinations[Math.floor(Math.random() * destinations.length)]!;

    const targetLambda = -pick.coords[0];
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
        landed = pick;
        renderPins();
        showModal(pick);
        baseLambda = ((lambda % 360) + 360) % 360;

        track('spin_result', { destination: pick.name });
        if (pick.isHometown) {
          track('hometown_landed', { destination: pick.name });
        }
      }
    }
    requestAnimationFrame(step);
  }

  function showModal(pick: Destination): void {
    modalDest!.innerHTML = `<em>${pick.name}</em>.`;
    modalLine!.textContent = pick.line;

    if (pick.isHometown) {
      modalEyebrow!.textContent = 'Hometown';
      modalEyebrow!.classList.add('hometown');
      if (scoutingCard) scoutingCard.hidden = false;
    } else {
      modalEyebrow!.textContent = 'The wheel has spoken';
      modalEyebrow!.classList.remove('hometown');
      if (scoutingCard) scoutingCard.hidden = true;
    }

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
    if (landed) track('modal_lock', { destination: landed.name });
    closeModal({ resume: false });
    spinBtn.disabled = false;
    spinning = false;
    lastTs = null;
  });
}
