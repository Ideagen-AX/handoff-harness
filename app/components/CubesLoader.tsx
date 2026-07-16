"use client";

// Morphing Cubes loader — an isometric sliding-puzzle cube cluster, ported from
// the Mazlan Loader Lab / Builder "cubes" concept. Cubes slide one slot at a
// time into adjacent gaps; moves run concurrently (one per gap), never colliding.
// Canvas + requestAnimationFrame, DPR-aware, sized to its container.
import { useEffect, useRef } from "react";

type Hsl = { h: number; s: number; l: number };
type Cell = { x: number; y: number; z: number };
type Cube = Cell & { ci: number; cameFrom: Cell | null };
type Move = { cube: Cube; from: Cell; to: Cell; start: number; dur: number };
type Sim = {
  cells: Cell[];
  cellset: Record<string, boolean>;
  occ: Record<string, Cube>;
  cubes: Cube[];
  holes: number;
  moves: Move[];
  nextStartAt: number;
};
type Params = {
  size: number; rows: number; depth: number; holes: number;
  moveDur: number; pause: number; easing: string;
  opacity: number; saturation: number; lightness: number; colors: string[];
};

// Locked-in values exported from the Loader Lab.
const DEFAULTS: Params = {
  size: 30, rows: 5, depth: 4, holes: 10, moveDur: 650, pause: 0,
  easing: "easeInOutCirc", opacity: 90, saturation: 100, lightness: 20,
  colors: ["#3248A7", "#1B838B", "#135D63", "#E30072", "#9533AE", "#6E2A87", "#8B9FF2", "#4766EB"],
};

// Helix palette (Blue / Teal / Pink / blended Purple).
const PALETTE = [
  "#8B9FF2", "#4766EB", "#3248A7", "#6FB1B6", "#1B838B", "#135D63",
  "#ED5EA6", "#E30072", "#A10051", "#BC7ECC", "#9533AE", "#6E2A87",
];
const WIDTH_MIN = 3, WIDTH_MAX = 5, DEPTH_MIN = 1;

const C1 = 1.70158, C2 = C1 * 1.525;
const EASINGS: Record<string, (t: number) => number> = {
  cosine: (t) => (1 - Math.cos(t * Math.PI)) / 2,
  linear: (t) => t,
  easeInCubic: (t) => t * t * t,
  easeOutCubic: (t) => 1 - Math.pow(1 - t, 3),
  easeInOutCubic: (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
  easeInOutBack: (t) =>
    t < 0.5
      ? (Math.pow(2 * t, 2) * ((C2 + 1) * 2 * t - C2)) / 2
      : (Math.pow(2 * t - 2, 2) * ((C2 + 1) * (2 * t - 2) + C2) + 2) / 2,
  spring: (t) => 1 - Math.cos(t * Math.PI * 3.5) * Math.exp(-t * 4),
  easeInOutCirc: (t) =>
    t < 0.5 ? (1 - Math.sqrt(1 - Math.pow(2 * t, 2))) / 2 : (Math.sqrt(1 - Math.pow(-2 * t + 2, 2)) + 1) / 2,
};

function hexToHsl(hex: string): Hsl {
  const n = parseInt(hex.slice(1), 16);
  const r = ((n >> 16) & 255) / 255, g = ((n >> 8) & 255) / 255, b = (n & 255) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0; const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h /= 6;
  }
  return { h, s, l };
}
function hslToRgb(h: number, s: number, l: number) {
  if (s === 0) { const v = l * 255; return { r: v, g: v, b: v }; }
  const hue2rgb = (p: number, q: number, t: number) => {
    if (t < 0) t += 1; if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s, p = 2 * l - q;
  return { r: hue2rgb(p, q, h + 1 / 3) * 255, g: hue2rgb(p, q, h) * 255, b: hue2rgb(p, q, h - 1 / 3) * 255 };
}
function faceColor(r: number, g: number, b: number, f: number) {
  return "rgb(" + Math.round(Math.min(255, r * f)) + "," +
    Math.round(Math.min(255, g * f)) + "," + Math.round(Math.min(255, b * f)) + ")";
}
function drawCube(ctx: CanvasRenderingContext2D, sx: number, sy: number, tw: number, th: number, ch: number, r: number, g: number, b: number) {
  const hw = tw / 2, hh = th / 2;
  const Tx = sx, Ty = sy - hh, Rx = sx + hw, Ry = sy, Bx = sx, By = sy + hh, Lx = sx - hw, Ly = sy;
  ctx.fillStyle = faceColor(r, g, b, 0.66);
  ctx.beginPath(); ctx.moveTo(Lx, Ly); ctx.lineTo(Bx, By); ctx.lineTo(Bx, By + ch); ctx.lineTo(Lx, Ly + ch); ctx.closePath(); ctx.fill();
  ctx.fillStyle = faceColor(r, g, b, 0.82);
  ctx.beginPath(); ctx.moveTo(Bx, By); ctx.lineTo(Rx, Ry); ctx.lineTo(Rx, Ry + ch); ctx.lineTo(Bx, By + ch); ctx.closePath(); ctx.fill();
  ctx.fillStyle = faceColor(r, g, b, 1);
  ctx.beginPath(); ctx.moveTo(Tx, Ty); ctx.lineTo(Rx, Ry); ctx.lineTo(Bx, By); ctx.lineTo(Lx, Ly); ctx.closePath(); ctx.fill();
}

const ckey = (x: number, y: number, z: number) => x + "," + y + "," + z;
const DIRS = [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]];
function shuffle<T>(a: T[]): T[] {
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}

function createSim(rows: number, maxDepth: number, holes: number, now: number): Sim {
  const cells: Cell[] = [];
  for (let z = 0; z < rows; z++) {
    const w = WIDTH_MIN + Math.floor(Math.random() * (WIDTH_MAX - WIDTH_MIN + 1));
    const xStart = -Math.floor(w / 2);
    for (let x = xStart; x < xStart + w; x++) {
      const d = DEPTH_MIN + Math.floor(Math.random() * (maxDepth - DEPTH_MIN + 1));
      const yStart = -Math.floor(d / 2);
      for (let y = yStart; y < yStart + d; y++) cells.push({ x, y, z });
    }
  }
  const cellset: Record<string, boolean> = {};
  cells.forEach((c) => { cellset[ckey(c.x, c.y, c.z)] = true; });
  const nHoles = Math.min(holes, cells.length - 1);
  const holeIdx: Record<number, boolean> = {}; let picked = 0;
  while (picked < nHoles) { const i = Math.floor(Math.random() * cells.length); if (!holeIdx[i]) { holeIdx[i] = true; picked++; } }
  const occ: Record<string, Cube> = {}; const cubes: Cube[] = [];
  cells.forEach((c, i) => {
    if (holeIdx[i]) return;
    const cube: Cube = { ci: i, x: c.x, y: c.y, z: c.z, cameFrom: null };
    occ[ckey(c.x, c.y, c.z)] = cube;
    cubes.push(cube);
  });
  return { cells, cellset, occ, cubes, holes: nHoles, moves: [], nextStartAt: now };
}
function tryStartMove(state: Sim, now: number, dur: number): boolean {
  const reserved: Record<string, boolean> = {}; const busy: Cube[] = [];
  state.moves.forEach((m) => { reserved[ckey(m.to.x, m.to.y, m.to.z)] = true; busy.push(m.cube); });
  const gaps: Cell[] = [];
  state.cells.forEach((c) => { const k = ckey(c.x, c.y, c.z); if (!state.occ[k] && !reserved[k]) gaps.push(c); });
  shuffle(gaps);
  for (const gap of gaps) {
    let cands: { cell: Cell; cube: Cube }[] = [];
    for (const [dx, dy, dz] of DIRS) {
      const nx = gap.x + dx, ny = gap.y + dy, nz = gap.z + dz, k = ckey(nx, ny, nz);
      if (state.cellset[k] && state.occ[k]) {
        const cube = state.occ[k];
        if (busy.indexOf(cube) === -1) cands.push({ cell: { x: nx, y: ny, z: nz }, cube });
      }
    }
    if (!cands.length) continue;
    const fresh = cands.filter((c) => {
      const cf = c.cube.cameFrom;
      return !(cf && cf.x === gap.x && cf.y === gap.y && cf.z === gap.z);
    });
    if (fresh.length) cands = fresh;
    const pick = cands[Math.floor(Math.random() * cands.length)];
    state.moves.push({ cube: pick.cube, from: pick.cell, to: { x: gap.x, y: gap.y, z: gap.z }, start: now, dur });
    return true;
  }
  return false;
}
function finalizeMove(state: Sim, m: Move) {
  delete state.occ[ckey(m.from.x, m.from.y, m.from.z)];
  m.cube.x = m.to.x; m.cube.y = m.to.y; m.cube.z = m.to.z;
  m.cube.cameFrom = { x: m.from.x, y: m.from.y, z: m.from.z };
  state.occ[ckey(m.to.x, m.to.y, m.to.z)] = m.cube;
}
function cubesDraw(ctx: CanvasRenderingContext2D, state: Sim, p: Params, now: number, cssW: number, cssH: number) {
  ctx.clearRect(0, 0, cssW, cssH);
  state.moves = state.moves.filter((m) => {
    if (now - m.start >= m.dur) { finalizeMove(state, m); return false; }
    return true;
  });
  let guard = 0;
  while (state.moves.length < state.holes && now >= state.nextStartAt && guard++ < state.holes) {
    if (tryStartMove(state, now, p.moveDur)) state.nextStartAt = now + Math.max(60, p.pause);
    else { state.nextStartAt = now + 120; break; }
  }
  const tw = p.size, th = tw / 2, ch = tw / 2;
  const projX = (x: number, y: number) => (x - y) * (tw / 2);
  const projY = (x: number, y: number, z: number) => (x + y) * (th / 2) - z * ch;
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  state.cells.forEach((c) => {
    const sx = projX(c.x, c.y), sy = projY(c.x, c.y, c.z);
    if (sx - tw / 2 < minX) minX = sx - tw / 2;
    if (sx + tw / 2 > maxX) maxX = sx + tw / 2;
    if (sy - th / 2 < minY) minY = sy - th / 2;
    if (sy + th / 2 + ch > maxY) maxY = sy + th / 2 + ch;
  });
  const ox = cssW / 2 - (minX + maxX) / 2, oy = cssH / 2 - (minY + maxY) / 2;
  const ease = EASINGS[p.easing] || EASINGS.cosine;
  // Resolve the active palette (exported swatch selection; fall back to default).
  const sel = Array.isArray(p.colors) && p.colors.length ? p.colors : PALETTE;
  const selHsl = sel.map(hexToHsl);
  const moveFor = (cube: Cube) => state.moves.find((m) => m.cube === cube) || null;
  const draws = state.cubes.map((cube) => {
    const m = moveFor(cube); let x = cube.x, y = cube.y, z = cube.z;
    if (m) {
      const tt = ease(Math.min(1, (now - m.start) / m.dur));
      x = m.from.x + (m.to.x - m.from.x) * tt;
      y = m.from.y + (m.to.y - m.from.y) * tt;
      z = m.from.z + (m.to.z - m.from.z) * tt;
    }
    return { x, y, z, hsl: selHsl[cube.ci % selHsl.length], depth: x + y + z };
  });
  const satScale = p.saturation / 100, lightOff = p.lightness / 100;
  draws.sort((a, b) => a.depth - b.depth);
  ctx.globalAlpha = Math.max(0, Math.min(1, p.opacity / 100));
  draws.forEach((dd) => {
    const s = Math.max(0, Math.min(1, dd.hsl.s * satScale));
    const l = Math.max(0, Math.min(1, dd.hsl.l + lightOff));
    const { r, g, b } = hslToRgb(dd.hsl.h, s, l);
    drawCube(ctx, ox + projX(dd.x, dd.y), oy + projY(dd.x, dd.y, dd.z), tw, th, ch, r, g, b);
  });
  ctx.globalAlpha = 1;
}

export default function CubesLoader({ params }: { params?: Partial<Params> }) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const p: Params = { ...DEFAULTS, ...params };
    const canvas = document.createElement("canvas");
    canvas.style.display = "block";
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    host.appendChild(canvas);
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let cssW = 1, cssH = 1, state: Sim | null = null, raf = 0;
    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      cssW = host.clientWidth || 1;
      cssH = host.clientHeight || 1;
      canvas.width = Math.round(cssW * dpr);
      canvas.height = Math.round(cssH * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(host);

    const frame = (now: number) => {
      if (!state) state = createSim(p.rows, p.depth, p.holes, now);
      cubesDraw(ctx, state, p, now, cssW, cssH);
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      if (canvas.parentNode) canvas.parentNode.removeChild(canvas);
    };
  }, [params]);

  return <div ref={hostRef} className="cubes-loader" aria-hidden="true" />;
}
