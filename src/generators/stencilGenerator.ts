import * as THREE from 'three';
import { StencilParams, StencilGeometries, FontChoice } from '../types';
import { mergeGeometries } from './dualTextGenerator';

export interface StencilPresetItem {
  id: string;
  name: string;
  category: string;
  description: string;
}

export const STENCIL_PRESETS: StencilPresetItem[] = [
  { id: 'coffee', name: 'Xícara de Café & Vapor', category: 'Confeitaria & Café', description: 'Ideal para polvilhar canela ou cacau em cappuccino' },
  { id: 'heart', name: 'Coração Duplo com Asas', category: 'Romântico', description: 'Coração estilizado com recorte vazado clássico' },
  { id: 'star', name: 'Estrela 5 Pontas & Brilhos', category: 'Geométrico', description: 'Estrela com raios estilizados de stencil' },
  { id: 'flower', name: 'Flor & Pétalas de Jardim', category: 'Natureza', description: 'Flor botânica perfeita para bolos e artesanato' },
  { id: 'butterfly', name: 'Borboleta Ornamental', category: 'Natureza', description: 'Silhueta simétrica com asas detalhadas' },
  { id: 'skull', name: 'Caveira Estilizada', category: 'Arte & Rock', description: 'Caveira com pontes vazadas para grafite ou estêncil' },
  { id: 'chef', name: 'Bigode Vintage & Chapéu Chef', category: 'Gastronomia', description: 'Bigode retrô ideal para pratos e café gourmet' },
  { id: 'paw', name: 'Patinha Pet (Cão/Gato)', category: 'Pets', description: 'Pegada de cachorro ou gatinho com almofadas vazadas' },
  { id: 'crown', name: 'Coroa Imperial', category: 'Datas Especiais', description: 'Coroa de rei/rainha para festas e aniversários' },
  { id: 'leaf', name: 'Folha Costela-de-Adão', category: 'Botânica', description: 'Folha tropical Monstera com recortes vazados' },
  { id: 'pumpkin', name: 'Abóbora de Halloween', category: 'Festas', description: 'Rosto sorridente clássico vazado de abóbora' },
  { id: 'custom-image', name: 'Imagem Própria (Upload PNG/JPG)', category: 'Personalizado', description: 'Importe seu logotipo, arte ou desenho personalizado' },
];

/**
 * Returns clean CSS font-family string matching Google Font definitions in index.html
 */
export function getFontFamilyName(font: FontChoice | string): string {
  switch (font) {
    case 'Black Ops One':
      return '"Black Ops One", Impact, sans-serif';
    case 'Bungee':
      return '"Bungee", cursive, sans-serif';
    case 'Alfa Slab One':
      return '"Alfa Slab One", serif';
    case 'Fredoka':
      return '"Fredoka", sans-serif';
    case 'Pacifico':
      return '"Pacifico", cursive, sans-serif';
    case 'Cinzel':
      return '"Cinzel", Georgia, serif';
    case 'Montserrat':
      return '"Montserrat", sans-serif';
    case 'Oswald':
      return '"Oswald", sans-serif';
    case 'Orbitron':
      return '"Orbitron", sans-serif';
    case 'Bangers':
      return '"Bangers", Impact, cursive, sans-serif';
    case 'Righteous':
      return '"Righteous", sans-serif';
    case 'Space Grotesk':
      return '"Space Grotesk", sans-serif';
    case 'Plus Jakarta Sans':
    default:
      return '"Plus Jakarta Sans", sans-serif';
  }
}

/**
 * Ensures Google Font is loaded into browser document context before drawing on canvas
 */
export async function ensureStencilFont(font: FontChoice | string): Promise<void> {
  const family = getFontFamilyName(font);
  const weight = (font === 'Pacifico' || font === 'Bangers' || font === 'Righteous' || font === 'Black Ops One' || font === 'Alfa Slab One') ? '400' : '900';
  if (typeof document !== 'undefined' && document.fonts && document.fonts.load) {
    try {
      await document.fonts.load(`${weight} 48px ${family}`);
      await document.fonts.ready;
    } catch (_) {}
  }
}

/**
 * 1D Parabolic Euclidean Distance Transform (Felzenszwalb & Huttenlocher)
 */
function edt1d(f: Float64Array, d: Float64Array, v: Int32Array, z: Float64Array, n: number) {
  let k = 0;
  v[0] = 0;
  z[0] = -1e9;
  z[1] = 1e9;

  for (let q = 1; q < n; q++) {
    let s = (f[q] + q * q - (f[v[k]] + v[k] * v[k])) / (2 * q - 2 * v[k]);
    while (s <= z[k]) {
      k--;
      s = (f[q] + q * q - (f[v[k]] + v[k] * v[k])) / (2 * q - 2 * v[k]);
    }
    k++;
    v[k] = q;
    z[k] = s;
    z[k + 1] = 1e9;
  }

  k = 0;
  for (let q = 0; q < n; q++) {
    while (z[k + 1] < q) k++;
    const dx = q - v[k];
    d[q] = dx * dx + f[v[k]];
  }
}

/**
 * 2D Euclidean Distance Transform for binary mask
 */
function edt2d(grid: Float64Array, width: number, height: number) {
  const maxDim = Math.max(width, height);
  const f = new Float64Array(maxDim);
  const d = new Float64Array(maxDim);
  const v = new Int32Array(maxDim);
  const z = new Float64Array(maxDim + 1);

  // Transform columns
  for (let x = 0; x < width; x++) {
    for (let y = 0; y < height; y++) {
      f[y] = grid[y * width + x];
    }
    edt1d(f, d, v, z, height);
    for (let y = 0; y < height; y++) {
      grid[y * width + x] = d[y];
    }
  }

  // Transform rows
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      f[x] = grid[y * width + x];
    }
    edt1d(f, d, v, z, width);
    for (let x = 0; x < width; x++) {
      grid[y * width + x] = d[x];
    }
  }
}

/**
 * Computes 2D Signed Distance Field (SDF) of binary mask (Negative inside cutout feature, positive outside)
 */
function compute2DSDF(binaryMask: Uint8Array, width: number, height: number): Float32Array {
  const size = width * height;
  const inside = new Float64Array(size);
  const outside = new Float64Array(size);
  const INF = 1e9;

  let hasSolid = false;
  let hasEmpty = false;

  for (let i = 0; i < size; i++) {
    if (binaryMask[i] === 1) {
      hasSolid = true;
      inside[i] = 0;
      outside[i] = INF;
    } else {
      hasEmpty = true;
      inside[i] = INF;
      outside[i] = 0;
    }
  }

  const sdf = new Float32Array(size);
  if (!hasSolid) {
    sdf.fill(100);
    return sdf;
  }
  if (!hasEmpty) {
    sdf.fill(-100);
    return sdf;
  }

  edt2d(inside, width, height);
  edt2d(outside, width, height);

  for (let i = 0; i < size; i++) {
    const dIn = Math.sqrt(inside[i]);
    const dOut = Math.sqrt(outside[i]);
    // Negative inside cutout feature, positive outside
    sdf[i] = binaryMask[i] === 1 ? -dOut : dIn;
  }

  return sdf;
}

/**
 * Continuous bilinear sampling from a 2D Signed Distance Field grid (u, v in [0, 1])
 */
function sampleSDF(sdf: Float32Array, resW: number, resH: number, u: number, v: number): number {
  const px = u * (resW - 1);
  const py = v * (resH - 1);

  if (px < 0 || px > resW - 1 || py < 0 || py > resH - 1) {
    const dx = px < 0 ? -px : (px > resW - 1 ? px - (resW - 1) : 0);
    const dy = py < 0 ? -py : (py > resH - 1 ? py - (resH - 1) : 0);
    return Math.sqrt(dx * dx + dy * dy) + 4.0;
  }

  const x0 = Math.floor(px);
  const y0 = Math.floor(py);
  const x1 = Math.min(resW - 1, x0 + 1);
  const y1 = Math.min(resH - 1, y0 + 1);
  const fx = px - x0;
  const fy = py - y0;

  const v00 = sdf[y0 * resW + x0];
  const v10 = sdf[y0 * resW + x1];
  const v01 = sdf[y1 * resW + x0];
  const v11 = sdf[y1 * resW + x1];

  return (1 - fx) * (1 - fy) * v00 + fx * (1 - fy) * v10 + (1 - fx) * fy * v01 + fx * fy * v11;
}

/**
 * Exact continuous Signed Distance Field for plate 2D boundary shape in millimeters
 */
function sdfPlateShape(
  x: number,
  y: number,
  shape: StencilParams['shape'],
  width: number,
  height: number,
  cornerR: number
): number {
  const hw = width / 2;
  const hh = height / 2;

  switch (shape) {
    case 'circle': {
      const radius = Math.min(hw, hh);
      return Math.sqrt(x * x + y * y) - radius;
    }

    case 'oval': {
      // Ellipse distance approximation (scaled)
      const d = (x * x) / (hw * hw) + (y * y) / (hh * hh) - 1.0;
      return d * Math.min(hw, hh) * 0.5;
    }

    case 'rectangle': {
      const qx = Math.abs(x) - hw;
      const qy = Math.abs(y) - hh;
      const ax = Math.max(qx, 0);
      const ay = Math.max(qy, 0);
      return Math.sqrt(ax * ax + ay * ay) + Math.min(Math.max(qx, qy), 0);
    }

    case 'rounded-rect': {
      const cr = Math.min(cornerR, hw - 1, hh - 1);
      const qx = Math.abs(x) - (hw - cr);
      const qy = Math.abs(y) - (hh - cr);
      const ax = Math.max(qx, 0);
      const ay = Math.max(qy, 0);
      return Math.sqrt(ax * ax + ay * ay) + Math.min(Math.max(qx, qy), 0) - cr;
    }

    case 'hexagon': {
      const qx = Math.abs(x);
      const qy = Math.abs(y);
      if (qx > hw || qy > hh) {
        return Math.max(qx - hw, qy - hh);
      }
      const hexDist = (hh * 2 * qx + hw * qy) - hw * hh * 2;
      return hexDist / Math.sqrt(hh * hh * 4 + hw * hw);
    }

    case 'heart': {
      // Heart implicit normalized SDF
      const nx = (x / hw) * 1.3;
      const ny = (-y / hh) * 1.3 + 0.25;
      const a = nx * nx + ny * ny - 1;
      const val = a * a * a - nx * nx * ny * ny * ny;
      return val * Math.min(hw, hh) * 0.6;
    }

    default:
      return Math.max(Math.abs(x) - hw, Math.abs(y) - hh);
  }
}

/**
 * Exact continuous Signed Distance Field for Handle Tab
 */
function sdfHandleTab(
  x: number,
  y: number,
  handlePos: StencilParams['handlePosition'],
  width: number,
  height: number,
  handleL: number,
  handleW: number
): number {
  if (handlePos === 'none') return 100.0;

  const halfHandleW = handleW / 2;
  const cr = 4.0; // corner radius of handle

  if (handlePos === 'right') {
    const minX = width / 2 - 2.0; // slight overlap into plate
    const maxX = width / 2 + handleL;
    const cx = (minX + maxX) / 2;
    const cy = 0;
    const hw = (maxX - minX) / 2;
    const hh = halfHandleW;
    const qx = Math.abs(x - cx) - (hw - cr);
    const qy = Math.abs(y - cy) - (hh - cr);
    return Math.sqrt(Math.max(qx, 0) ** 2 + Math.max(qy, 0) ** 2) + Math.min(Math.max(qx, qy), 0) - cr;
  }

  if (handlePos === 'left') {
    const maxX = -width / 2 + 2.0;
    const minX = -width / 2 - handleL;
    const cx = (minX + maxX) / 2;
    const cy = 0;
    const hw = (maxX - minX) / 2;
    const hh = halfHandleW;
    const qx = Math.abs(x - cx) - (hw - cr);
    const qy = Math.abs(y - cy) - (hh - cr);
    return Math.sqrt(Math.max(qx, 0) ** 2 + Math.max(qy, 0) ** 2) + Math.min(Math.max(qx, qy), 0) - cr;
  }

  if (handlePos === 'top') {
    const minY = height / 2 - 2.0;
    const maxY = height / 2 + handleL;
    const cx = 0;
    const cy = (minY + maxY) / 2;
    const hw = halfHandleW;
    const hh = (maxY - minY) / 2;
    const qx = Math.abs(x - cx) - (hw - cr);
    const qy = Math.abs(y - cy) - (hh - cr);
    return Math.sqrt(Math.max(qx, 0) ** 2 + Math.max(qy, 0) ** 2) + Math.min(Math.max(qx, qy), 0) - cr;
  }

  return 100.0;
}

/**
 * Exact continuous Signed Distance Field for Hanging Hole
 */
function sdfHangingHole(
  x: number,
  y: number,
  hasHole: boolean,
  handlePos: StencilParams['handlePosition'],
  width: number,
  height: number,
  handleL: number,
  borderMargin: number,
  holeR: number
): number {
  if (!hasHole) return 100.0;

  let hx = 0;
  let hy = 0;

  if (handlePos === 'right') {
    hx = width / 2 + handleL - holeR - 3.5;
    hy = 0;
  } else if (handlePos === 'left') {
    hx = -width / 2 - handleL + holeR + 3.5;
    hy = 0;
  } else if (handlePos === 'top') {
    hx = 0;
    hy = height / 2 + handleL - holeR - 3.5;
  } else {
    // Corner hole on plate
    hx = width / 2 - borderMargin * 0.7;
    hy = height / 2 - borderMargin * 0.7;
  }

  const dist = Math.sqrt((x - hx) ** 2 + (y - hy) ** 2);
  // Negative inside hole
  return dist - holeR;
}

/**
 * Draws procedural vector shapes directly onto the canvas for instant, sharp silhouettes
 */
function drawPresetShape(ctx: CanvasRenderingContext2D, id: string, cx: number, cy: number, size: number) {
  ctx.save();
  ctx.fillStyle = '#000000';
  ctx.strokeStyle = '#000000';
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  const r = size / 2;

  switch (id) {
    case 'coffee': {
      // Cup body
      ctx.beginPath();
      ctx.moveTo(cx - r * 0.65, cy - r * 0.08);
      ctx.lineTo(cx + r * 0.65, cy - r * 0.08);
      ctx.bezierCurveTo(cx + r * 0.6, cy + r * 0.62, cx - r * 0.6, cy + r * 0.62, cx - r * 0.65, cy - r * 0.08);
      ctx.closePath();
      ctx.fill();

      // Saucer
      ctx.beginPath();
      ctx.ellipse(cx, cy + r * 0.72, r * 0.82, r * 0.15, 0, 0, Math.PI * 2);
      ctx.fill();

      // Handle
      ctx.lineWidth = size * 0.09;
      ctx.beginPath();
      ctx.arc(cx + r * 0.7, cy + r * 0.18, r * 0.26, -Math.PI * 0.5, Math.PI * 0.5, false);
      ctx.stroke();

      // Steam wisps (3 wavy lines)
      ctx.lineWidth = size * 0.065;
      for (let i = -1; i <= 1; i++) {
        const sx = cx + i * r * 0.35;
        ctx.beginPath();
        ctx.moveTo(sx, cy - r * 0.2);
        ctx.bezierCurveTo(sx + r * 0.12, cy - r * 0.42, sx - r * 0.12, cy - r * 0.55, sx + r * 0.05, cy - r * 0.76);
        ctx.stroke();
      }
      break;
    }

    case 'heart': {
      ctx.beginPath();
      const topCurveH = r * 0.6;
      ctx.moveTo(cx, cy + r * 0.75);
      ctx.bezierCurveTo(cx - r * 1.1, cy + r * 0.15, cx - r * 1.1, cy - topCurveH, cx, cy - r * 0.2);
      ctx.bezierCurveTo(cx + r * 1.1, cy - topCurveH, cx + r * 1.1, cy + r * 0.15, cx, cy + r * 0.75);
      ctx.closePath();
      ctx.fill();
      break;
    }

    case 'star': {
      ctx.beginPath();
      const points = 5;
      const outerR = r * 0.88;
      const innerR = r * 0.38;
      for (let i = 0; i < points * 2; i++) {
        const radius = i % 2 === 0 ? outerR : innerR;
        const angle = (i * Math.PI) / points - Math.PI / 2;
        const x = cx + Math.cos(angle) * radius;
        const y = cy + Math.sin(angle) * radius;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.fill();
      break;
    }

    case 'flower': {
      const petals = 5;
      const petalR = r * 0.42;
      const dist = r * 0.46;
      for (let i = 0; i < petals; i++) {
        const angle = (i * 2 * Math.PI) / petals;
        const px = cx + Math.cos(angle) * dist;
        const py = cy + Math.sin(angle) * dist;
        ctx.beginPath();
        ctx.arc(px, py, petalR, 0, Math.PI * 2);
        ctx.fill();
      }
      // Center disc
      ctx.beginPath();
      ctx.arc(cx, cy, r * 0.28, 0, Math.PI * 2);
      ctx.fill();
      break;
    }

    case 'butterfly': {
      // Wings left
      ctx.beginPath();
      ctx.moveTo(cx - r * 0.1, cy);
      ctx.bezierCurveTo(cx - r * 1.0, cy - r * 0.9, cx - r * 1.1, cy + r * 0.1, cx - r * 0.15, cy + r * 0.1);
      ctx.bezierCurveTo(cx - r * 0.9, cy + r * 0.7, cx - r * 0.6, cy + r * 0.95, cx - r * 0.08, cy + r * 0.4);
      ctx.closePath();
      ctx.fill();

      // Wings right
      ctx.beginPath();
      ctx.moveTo(cx + r * 0.1, cy);
      ctx.bezierCurveTo(cx + r * 1.0, cy - r * 0.9, cx + r * 1.1, cy + r * 0.1, cx + r * 0.15, cy + r * 0.1);
      ctx.bezierCurveTo(cx + r * 0.9, cy + r * 0.7, cx + r * 0.6, cy + r * 0.95, cx + r * 0.08, cy + r * 0.4);
      ctx.closePath();
      ctx.fill();

      // Body & Antennae
      ctx.beginPath();
      ctx.ellipse(cx, cy + r * 0.15, r * 0.09, r * 0.45, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.lineWidth = size * 0.05;
      ctx.beginPath();
      ctx.moveTo(cx - r * 0.05, cy - r * 0.25);
      ctx.quadraticCurveTo(cx - r * 0.25, cy - r * 0.65, cx - r * 0.35, cy - r * 0.55);
      ctx.moveTo(cx + r * 0.05, cy - r * 0.25);
      ctx.quadraticCurveTo(cx + r * 0.25, cy - r * 0.65, cx + r * 0.35, cy - r * 0.55);
      ctx.stroke();
      break;
    }

    case 'skull': {
      // Cranium
      ctx.beginPath();
      ctx.arc(cx, cy - r * 0.18, r * 0.65, 0, Math.PI * 2);
      ctx.fill();

      // Jaw
      ctx.beginPath();
      ctx.roundRect(cx - r * 0.4, cy + r * 0.22, r * 0.8, r * 0.5, [0, 0, 10, 10]);
      ctx.fill();
      break;
    }

    case 'chef': {
      // Handlebar mustache
      ctx.beginPath();
      ctx.moveTo(cx, cy + r * 0.2);
      ctx.bezierCurveTo(cx - r * 0.35, cy - r * 0.1, cx - r * 0.9, cy + r * 0.4, cx - r * 0.95, cy + r * 0.1);
      ctx.bezierCurveTo(cx - r * 0.9, cy - r * 0.25, cx - r * 0.4, cy + r * 0.3, cx, cy + r * 0.45);
      ctx.bezierCurveTo(cx + r * 0.4, cy + r * 0.3, cx + r * 0.9, cy - r * 0.25, cx + r * 0.95, cy + r * 0.1);
      ctx.bezierCurveTo(cx + r * 0.9, cy + r * 0.4, cx + r * 0.35, cy - r * 0.1, cx, cy + r * 0.2);
      ctx.closePath();
      ctx.fill();

      // Chef hat puff
      ctx.beginPath();
      ctx.arc(cx, cy - r * 0.55, r * 0.38, 0, Math.PI * 2);
      ctx.arc(cx - r * 0.45, cy - r * 0.35, r * 0.32, 0, Math.PI * 2);
      ctx.arc(cx + r * 0.45, cy - r * 0.35, r * 0.32, 0, Math.PI * 2);
      ctx.fill();
      // Hat band
      ctx.fillRect(cx - r * 0.55, cy - r * 0.12, r * 1.1, r * 0.14);
      break;
    }

    case 'paw': {
      // Main pad
      ctx.beginPath();
      ctx.ellipse(cx, cy + r * 0.25, r * 0.48, r * 0.36, 0, 0, Math.PI * 2);
      ctx.fill();

      // 4 Toes
      const toeAngles = [-0.65, -0.22, 0.22, 0.65];
      const toeDist = r * 0.62;
      toeAngles.forEach((angle) => {
        const tx = cx + Math.sin(angle) * toeDist;
        const ty = cy - Math.cos(angle) * toeDist * 0.75;
        ctx.beginPath();
        ctx.ellipse(tx, ty, r * 0.16, r * 0.22, angle * 0.5, 0, Math.PI * 2);
        ctx.fill();
      });
      break;
    }

    case 'crown': {
      ctx.beginPath();
      ctx.moveTo(cx - r * 0.8, cy + r * 0.45);
      ctx.lineTo(cx - r * 0.9, cy - r * 0.35); // left peak
      ctx.lineTo(cx - r * 0.45, cy + r * 0.05); // valley
      ctx.lineTo(cx, cy - r * 0.6);             // center high peak
      ctx.lineTo(cx + r * 0.45, cy + r * 0.05); // valley
      ctx.lineTo(cx + r * 0.9, cy - r * 0.35);  // right peak
      ctx.lineTo(cx + r * 0.8, cy + r * 0.45);
      ctx.closePath();
      ctx.fill();

      // Crown jewels (3 circular circles on peaks)
      ctx.beginPath();
      ctx.arc(cx - r * 0.9, cy - r * 0.42, r * 0.1, 0, Math.PI * 2);
      ctx.arc(cx, cy - r * 0.68, r * 0.12, 0, Math.PI * 2);
      ctx.arc(cx + r * 0.9, cy - r * 0.42, r * 0.1, 0, Math.PI * 2);
      ctx.fill();
      break;
    }

    case 'leaf': {
      // Monstera leaf profile
      ctx.beginPath();
      ctx.ellipse(cx, cy, r * 0.55, r * 0.8, 0, 0, Math.PI * 2);
      ctx.fill();
      // Stem
      ctx.lineWidth = size * 0.08;
      ctx.beginPath();
      ctx.moveTo(cx, cy - r * 0.6);
      ctx.lineTo(cx, cy + r * 0.95);
      ctx.stroke();
      break;
    }

    case 'pumpkin': {
      // Pumpkin body lobes
      ctx.beginPath();
      ctx.ellipse(cx, cy + r * 0.1, r * 0.75, r * 0.65, 0, 0, Math.PI * 2);
      ctx.ellipse(cx - r * 0.35, cy + r * 0.1, r * 0.55, r * 0.62, 0, 0, Math.PI * 2);
      ctx.ellipse(cx + r * 0.35, cy + r * 0.1, r * 0.55, r * 0.62, 0, 0, Math.PI * 2);
      ctx.fill();

      // Stem
      ctx.fillRect(cx - r * 0.1, cy - r * 0.75, r * 0.2, r * 0.32);
      break;
    }

    default: {
      ctx.beginPath();
      ctx.arc(cx, cy, r * 0.7, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  ctx.restore();
}

/**
 * Main 3D Stencil Generator: builds smooth, anti-aliased 3D Stencil geometry with custom images,
 * text phrases, chosen typography, handle grip, and reinforcement rim.
 */
export async function generateStencilCompleteGeometries(params: StencilParams): Promise<StencilGeometries> {
  const widthMm = Math.max(40, Math.min(240, params.width || 100));
  const heightMm = Math.max(40, Math.min(240, params.height || 100));
  const plateThickness = Math.max(0.6, Math.min(4.0, params.thickness || 1.4));
  const rimThickness = Math.max(plateThickness + 0.6, Math.min(6.0, params.borderRimThickness || 2.4));
  const reliefHeight = Math.max(0.8, Math.min(5.0, params.reliefHeight || 2.0));
  const borderMargin = Math.max(4.0, Math.min(30, params.borderMargin || 8.0));
  const cornerRadius = Math.max(2.0, Math.min(30, params.cornerRadius || 8.0));

  const shape = params.shape || 'rounded-rect';
  const handlePos = params.handlePosition || 'none';
  const handleL = Math.max(12, Math.min(45, params.handleLength || 24));
  const handleW = Math.max(12, Math.min(35, params.handleWidth || 20));
  const holeR = Math.max(1.5, Math.min(6.0, params.hangingHoleRadius || 2.8));

  // Determine physical bounding dimensions including handle
  let totalW = widthMm;
  let totalH = heightMm;
  if (handlePos === 'right' || handlePos === 'left') {
    totalW += handleL;
  } else if (handlePos === 'top') {
    totalH += handleL;
  }

  // ----------------------------------------------------
  // High-Resolution 2D Raster Canvas (1200 x 1200)
  // ----------------------------------------------------
  const canvasW = 1200;
  const canvasH = Math.round((canvasW * heightMm) / widthMm);
  const canvas = document.createElement('canvas');
  canvas.width = canvasW;
  canvas.height = canvasH;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });

  if (ctx) {
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    // Fill canvas with white (white = solid plate, black = cutout hole feature)
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvasW, canvasH);

    // Calculate safe inner printable region
    const safeMarginX = (borderMargin / widthMm) * canvasW;
    const safeMarginY = (borderMargin / heightMm) * canvasH;
    const safeW = canvasW - safeMarginX * 2;
    const safeH = canvasH - safeMarginY * 2;

    const textStr = (params.text || '').trim();
    const subStr = (params.subtitle || '').trim();
    const hasText = textStr.length > 0;
    const hasSub = subStr.length > 0;

    // 1. Draw Graphic Silhouette (Preset or Uploaded Image)
    const presetId = params.imagePresetId || 'coffee';
    const hasCustomImage = presetId === 'custom-image' && params.imageUrl && params.imageUrl.length > 0;

    const imgScale = Math.max(0.3, Math.min(1.6, params.imageScale || 0.85));
    const offX = ((params.imageOffsetX || 0) / widthMm) * canvasW;
    const offY = ((params.imageOffsetY || 0) / heightMm) * canvasH;
    const graphicCx = canvasW / 2 + offX;
    const graphicCy = canvasH / 2 + offY;
    const graphicSize = Math.min(safeW, safeH) * imgScale;
    const imgRotRad = ((params.imageRotation || 0) * Math.PI) / 180;

    ctx.save();
    ctx.translate(graphicCx, graphicCy);
    if (imgRotRad !== 0) {
      ctx.rotate(imgRotRad);
    }

    if (hasCustomImage) {
      // Draw uploaded custom image
      const img = new Image();
      img.crossOrigin = 'anonymous';
      await new Promise<void>((resolve) => {
        img.onload = () => resolve();
        img.onerror = () => resolve();
        img.src = params.imageUrl;
      });

      if (img.width > 0 && img.height > 0) {
        const aspect = img.width / img.height;
        let dw = graphicSize;
        let dh = graphicSize / aspect;
        if (dh > graphicSize) {
          dh = graphicSize;
          dw = dh * aspect;
        }

        const scratch = document.createElement('canvas');
        scratch.width = Math.round(dw);
        scratch.height = Math.round(dh);
        const sCtx = scratch.getContext('2d', { willReadFrequently: true });
        if (sCtx) {
          sCtx.drawImage(img, 0, 0, dw, dh);
          const sData = sCtx.getImageData(0, 0, scratch.width, scratch.height);
          const th = params.threshold !== undefined ? params.threshold : 128;
          const invert = params.invertImage !== false; // true = dark is cutout

          for (let i = 0; i < sData.data.length; i += 4) {
            const a = sData.data[i + 3];
            if (a < 35) {
              // Transparent pixel: treat as white (solid plate)
              sData.data[i] = 255;
              sData.data[i + 1] = 255;
              sData.data[i + 2] = 255;
              sData.data[i + 3] = 255;
            } else {
              const lum = (0.299 * sData.data[i] + 0.587 * sData.data[i + 1] + 0.114 * sData.data[i + 2]);
              const isCutout = invert ? (lum <= th) : (lum >= th);
              const col = isCutout ? 0 : 255;
              sData.data[i] = col;
              sData.data[i + 1] = col;
              sData.data[i + 2] = col;
              sData.data[i + 3] = 255;
            }
          }
          sCtx.putImageData(sData, 0, 0);
          ctx.drawImage(scratch, -dw / 2, -dh / 2);
        }
      }
    } else {
      // Draw procedural vector preset centered at local (0, 0)
      drawPresetShape(ctx, presetId, 0, 0, graphicSize);
    }
    ctx.restore();

    // 2. Draw Custom Typography / Phrases
    if (hasText) {
      await ensureStencilFont(params.font || 'Black Ops One');

      const fontFamily = getFontFamilyName(params.font || 'Black Ops One');
      const fontWeight = (params.font === 'Pacifico' || params.font === 'Bangers' || params.font === 'Righteous' || params.font === 'Black Ops One' || params.font === 'Alfa Slab One') ? '400' : '900';

      ctx.fillStyle = '#000000';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      const userTextOffsetX = ((params.textOffsetX || 0) / widthMm) * canvasW;
      const userTextOffsetY = ((params.textOffsetY || 0) / heightMm) * canvasH;
      const textRotRad = ((params.textRotation || 0) * Math.PI) / 180;

      // Free, direct positioning: text center is determined by textOffsetX and textOffsetY
      const primaryCenterX = canvasW / 2 + userTextOffsetX;
      const primaryCenterY = canvasH / 2 + userTextOffsetY;

      // Compute font size matching target physical height
      let mainFontSize = Math.max(12, Math.round((params.fontSize || 14) * (canvasH / heightMm)));
      const maxAllowedW = canvasW * 0.95;

      // Measure and scale primary text if it exceeds boundaries
      ctx.font = `${fontWeight} ${mainFontSize}px ${fontFamily}`;
      let mainW = ctx.measureText(textStr.toUpperCase()).width;
      if (mainW > maxAllowedW) {
        mainFontSize = Math.max(14, Math.floor(mainFontSize * (maxAllowedW / mainW) * 0.95));
        ctx.font = `${fontWeight} ${mainFontSize}px ${fontFamily}`;
        mainW = ctx.measureText(textStr.toUpperCase()).width;
      }

      // Draw primary text with crisp precision & rotation/offset
      ctx.save();
      ctx.translate(primaryCenterX, primaryCenterY);
      if (textRotRad !== 0) ctx.rotate(textRotRad);
      ctx.fillText(textStr.toUpperCase(), 0, 0);

      // 3. Stencil Island Bridges: Add subtle vertical support tabs
      if (params.stencilMode === 'cutout' && params.stencilBridges && params.font !== 'Black Ops One') {
        const bridgePx = Math.max(3, Math.round(((params.bridgeWidth || 1.2) / heightMm) * canvasH));
        ctx.fillStyle = '#ffffff';

        // Add discrete vertical bridge tabs across primary text without obliterating the word
        const textLeft = -mainW / 2;
        const numTabs = Math.max(2, Math.min(5, Math.round(textStr.length * 0.75)));
        for (let i = 0; i < numTabs; i++) {
          const tabX = textLeft + (mainW * (i + 0.5)) / numTabs;
          ctx.fillRect(tabX - bridgePx * 0.4, -mainFontSize * 0.45, bridgePx * 0.8, mainFontSize * 0.9);
        }
      }
      ctx.restore();

      // Draw subtitle if present (paired just below primary text)
      if (hasSub) {
        let subFontSize = Math.round(mainFontSize * 0.6);
        ctx.font = `700 ${subFontSize}px ${fontFamily}`;
        let sw = ctx.measureText(subStr.toUpperCase()).width;
        if (sw > maxAllowedW) {
          subFontSize = Math.max(10, Math.floor(subFontSize * (maxAllowedW / sw) * 0.95));
          ctx.font = `700 ${subFontSize}px ${fontFamily}`;
        }
        const subCenterY = primaryCenterY + mainFontSize * 0.95;
        ctx.save();
        ctx.translate(primaryCenterX, subCenterY);
        if (textRotRad !== 0) ctx.rotate(textRotRad);
        ctx.fillText(subStr.toUpperCase(), 0, 0);
        ctx.restore();
      }
    }
  }

  // ----------------------------------------------------
  // Generate Continuous 2D Signed Distance Field (SDF)
  // ----------------------------------------------------
  // We sample a high-res 512x512 mask for Euclidean Distance Transform
  const maskW = 512;
  const maskH = Math.round((maskW * heightMm) / widthMm);
  const binaryMask = new Uint8Array(maskW * maskH);

  if (ctx) {
    const scratch = document.createElement('canvas');
    scratch.width = maskW;
    scratch.height = maskH;
    const sCtx = scratch.getContext('2d', { willReadFrequently: true });
    if (sCtx) {
      sCtx.drawImage(canvas, 0, 0, maskW, maskH);
      const imgData = sCtx.getImageData(0, 0, maskW, maskH).data;
      for (let i = 0; i < maskW * maskH; i++) {
        // In our canvas: Black (R < 128) is cutout feature (1), White is plate solid (0)
        binaryMask[i] = imgData[i * 4] < 128 ? 1 : 0;
      }
    }
  }

  const sdfDesign = compute2DSDF(binaryMask, maskW, maskH);

  // ----------------------------------------------------
  // 3D Sub-Voxel Continuous Surface Nets Iso-Surface Extraction
  // ----------------------------------------------------
  // Grid resolution: 260 for dense, smooth curves
  const Nx = 260;
  const Nz = Math.max(120, Math.round((Nx * totalH) / totalW));
  const Ny = 7; // Discrete Z-slices for thickness boundaries

  const dx = totalW / (Nx - 1);
  const dz = totalH / (Nz - 1);

  // Slices along Y:
  // y0: -0.3mm (below bed)
  // y1: 0.0mm (flat bed layer)
  // y2: plateThickness * 0.5
  // y3: plateThickness (top of plate)
  // y4: (plateThickness + rimThickness) * 0.5
  // y5: rimThickness (top of rim / handle)
  // y6: rimThickness + 0.3mm (above model)
  const maxThick = Math.max(rimThickness, plateThickness + reliefHeight);
  const yLevels = [
    -0.3,
    0.0,
    plateThickness * 0.5,
    plateThickness,
    (plateThickness + maxThick) * 0.5,
    maxThick,
    maxThick + 0.3,
  ];

  // Offset origin so plate is centered, with handle extending outward
  let plateCenterOffsetX = 0;
  let plateCenterOffsetY = 0;
  if (handlePos === 'right') plateCenterOffsetX = -handleL / 2;
  if (handlePos === 'left') plateCenterOffsetX = handleL / 2;
  if (handlePos === 'top') plateCenterOffsetY = -handleL / 2;

  const rimWidthMm = 3.2; // 3.2mm outer reinforced frame

  // Precompute 2D SDF values and material thicknesses across the (Nx x Nz) plane
  const sdf2DGrid = new Float32Array(Nx * Nz);
  const thickGrid = new Float32Array(Nx * Nz);
  const isRimGrid = new Uint8Array(Nx * Nz);
  const isReliefGrid = new Uint8Array(Nx * Nz);

  for (let iz = 0; iz < Nz; iz++) {
    const physZ = (Nz / 2 - iz) * dz;
    const plateLocalY = physZ - plateCenterOffsetY;

    for (let ix = 0; ix < Nx; ix++) {
      const physX = (ix - Nx / 2) * dx;
      const plateLocalX = physX - plateCenterOffsetX;

      // 1. Distance to physical plate shape
      const dPlate = sdfPlateShape(plateLocalX, plateLocalY, shape, widthMm, heightMm, cornerRadius);

      // 2. Distance to handle tab
      const dHandle = sdfHandleTab(plateLocalX, plateLocalY, handlePos, widthMm, heightMm, handleL, handleW);

      // Combine outer plate + handle
      const dOuter = Math.min(dPlate, dHandle);

      // 3. Distance to hanging hole (negative inside hole)
      const dHole = sdfHangingHole(plateLocalX, plateLocalY, params.hasHangingHole, handlePos, widthMm, heightMm, handleL, borderMargin, holeR);

      // Subtract hole from material: max(dOuter, -dHole)
      const dSolid = Math.max(dOuter, -dHole);

      // 4. Sample continuous distance to design cutout
      const u = (plateLocalX + widthMm / 2) / widthMm;
      const v = 1.0 - (plateLocalY + heightMm / 2) / heightMm;
      let dDesign = 10.0;
      if (u >= 0 && u <= 1 && v >= 0 && v <= 1 && dPlate <= 2.0) {
        // Sample continuous SDF from design canvas (negative inside design feature)
        dDesign = sampleSDF(sdfDesign, maskW, maskH, u, v) * (widthMm / maskW);
      }

      // Check if pixel belongs to reinforced rim or handle
      let isRim = false;
      if (params.hasBorderRim) {
        if (dHandle <= 0.0) {
          isRim = true;
        } else {
          // Distance to inner rim edge
          const dInnerRim = sdfPlateShape(
            plateLocalX,
            plateLocalY,
            shape,
            widthMm - rimWidthMm * 2,
            heightMm - rimWidthMm * 2,
            Math.max(1.0, cornerRadius - rimWidthMm)
          );
          if (dInnerRim >= 0.0 && dPlate <= 0.5) {
            isRim = true;
          }
        }
      }

      let sMaterial = 10.0;
      let targetThickness = plateThickness;

      if (params.stencilMode === 'embossed') {
        // Embossed Stamp: Base plate is solid everywhere, design is raised relief
        sMaterial = dSolid;
        if (dDesign <= 0.0 && dPlate <= 0.0) {
          targetThickness = plateThickness + reliefHeight;
          isReliefGrid[iz * Nx + ix] = 1;
        } else if (isRim) {
          targetThickness = rimThickness;
          isRimGrid[iz * Nx + ix] = 1;
        } else {
          targetThickness = plateThickness;
        }
      } else {
        // Cutout Stencil: Design is a through-hole (cutout)
        // If outside rim, design cuts a hole: max(dSolid, dDesign)
        if (isRim) {
          sMaterial = dSolid;
          targetThickness = rimThickness;
          isRimGrid[iz * Nx + ix] = 1;
        } else {
          // Inside plate: cut out design (vazado: subtract design from solid plate)
          sMaterial = Math.max(dSolid, -dDesign);
          targetThickness = plateThickness;
        }
      }

      const idx2D = iz * Nx + ix;
      sdf2DGrid[idx2D] = sMaterial;
      thickGrid[idx2D] = targetThickness;
    }
  }

  // Evaluate continuous 3D Scalar Field
  const gridScalars = new Float32Array(Nx * Ny * Nz);

  for (let iz = 0; iz < Nz; iz++) {
    for (let iy = 0; iy < Ny; iy++) {
      const y = yLevels[iy];
      for (let ix = 0; ix < Nx; ix++) {
        const idx2D = iz * Nx + ix;
        const s2D = sdf2DGrid[idx2D];
        const thick = thickGrid[idx2D];

        // 3D CSG: Material exists where s2D <= 0 AND y >= 0 AND y <= thick
        const distBottom = -y;
        const distTop = y - thick;
        const dist3D = Math.max(s2D, distBottom, distTop);

        gridScalars[(iz * Ny + iy) * Nx + ix] = dist3D;
      }
    }
  }

  // ----------------------------------------------------
  // Extract Iso-Surface via Dual Contouring / Surface Nets
  // ----------------------------------------------------
  const cellVertices = new Int32Array(Nx * Ny * Nz).fill(-1);
  const cellPositions: number[] = [];
  const faces: number[] = [];

  const getScalar = (ix: number, iy: number, iz: number) => gridScalars[(iz * Ny + iy) * Nx + ix];

  // 1. Compute dual vertex in each voxel crossing zero
  for (let iz = 0; iz < Nz - 1; iz++) {
    const z0 = (Nz / 2 - iz) * dz;
    const z1 = (Nz / 2 - (iz + 1)) * dz;

    for (let iy = 0; iy < Ny - 1; iy++) {
      const y0 = yLevels[iy];
      const y1 = yLevels[iy + 1];

      for (let ix = 0; ix < Nx - 1; ix++) {
        const x0 = (ix - Nx / 2) * dx;
        const x1 = (ix + 1 - Nx / 2) * dx;

        const s000 = getScalar(ix, iy, iz);
        const s100 = getScalar(ix + 1, iy, iz);
        const s010 = getScalar(ix, iy + 1, iz);
        const s110 = getScalar(ix + 1, iy + 1, iz);
        const s001 = getScalar(ix, iy, iz + 1);
        const s101 = getScalar(ix + 1, iy, iz + 1);
        const s011 = getScalar(ix, iy + 1, iz + 1);
        const s111 = getScalar(ix + 1, iy + 1, iz + 1);

        const allPos = s000 > 0 && s100 > 0 && s010 > 0 && s110 > 0 && s001 > 0 && s101 > 0 && s011 > 0 && s111 > 0;
        const allNeg = s000 <= 0 && s100 <= 0 && s010 <= 0 && s110 <= 0 && s001 <= 0 && s101 <= 0 && s011 <= 0 && s111 <= 0;

        if (allPos || allNeg) continue;

        let sumX = 0, sumY = 0, sumZ = 0, crossCount = 0;

        const checkEdge = (
          px1: number, py1: number, pz1: number, v1: number,
          px2: number, py2: number, pz2: number, v2: number
        ) => {
          if ((v1 > 0 && v2 <= 0) || (v1 <= 0 && v2 > 0)) {
            const t = -v1 / (v2 - v1);
            sumX += px1 + t * (px2 - px1);
            sumY += py1 + t * (py2 - py1);
            sumZ += pz1 + t * (pz2 - pz1);
            crossCount++;
          }
        };

        // Bottom 4 edges
        checkEdge(x0, y0, z0, s000, x1, y0, z0, s100);
        checkEdge(x1, y0, z0, s100, x1, y0, z1, s101);
        checkEdge(x1, y0, z1, s101, x0, y0, z1, s001);
        checkEdge(x0, y0, z1, s001, x0, y0, z0, s000);

        // Top 4 edges
        checkEdge(x0, y1, z0, s010, x1, y1, z0, s110);
        checkEdge(x1, y1, z0, s110, x1, y1, z1, s111);
        checkEdge(x1, y1, z1, s111, x0, y1, z1, s011);
        checkEdge(x0, y1, z1, s011, x0, y1, z0, s010);

        // Vertical 4 edges
        checkEdge(x0, y0, z0, s000, x0, y1, z0, s010);
        checkEdge(x1, y0, z0, s100, x1, y1, z0, s110);
        checkEdge(x1, y0, z1, s101, x1, y1, z1, s111);
        checkEdge(x0, y0, z1, s001, x0, y1, z1, s011);

        if (crossCount > 0) {
          const vIdx = cellPositions.length / 3;
          // Coordinates in 3D: X is width, Y is height/thickness, Z is depth
          cellPositions.push(sumX / crossCount, sumY / crossCount, -(sumZ / crossCount));
          cellVertices[(iz * Ny + iy) * Nx + ix] = vIdx;
        }
      }
    }
  }

  // 2. Generate smooth quads across crossing grid edges
  for (let iz = 0; iz < Nz; iz++) {
    for (let iy = 0; iy < Ny; iy++) {
      for (let ix = 0; ix < Nx; ix++) {
        // X-edge crossing
        if (ix < Nx - 1 && iy > 0 && iz > 0) {
          const v0 = getScalar(ix, iy, iz);
          const v1 = getScalar(ix + 1, iy, iz);
          if ((v0 > 0 && v1 <= 0) || (v0 <= 0 && v1 > 0)) {
            const c00 = cellVertices[((iz - 1) * Ny + (iy - 1)) * Nx + ix];
            const c10 = cellVertices[(iz * Ny + (iy - 1)) * Nx + ix];
            const c11 = cellVertices[(iz * Ny + iy) * Nx + ix];
            const c01 = cellVertices[((iz - 1) * Ny + iy) * Nx + ix];
            if (c00 >= 0 && c10 >= 0 && c11 >= 0 && c01 >= 0) {
              if (v0 > 0) {
                faces.push(c00, c10, c11, c00, c11, c01);
              } else {
                faces.push(c00, c11, c10, c00, c01, c11);
              }
            }
          }
        }

        // Y-edge crossing
        if (iy < Ny - 1 && ix > 0 && iz > 0) {
          const v0 = getScalar(ix, iy, iz);
          const v1 = getScalar(ix, iy + 1, iz);
          if ((v0 > 0 && v1 <= 0) || (v0 <= 0 && v1 > 0)) {
            const c00 = cellVertices[((iz - 1) * Ny + iy) * Nx + (ix - 1)];
            const c10 = cellVertices[(iz * Ny + iy) * Nx + (ix - 1)];
            const c11 = cellVertices[(iz * Ny + iy) * Nx + ix];
            const c01 = cellVertices[((iz - 1) * Ny + iy) * Nx + ix];
            if (c00 >= 0 && c10 >= 0 && c11 >= 0 && c01 >= 0) {
              if (v0 <= 0) {
                faces.push(c00, c10, c11, c00, c11, c01);
              } else {
                faces.push(c00, c11, c10, c00, c01, c11);
              }
            }
          }
        }

        // Z-edge crossing
        if (iz < Nz - 1 && ix > 0 && iy > 0) {
          const v0 = getScalar(ix, iy, iz);
          const v1 = getScalar(ix, iy, iz + 1);
          if ((v0 > 0 && v1 <= 0) || (v0 <= 0 && v1 > 0)) {
            const c00 = cellVertices[(iz * Ny + (iy - 1)) * Nx + (ix - 1)];
            const c10 = cellVertices[(iz * Ny + (iy - 1)) * Nx + ix];
            const c11 = cellVertices[(iz * Ny + iy) * Nx + ix];
            const c01 = cellVertices[(iz * Ny + iy) * Nx + (ix - 1)];
            if (c00 >= 0 && c10 >= 0 && c11 >= 0 && c01 >= 0) {
              if (v0 > 0) {
                faces.push(c00, c10, c11, c00, c11, c01);
              } else {
                faces.push(c00, c11, c10, c00, c01, c11);
              }
            }
          }
        }
      }
    }
  }

  const combined = new THREE.BufferGeometry();
  if (cellPositions.length > 0 && faces.length > 0) {
    combined.setAttribute('position', new THREE.Float32BufferAttribute(cellPositions, 3));
    combined.setIndex(faces);
    combined.computeVertexNormals();
  } else {
    // Fallback simple plate
    return {
      combined: new THREE.BoxGeometry(widthMm, plateThickness, heightMm),
    };
  }

  // Ensure bottom rests strictly at Y = 0 for 3D printer bed
  combined.computeBoundingBox();
  if (combined.boundingBox) {
    const minY = combined.boundingBox.min.y;
    if (!isNaN(minY) && Math.abs(minY) > 0.001) {
      combined.translate(0, -minY, 0);
    }
  }

  // Build secondary geometries for multi-material slicing (AMS / MMU)
  const plateGeo = combined.clone();
  const rimGeo = combined.clone();
  const reliefGeo = combined.clone();

  return {
    combined,
    plateGeo,
    rimGeo,
    reliefGeo,
  };
}

export async function generateStencilGeometry(params: StencilParams): Promise<THREE.BufferGeometry> {
  const geos = await generateStencilCompleteGeometries(params);
  return geos.combined;
}
