import * as THREE from 'three';
import { DualTextParams, DualTextGeometries, FontChoice, LetterSculptStyle } from '../types';

/**
 * Returns exact CSS font string matching the requested typography
 */
export function getFontCssString(
  font: FontChoice | string,
  fontSize: number,
  boldness: number = 0,
  sculptStyle: LetterSculptStyle = 'smooth'
): string {
  const extraWeight = boldness >= 3 ? 900 : boldness >= 1 ? 800 : 700;
  switch (font) {
    case 'Bungee':
      return `900 ${fontSize}px "Bungee", Impact, sans-serif`;
    case 'Alfa Slab One':
      return `400 ${fontSize}px "Alfa Slab One", serif`;
    case 'Black Ops One':
      return `400 ${fontSize}px "Black Ops One", Impact, sans-serif`;
    case 'Fredoka':
      return `${extraWeight} ${fontSize}px "Fredoka", sans-serif`;
    case 'Pacifico':
      return `400 ${fontSize}px "Pacifico", cursive, sans-serif`;
    case 'Cinzel':
      return `900 ${fontSize}px "Cinzel", Georgia, serif`;
    case 'Montserrat':
      return `900 ${fontSize}px "Montserrat", sans-serif`;
    case 'Oswald':
      return `700 ${fontSize}px "Oswald", sans-serif`;
    case 'Orbitron':
      return `900 ${fontSize}px "Orbitron", sans-serif`;
    case 'Bangers':
      return `400 ${fontSize}px "Bangers", Impact, cursive, sans-serif`;
    case 'Righteous':
      return `400 ${fontSize}px "Righteous", sans-serif`;
    case 'Space Grotesk':
      return `700 ${fontSize}px "Space Grotesk", sans-serif`;
    case 'Plus Jakarta Sans':
    default:
      return `${extraWeight} ${fontSize}px "Plus Jakarta Sans", sans-serif`;
  }
}

/**
 * Ensures Google Font is downloaded and ready in browser before canvas rasterization
 */
export async function ensureFontLoaded(font: FontChoice | string, boldness: number = 0): Promise<void> {
  if (typeof document !== 'undefined' && document.fonts && document.fonts.load) {
    try {
      const fontStr = getFontCssString(font, 32, boldness);
      await document.fonts.load(fontStr);
      await document.fonts.ready;
    } catch (_) {}
  }
}

/**
 * Fast 1D Parabolic Euclidean Distance Transform (Felzenszwalb & Huttenlocher)
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
 * 2D Euclidean Distance Transform for arbitrary binary grids
 */
function edt2d(grid: Float64Array, width: number, height: number) {
  const maxDim = Math.max(width, height);
  const f = new Float64Array(maxDim);
  const d = new Float64Array(maxDim);
  const v = new Int32Array(maxDim);
  const z = new Float64Array(maxDim + 1);

  // Transform along columns
  for (let x = 0; x < width; x++) {
    for (let y = 0; y < height; y++) {
      f[y] = grid[y * width + x];
    }
    edt1d(f, d, v, z, height);
    for (let y = 0; y < height; y++) {
      grid[y * width + x] = d[y];
    }
  }

  // Transform along rows
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
 * Computes continuous 2D Signed Distance Field (SDF) of a binary mask
 * Negative inside the shape, positive outside. Distance in pixel units.
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
    // Negative inside, positive outside
    sdf[i] = binaryMask[i] === 1 ? -dOut : dIn;
  }

  return sdf;
}

/**
 * Bilinear sampling from a 2D Signed Distance Field grid
 */
function sampleSDF(sdf: Float32Array, resW: number, resH: number, u: number, v: number): number {
  const px = u * (resW - 1);
  const py = v * (resH - 1);

  if (px < 0 || px > resW - 1 || py < 0 || py > resH - 1) {
    const dx = px < 0 ? -px : (px > resW - 1 ? px - (resW - 1) : 0);
    const dy = py < 0 ? -py : (py > resH - 1 ? py - (resH - 1) : 0);
    return Math.sqrt(dx * dx + dy * dy) + 2.0;
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
 * Draws a clean 2D Heart glyph on canvas
 */
function drawHeart2D(ctx: CanvasRenderingContext2D, cx: number, cy: number, w: number, h: number) {
  const topY = cy - h / 2;
  const bottomY = cy + h / 2;
  const cleftY = topY + h * 0.26;
  const halfW = w / 2;

  ctx.beginPath();
  ctx.moveTo(cx, bottomY);
  ctx.bezierCurveTo(
    cx - halfW * 0.7, bottomY - h * 0.15,
    cx - halfW * 1.05, topY + h * 0.7,
    cx - halfW * 1.05, topY + h * 0.42
  );
  ctx.bezierCurveTo(
    cx - halfW * 1.05, topY + h * 0.12,
    cx - halfW * 0.55, topY,
    cx - halfW * 0.05, cleftY
  );
  ctx.lineTo(cx, cleftY);
  ctx.bezierCurveTo(
    cx + halfW * 0.05, cleftY,
    cx + halfW * 0.55, topY,
    cx + halfW * 1.05, topY + h * 0.12
  );
  ctx.bezierCurveTo(
    cx + halfW * 1.05, topY + h * 0.42,
    cx + halfW * 1.05, topY + h * 0.7,
    cx + halfW * 0.7, bottomY - h * 0.15
  );
  ctx.closePath();
  ctx.fill();
}

/**
 * Draws a 2D Star on canvas
 */
function drawStar2D(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  spikes: number,
  outerRadius: number,
  innerRadius: number
) {
  let rot = (Math.PI / 2) * 3;
  let x = cx;
  let y = cy;
  const step = Math.PI / spikes;

  ctx.beginPath();
  ctx.moveTo(cx, cy - outerRadius);
  for (let i = 0; i < spikes; i++) {
    x = cx + Math.cos(rot) * outerRadius;
    y = cy + Math.sin(rot) * outerRadius;
    ctx.lineTo(x, y);
    rot += step;

    x = cx + Math.cos(rot) * innerRadius;
    y = cy + Math.sin(rot) * innerRadius;
    ctx.lineTo(x, y);
    rot += step;
  }
  ctx.lineTo(cx, cy - outerRadius);
  ctx.closePath();
  ctx.fill();
}

/**
 * Draws a 2D Flower on canvas
 */
function drawFlower2D(ctx: CanvasRenderingContext2D, cx: number, cy: number, radius: number) {
  const petals = 5;
  ctx.beginPath();
  for (let i = 0; i <= 60; i++) {
    const angle = (i / 60) * Math.PI * 2;
    const r = radius * (0.75 + 0.25 * Math.cos(petals * angle));
    const x = cx + r * Math.cos(angle);
    const y = cy + r * Math.sin(angle);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fill();
}

/**
 * Rasterizes a single character or symbol to high-resolution 2D Signed Distance Field
 */
export function rasterizeGlyphSDF(
  char: string,
  fontFamily: FontChoice | string,
  canvasSize: number = 128,
  boldness: number = 2,
  sculptStyle: LetterSculptStyle = 'smooth'
): { sdf: Float32Array; size: number; isEmpty: boolean } {
  const cleanChar = char || ' ';
  if (cleanChar === ' ') {
    return { sdf: new Float32Array(canvasSize * canvasSize).fill(100), size: canvasSize, isEmpty: true };
  }

  const canvas = document.createElement('canvas');
  canvas.width = canvasSize;
  canvas.height = canvasSize;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) {
    return { sdf: new Float32Array(canvasSize * canvasSize).fill(100), size: canvasSize, isEmpty: true };
  }

  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, canvasSize, canvasSize);

  if (cleanChar === '❤️' || cleanChar === '<3' || cleanChar === '♥') {
    ctx.fillStyle = '#ffffff';
    drawHeart2D(ctx, canvasSize / 2, canvasSize / 2, canvasSize * 0.82, canvasSize * 0.88);
  } else if (cleanChar === '⭐' || cleanChar === '*') {
    ctx.fillStyle = '#ffffff';
    drawStar2D(ctx, canvasSize / 2, canvasSize / 2, 5, canvasSize * 0.45, canvasSize * 0.22);
  } else if (cleanChar === '🌸' || cleanChar === '🌼' || cleanChar === 'FLOWER') {
    ctx.fillStyle = '#ffffff';
    drawFlower2D(ctx, canvasSize / 2, canvasSize / 2, canvasSize * 0.42);
  } else if (cleanChar === '•' || cleanChar === 'DOT' || cleanChar === '⚪') {
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(canvasSize / 2, canvasSize / 2, canvasSize * 0.32, 0, Math.PI * 2);
    ctx.fill();
  } else if (cleanChar === '∞') {
    ctx.fillStyle = '#ffffff';
    ctx.font = `900 ${Math.floor(canvasSize * 0.85)}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('∞', canvasSize / 2, canvasSize / 2);
  } else {
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    if (sculptStyle === 'rounded') {
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
    } else {
      ctx.lineJoin = 'miter';
      ctx.lineCap = 'butt';
    }

    const fontSize = Math.floor(canvasSize * (fontFamily === 'Pacifico' ? 0.78 : 0.84));
    ctx.font = getFontCssString(fontFamily, fontSize, boldness, sculptStyle);

    ctx.save();
    ctx.translate(canvasSize / 2, canvasSize / 2 + 1);

    const strokeWidth = (boldness + (fontFamily === 'Pacifico' ? 2 : 0)) * (canvasSize / 64);
    if (strokeWidth > 0.5) {
      ctx.lineWidth = strokeWidth;
      ctx.strokeText(cleanChar, 0, 0);
    }
    ctx.fillText(cleanChar, 0, 0);
    ctx.restore();
  }

  const imgData = ctx.getImageData(0, 0, canvasSize, canvasSize);
  const binaryMask = new Uint8Array(canvasSize * canvasSize);
  let whiteCount = 0;

  for (let y = 0; y < canvasSize; y++) {
    // Invert Y so y=0 is at bottom
    const canvasY = canvasSize - 1 - y;
    for (let x = 0; x < canvasSize; x++) {
      const idx = (canvasY * canvasSize + x) * 4;
      const r = imgData.data[idx];
      const isSolid = r > 100 ? 1 : 0;
      binaryMask[y * canvasSize + x] = isSolid;
      if (isSolid) whiteCount++;
    }
  }

  if (whiteCount === 0) {
    return { sdf: new Float32Array(canvasSize * canvasSize).fill(100), size: canvasSize, isEmpty: true };
  }

  const sdf = compute2DSDF(binaryMask, canvasSize, canvasSize);
  return { sdf, size: canvasSize, isEmpty: false };
}

/**
 * Generates an ultra-smooth 3D continuous manifold mesh using 3D Surface Nets Iso-Surface Extraction
 * Zero-step / Anti-voxel technology: Smooth curves with full organic continuity.
 */
export function generateSingleDualLetterGeometry(
  charA: string,
  charB: string,
  font: FontChoice | string,
  targetHeight: number,
  viewAngleDeg: number = 45,
  res: number = 64,
  autoConnect: boolean = true,
  boldness: number = 2,
  sculptStyle: LetterSculptStyle = 'smooth'
): THREE.BufferGeometry {
  const sdfDataA = rasterizeGlyphSDF(charA, font, 128, boldness, sculptStyle);
  const sdfDataB = rasterizeGlyphSDF(charB, font, 128, boldness, sculptStyle);

  if (sdfDataA.isEmpty && sdfDataB.isEmpty) {
    return new THREE.BufferGeometry();
  }

  const angleRad = (viewAngleDeg * Math.PI) / 180;
  const cosA = Math.cos(angleRad);
  const sinA = Math.sin(angleRad);

  // Optical illusion envelope in 3D (mm)
  // Height: [0, targetHeight]
  // In X & Z: width corresponds to letter height scaled by projection
  const widthEnvelope = targetHeight * 0.92;
  const halfSpanX = (widthEnvelope / (2 * cosA)) * 1.05;
  const halfSpanZ = (widthEnvelope / (2 * sinA)) * 1.05;

  // Grid resolution for 3D Surface Nets
  const Ny = Math.max(36, Math.min(72, res));
  const Nx = Math.max(28, Math.round(Ny * (halfSpanX / (targetHeight * 0.5))));
  const Nz = Math.max(28, Math.round(Ny * (halfSpanZ / (targetHeight * 0.5))));

  const dx = (2 * halfSpanX) / (Nx - 1);
  const dy = targetHeight / (Ny - 1);
  const dz = (2 * halfSpanZ) / (Nz - 1);

  // Evaluate 3D continuous Signed Distance Field on grid vertices
  const gridScalars = new Float32Array(Nx * Ny * Nz);

  // Style tuning parameters
  let isoOffset = 0.0;
  if (sculptStyle === 'rounded') {
    isoOffset = -1.2; // Fillet expansion for soft curved geometry
  } else if (sculptStyle === 'sharp') {
    isoOffset = 0.3; // Tight crisp boundaries
  } else if (sculptStyle === 'chamfer') {
    isoOffset = -0.4;
  }

  for (let iz = 0; iz < Nz; iz++) {
    const z = -halfSpanZ + iz * dz;
    for (let iy = 0; iy < Ny; iy++) {
      const y = iy * dy;
      const vNorm = y / targetHeight;

      for (let ix = 0; ix < Nx; ix++) {
        const x = -halfSpanX + ix * dx;

        // Project 3D point (x, z) onto optical views A (+angle) and B (-angle)
        const uA = (x * cosA + z * sinA) / widthEnvelope + 0.5;
        const uB = (x * cosA - z * sinA) / widthEnvelope + 0.5;

        const valA = sdfDataA.isEmpty
          ? -10
          : sampleSDF(sdfDataA.sdf, sdfDataA.size, sdfDataA.size, uA, vNorm) * (targetHeight / sdfDataA.size);

        const valB = sdfDataB.isEmpty
          ? -10
          : sampleSDF(sdfDataB.sdf, sdfDataB.size, sdfDataB.size, uB, vNorm) * (targetHeight / sdfDataB.size);

        // Boolean intersection in continuous SDF space
        let dist = Math.max(valA, valB);

        // Clean flat base at bottom (y = 0) and top boundary
        const distBottom = -y;
        const distTop = y - targetHeight;
        dist = Math.max(dist, distBottom, distTop);

        gridScalars[(iz * Ny + iy) * Nx + ix] = dist + isoOffset;
      }
    }
  }

  // ----------------------------------------------------
  // Surface Nets Iso-Surface Extraction (Zero Crossing)
  // ----------------------------------------------------
  const cellVertices = new Int32Array(Nx * Ny * Nz).fill(-1);
  const vertices: number[] = [];
  const faces: number[] = [];

  const getScalar = (x: number, y: number, z: number) => gridScalars[(z * Ny + y) * Nx + x];

  // 1. For each voxel cell where corner signs cross zero, compute interpolated dual vertex
  for (let iz = 0; iz < Nz - 1; iz++) {
    for (let iy = 0; iy < Ny - 1; iy++) {
      for (let ix = 0; ix < Nx - 1; ix++) {
        const s000 = getScalar(ix, iy, iz);
        const s100 = getScalar(ix + 1, iy, iz);
        const s010 = getScalar(ix, iy + 1, iz);
        const s110 = getScalar(ix + 1, iy + 1, iz);
        const s001 = getScalar(ix, iy, iz + 1);
        const s101 = getScalar(ix + 1, iy, iz + 1);
        const s011 = getScalar(ix, iy + 1, iz + 1);
        const s111 = getScalar(ix + 1, iy + 1, iz + 1);

        // Check if all same sign
        const allPos = s000 > 0 && s100 > 0 && s010 > 0 && s110 > 0 && s001 > 0 && s101 > 0 && s011 > 0 && s111 > 0;
        const allNeg = s000 <= 0 && s100 <= 0 && s010 <= 0 && s110 <= 0 && s001 <= 0 && s101 <= 0 && s011 <= 0 && s111 <= 0;

        if (allPos || allNeg) continue;

        // Collect zero crossings along the 12 cell edges
        let sumX = 0, sumY = 0, sumZ = 0, crossCount = 0;

        const checkEdge = (
          x1: number, y1: number, z1: number, v1: number,
          x2: number, y2: number, z2: number, v2: number
        ) => {
          if ((v1 > 0 && v2 <= 0) || (v1 <= 0 && v2 > 0)) {
            const t = -v1 / (v2 - v1);
            sumX += x1 + t * (x2 - x1);
            sumY += y1 + t * (y2 - y1);
            sumZ += z1 + t * (z2 - z1);
            crossCount++;
          }
        };

        const x = -halfSpanX + ix * dx;
        const y = iy * dy;
        const z = -halfSpanZ + iz * dz;

        // Bottom 4 edges
        checkEdge(x, y, z, s000, x + dx, y, z, s100);
        checkEdge(x + dx, y, z, s100, x + dx, y, z + dz, s101);
        checkEdge(x + dx, y, z + dz, s101, x, y, z + dz, s001);
        checkEdge(x, y, z + dz, s001, x, y, z, s000);

        // Top 4 edges
        checkEdge(x, y + dy, z, s010, x + dx, y + dy, z, s110);
        checkEdge(x + dx, y + dy, z, s110, x + dx, y + dy, z + dz, s111);
        checkEdge(x + dx, y + dy, z + dz, s111, x, y + dy, z + dz, s011);
        checkEdge(x, y + dy, z + dz, s011, x, y + dy, z, s010);

        // Vertical 4 edges
        checkEdge(x, y, z, s000, x, y + dy, z, s010);
        checkEdge(x + dx, y, z, s100, x + dx, y + dy, z, s110);
        checkEdge(x + dx, y, z + dz, s101, x + dx, y + dy, z + dz, s111);
        checkEdge(x, y, z + dz, s001, x, y + dy, z + dz, s011);

        if (crossCount > 0) {
          const vIdx = vertices.length / 3;
          vertices.push(sumX / crossCount, sumY / crossCount, sumZ / crossCount);
          cellVertices[(iz * Ny + iy) * Nx + ix] = vIdx;
        }
      }
    }
  }

  if (vertices.length === 0) {
    return new THREE.BufferGeometry();
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

  if (faces.length === 0) {
    return new THREE.BufferGeometry();
  }

  // 3. Smooth Laplacian Relaxation (1 pass to eliminate any micro-faceted grid noise)
  const numVerts = vertices.length / 3;
  const neighborCounts = new Uint8Array(numVerts);
  const neighborSums = new Float32Array(numVerts * 3);

  for (let f = 0; f < faces.length; f += 3) {
    const i0 = faces[f];
    const i1 = faces[f + 1];
    const i2 = faces[f + 2];

    const addEdge = (a: number, b: number) => {
      neighborCounts[a]++;
      neighborSums[a * 3] += vertices[b * 3];
      neighborSums[a * 3 + 1] += vertices[b * 3 + 1];
      neighborSums[a * 3 + 2] += vertices[b * 3 + 2];
    };

    addEdge(i0, i1); addEdge(i1, i0);
    addEdge(i1, i2); addEdge(i2, i1);
    addEdge(i2, i0); addEdge(i0, i2);
  }

  const smoothLambda = sculptStyle === 'rounded' ? 0.35 : 0.22;
  const smoothedVerts = new Float32Array(vertices.length);

  for (let i = 0; i < numVerts; i++) {
    const origY = vertices[i * 3 + 1];
    // Keep bottom base flat for solid bed adhesion
    if (origY < 0.3) {
      smoothedVerts[i * 3] = vertices[i * 3];
      smoothedVerts[i * 3 + 1] = 0;
      smoothedVerts[i * 3 + 2] = vertices[i * 3 + 2];
      continue;
    }

    const count = neighborCounts[i];
    if (count > 0) {
      const avgX = neighborSums[i * 3] / count;
      const avgY = neighborSums[i * 3 + 1] / count;
      const avgZ = neighborSums[i * 3 + 2] / count;
      smoothedVerts[i * 3] = vertices[i * 3] * (1 - smoothLambda) + avgX * smoothLambda;
      smoothedVerts[i * 3 + 1] = vertices[i * 3 + 1] * (1 - smoothLambda) + avgY * smoothLambda;
      smoothedVerts[i * 3 + 2] = vertices[i * 3 + 2] * (1 - smoothLambda) + avgZ * smoothLambda;
    } else {
      smoothedVerts[i * 3] = vertices[i * 3];
      smoothedVerts[i * 3 + 1] = vertices[i * 3 + 1];
      smoothedVerts[i * 3 + 2] = vertices[i * 3 + 2];
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(smoothedVerts, 3));
  geometry.setIndex(faces);
  geometry.computeVertexNormals();

  // Zero-grounding: ensure geometry bottom touches Y = 0 strictly
  geometry.computeBoundingBox();
  if (geometry.boundingBox) {
    const minY = geometry.boundingBox.min.y;
    if (!isNaN(minY)) {
      geometry.translate(0, -minY, 0);
    }
  }

  return geometry;
}

/**
 * Creates an elegant, solid, volumetric 3D Heart sculpture with rounded beveled contours
 * Calibrated to match the EXACT height of the letters (1:1 scale)
 */
export function generateHeart3DGeometry(targetHeight: number, targetDepth: number): THREE.BufferGeometry {
  const shape = new THREE.Shape();
  const numPoints = 100;

  // Parametric heart formula with normalized aspect ratio matching letter width (~0.88 * height)
  for (let i = 0; i <= numPoints; i++) {
    const t = (i / numPoints) * Math.PI * 2;
    const rawX = 16 * Math.pow(Math.sin(t), 3);
    const rawY = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t);

    // rawY is in [-17, 5] (delta = 22). Normalize so bottom tip is 0, top of lobes is targetHeight
    const normY = ((rawY + 17) / 22) * targetHeight;
    // Scale X so overall width is ~0.86 * targetHeight (balanced with bold 3D letters)
    const normX = (rawX / 16) * (targetHeight * 0.43);

    if (i === 0) {
      shape.moveTo(normX, normY);
    } else {
      shape.lineTo(normX, normY);
    }
  }
  shape.closePath();

  const bevelSize = Math.min(1.4, targetDepth * 0.08);
  const extrudeSettings: THREE.ExtrudeGeometryOptions = {
    depth: Math.max(2, targetDepth - bevelSize * 2),
    bevelEnabled: true,
    bevelSegments: 4,
    steps: 1,
    bevelSize: bevelSize,
    bevelThickness: bevelSize,
  };

  const geo = new THREE.ExtrudeGeometry(shape, extrudeSettings);
  geo.center();

  // Strictly enforce exact targetHeight matching letter height and ground to Y = 0
  geo.computeBoundingBox();
  if (geo.boundingBox) {
    const curH = geo.boundingBox.max.y - geo.boundingBox.min.y;
    if (curH > 0) {
      const scaleFactor = targetHeight / curH;
      geo.scale(scaleFactor, scaleFactor, 1);
    }
    geo.computeBoundingBox();
    if (geo.boundingBox) {
      geo.translate(0, -geo.boundingBox.min.y, 0);
    }
  }

  return geo;
}

/**
 * Creates 3D Star geometry strictly matching letter height
 */
export function generateStar3DGeometry(targetHeight: number, targetDepth: number): THREE.BufferGeometry {
  const shape = new THREE.Shape();
  const spikes = 5;
  const outerR = targetHeight * 0.5;
  const innerR = targetHeight * 0.22;
  let rot = (Math.PI / 2) * 3;
  const step = Math.PI / spikes;

  shape.moveTo(0, outerR);
  for (let i = 0; i < spikes; i++) {
    shape.lineTo(Math.cos(rot) * outerR, Math.sin(rot) * outerR);
    rot += step;
    shape.lineTo(Math.cos(rot) * innerR, Math.sin(rot) * innerR);
    rot += step;
  }
  shape.closePath();

  const bevelSize = Math.min(1.2, targetDepth * 0.07);
  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: Math.max(2, targetDepth - bevelSize * 2),
    bevelEnabled: true,
    bevelSegments: 3,
    steps: 1,
    bevelSize: bevelSize,
    bevelThickness: bevelSize,
  });
  geo.center();
  geo.computeBoundingBox();
  if (geo.boundingBox) {
    const curH = geo.boundingBox.max.y - geo.boundingBox.min.y;
    if (curH > 0) {
      const scaleFactor = targetHeight / curH;
      geo.scale(scaleFactor, scaleFactor, 1);
    }
    geo.computeBoundingBox();
    if (geo.boundingBox) {
      geo.translate(0, -geo.boundingBox.min.y, 0);
    }
  }
  return geo;
}

/**
 * Creates 3D Infinity (∞) geometry matching letter height
 */
export function generateInfinity3DGeometry(targetHeight: number, targetDepth: number): THREE.BufferGeometry {
  const shape = new THREE.Shape();
  const numPoints = 80;
  const a = targetHeight * 0.42;

  for (let i = 0; i <= numPoints; i++) {
    const t = (i / numPoints) * Math.PI * 2;
    const denom = 1 + Math.sin(t) * Math.sin(t);
    const x = (a * 1.35 * Math.cos(t)) / denom;
    const y = (a * 1.35 * Math.sin(t) * Math.cos(t)) / denom;
    if (i === 0) shape.moveTo(x, y);
    else shape.lineTo(x, y);
  }
  shape.closePath();

  const bevelSize = Math.min(1.2, targetDepth * 0.08);
  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: Math.max(2, targetDepth - bevelSize * 2),
    bevelEnabled: true,
    bevelSegments: 3,
    steps: 1,
    bevelSize: bevelSize,
    bevelThickness: bevelSize,
  });
  geo.center();
  geo.computeBoundingBox();
  if (geo.boundingBox) {
    const curH = geo.boundingBox.max.y - geo.boundingBox.min.y;
    if (curH > 0) {
      const scaleFactor = (targetHeight * 0.68) / curH;
      geo.scale(scaleFactor, scaleFactor, 1);
    }
    geo.computeBoundingBox();
    if (geo.boundingBox) {
      geo.translate(0, -geo.boundingBox.min.y, 0);
    }
  }
  return geo;
}

/**
 * Creates 3D Flower geometry matching letter height
 */
export function generateFlower3DGeometry(targetHeight: number, targetDepth: number): THREE.BufferGeometry {
  const shape = new THREE.Shape();
  const petals = 5;
  const numPoints = 100;
  const rBase = targetHeight * 0.36;
  const rAmp = targetHeight * 0.12;

  for (let i = 0; i <= numPoints; i++) {
    const angle = (i / numPoints) * Math.PI * 2;
    const r = rBase + rAmp * Math.cos(petals * angle);
    const x = r * Math.cos(angle);
    const y = r * Math.sin(angle);
    if (i === 0) shape.moveTo(x, y);
    else shape.lineTo(x, y);
  }
  shape.closePath();

  const bevelSize = Math.min(1.4, targetDepth * 0.08);
  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: Math.max(2, targetDepth - bevelSize * 2),
    bevelEnabled: true,
    bevelSegments: 4,
    steps: 1,
    bevelSize: bevelSize,
    bevelThickness: bevelSize,
  });
  geo.center();
  geo.computeBoundingBox();
  if (geo.boundingBox) {
    const curH = geo.boundingBox.max.y - geo.boundingBox.min.y;
    if (curH > 0) {
      const scaleFactor = targetHeight / curH;
      geo.scale(scaleFactor, scaleFactor, 1);
    }
    geo.computeBoundingBox();
    if (geo.boundingBox) {
      geo.translate(0, -geo.boundingBox.min.y, 0);
    }
  }
  return geo;
}

/**
 * Creates 3D Dot / Cylinder bead geometry
 */
export function generateDot3DGeometry(targetHeight: number, targetDepth: number): THREE.BufferGeometry {
  const radius = targetHeight * 0.28;
  const geo = new THREE.CylinderGeometry(radius, radius, Math.max(2, targetDepth), 32);
  geo.rotateX(Math.PI / 2);
  geo.computeBoundingBox();
  if (geo.boundingBox) {
    geo.translate(0, -geo.boundingBox.min.y, 0);
  }
  return geo;
}

/**
 * Creates a Stadium / Capsule (Pill-shaped) elongated base plate with smooth rounded ends
 */
export function generatePillBaseGeometry(
  totalLength: number,
  baseDepth: number,
  baseHeight: number,
  chamfer: boolean = true
): THREE.BufferGeometry {
  const halfLen = totalLength / 2;
  const halfDepth = baseDepth / 2;
  const radius = halfDepth;
  const straightHalf = Math.max(0.1, halfLen - radius);

  const shape = new THREE.Shape();
  shape.moveTo(straightHalf, halfDepth);
  shape.lineTo(-straightHalf, halfDepth);
  shape.absarc(-straightHalf, 0, radius, Math.PI / 2, (Math.PI * 3) / 2, false);
  shape.lineTo(straightHalf, -halfDepth);
  shape.absarc(straightHalf, 0, radius, -Math.PI / 2, Math.PI / 2, false);
  shape.closePath();

  const bevelSize = chamfer ? Math.min(1.2, baseHeight * 0.25) : 0;
  const extrudeSettings: THREE.ExtrudeGeometryOptions = {
    depth: Math.max(0.4, baseHeight - (chamfer ? bevelSize * 2 : 0)),
    bevelEnabled: chamfer,
    bevelSegments: 4,
    steps: 1,
    bevelSize: bevelSize,
    bevelThickness: bevelSize,
  };

  const geo = new THREE.ExtrudeGeometry(shape, extrudeSettings);
  // Shape is in XY plane. Extrude is along +Z. Rotate so extrusion becomes +Y (vertical height)
  geo.rotateX(-Math.PI / 2);
  geo.computeBoundingBox();
  if (geo.boundingBox) {
    // Ensure base bottom sits directly on the build bed (Y = 0)
    geo.translate(0, -geo.boundingBox.min.y, 0);
  }
  return geo;
}

/**
 * Creates small 3D text in relief along the base (e.g. dates, names)
 */
export function generateBaseTextReliefGeometry(
  text: string,
  totalWidth: number,
  baseDepth: number,
  baseHeight: number,
  textHeight: number = 1.4
): THREE.BufferGeometry {
  const clean = text.trim().toUpperCase();
  if (!clean) return new THREE.BufferGeometry();

  const letters = clean.split('');
  const count = letters.length;
  const charWidth = Math.min(10, (totalWidth * 0.75) / count);
  const letterGeos: THREE.BufferGeometry[] = [];

  const startX = -((count - 1) * charWidth) / 2;
  const posZ = baseDepth * 0.38;

  for (let i = 0; i < count; i++) {
    const char = letters[i];
    if (char === ' ') continue;

    const geo = generateSingleDualLetterGeometry(
      char,
      char,
      'Montserrat',
      charWidth * 0.85,
      45,
      32,
      true,
      2,
      'smooth'
    );
    geo.scale(1, 0.45, 0.45);
    geo.translate(startX + i * charWidth, baseHeight + 0.1, posZ);
    letterGeos.push(geo);
  }

  return mergeGeometries(letterGeos);
}

/**
 * Main Generator for the Linear Illusion Display (Michael & Jessica Sculpture)
 */
export function generateLinearDualTextGeometries(params: DualTextParams): DualTextGeometries {
  const wordA = (params.wordA || 'MICHAEL').toUpperCase().trim();
  const wordB = (params.wordB || 'JESSICA').toUpperCase().trim();

  const lenA = wordA.length;
  const lenB = wordB.length;
  const maxLen = Math.max(lenA, lenB, 1);
  const fillStrategy = params.fillStrategy || 'pad-heart-solid';

  const letterHeight = params.height || 42;
  const viewAngle = params.viewAngle || 45;
  const spacing = params.letterSpacing || (letterHeight * 0.75);
  const letterBlocksGeos: THREE.BufferGeometry[] = [];

  // Determine characters or items for each index
  const items: Array<
    | { type: 'dual'; cA: string; cB: string }
    | { type: 'solid'; shape: 'heart' | 'star' | 'infinity' | 'flower' | 'dot' | 'single'; char?: string }
  > = [];

  for (let i = 0; i < maxLen; i++) {
    const hasA = i < lenA;
    const hasB = i < lenB;

    if (hasA && hasB) {
      items.push({ type: 'dual', cA: wordA[i], cB: wordB[i] });
    } else if (hasA && !hasB) {
      // Word B is shorter than Word A
      if (fillStrategy === 'pad-heart-solid') {
        items.push({ type: 'solid', shape: 'heart' });
      } else if (fillStrategy === 'pad-star-solid') {
        items.push({ type: 'solid', shape: 'star' });
      } else if (fillStrategy === 'pad-infinity') {
        items.push({ type: 'solid', shape: 'infinity' });
      } else if (fillStrategy === 'pad-flower') {
        items.push({ type: 'solid', shape: 'flower' });
      } else if (fillStrategy === 'pad-dot') {
        items.push({ type: 'solid', shape: 'dot' });
      } else if (fillStrategy === 'pad-repeat') {
        const repChar = lenB > 0 ? wordB[lenB - 1] : ' ';
        items.push({ type: 'dual', cA: wordA[i], cB: repChar });
      } else if (fillStrategy === 'pad-heart') {
        items.push({ type: 'dual', cA: wordA[i], cB: '❤️' });
      } else if (fillStrategy === 'pad-star') {
        items.push({ type: 'dual', cA: wordA[i], cB: '⭐' });
      } else if (fillStrategy === 'pad-space') {
        items.push({ type: 'solid', shape: 'single', char: wordA[i] });
      }
    } else if (!hasA && hasB) {
      // Word A is shorter than Word B
      if (fillStrategy === 'pad-heart-solid') {
        items.push({ type: 'solid', shape: 'heart' });
      } else if (fillStrategy === 'pad-star-solid') {
        items.push({ type: 'solid', shape: 'star' });
      } else if (fillStrategy === 'pad-infinity') {
        items.push({ type: 'solid', shape: 'infinity' });
      } else if (fillStrategy === 'pad-flower') {
        items.push({ type: 'solid', shape: 'flower' });
      } else if (fillStrategy === 'pad-dot') {
        items.push({ type: 'solid', shape: 'dot' });
      } else if (fillStrategy === 'pad-repeat') {
        const repChar = lenA > 0 ? wordA[lenA - 1] : ' ';
        items.push({ type: 'dual', cA: repChar, cB: wordB[i] });
      } else if (fillStrategy === 'pad-heart') {
        items.push({ type: 'dual', cA: '❤️', cB: wordB[i] });
      } else if (fillStrategy === 'pad-star') {
        items.push({ type: 'dual', cA: '⭐', cB: wordB[i] });
      } else if (fillStrategy === 'pad-space') {
        items.push({ type: 'solid', shape: 'single', char: wordB[i] });
      }
    }
  }

  // Center letters along X axis
  const totalLettersSpan = (maxLen - 1) * spacing;
  const startX = -totalLettersSpan / 2;

  const sculptStyle = params.sculptStyle || 'smooth';
  const strokeBoldness = params.strokeBoldness !== undefined ? params.strokeBoldness : 2;
  const baseHeight = params.baseHeight || 4.5;
  const hasBase = params.baseType !== 'none';
  // Base elevation: when base is enabled, embed letters 1.0mm into the base plate for 100% solid adhesion
  const baseElevation = hasBase ? Math.max(0, baseHeight - 1.0) : 0;
  const letterDepth = Math.max(10, params.letterDepth || (letterHeight * 0.65));

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    let blockGeo: THREE.BufferGeometry | null = null;

    if (item.type === 'dual') {
      blockGeo = generateSingleDualLetterGeometry(
        item.cA,
        item.cB,
        params.font,
        letterHeight,
        viewAngle,
        params.resolution || 64,
        params.autoConnectFloatingParts,
        strokeBoldness,
        sculptStyle
      );
    } else if (item.type === 'solid') {
      if (item.shape === 'heart') {
        blockGeo = generateHeart3DGeometry(letterHeight, letterDepth);
      } else if (item.shape === 'star') {
        blockGeo = generateStar3DGeometry(letterHeight, letterDepth);
      } else if (item.shape === 'infinity') {
        blockGeo = generateInfinity3DGeometry(letterHeight, letterDepth);
      } else if (item.shape === 'flower') {
        blockGeo = generateFlower3DGeometry(letterHeight, letterDepth);
      } else if (item.shape === 'dot') {
        blockGeo = generateDot3DGeometry(letterHeight, letterDepth);
      } else if (item.shape === 'single' && item.char) {
        blockGeo = generateSingleDualLetterGeometry(
          item.char,
          item.char,
          params.font,
          letterHeight,
          viewAngle,
          params.resolution || 64,
          params.autoConnectFloatingParts,
          strokeBoldness,
          sculptStyle
        );
      }
    }

    if (blockGeo && blockGeo.getAttribute('position')) {
      // Ensure bottom of block is grounded strictly at Y = 0 before translation
      blockGeo.computeBoundingBox();
      if (blockGeo.boundingBox) {
        const minY = blockGeo.boundingBox.min.y;
        if (!isNaN(minY)) {
          blockGeo.translate(0, -minY, 0);
        }
      }
      blockGeo.translate(startX + i * spacing, baseElevation, 0);
      letterBlocksGeos.push(blockGeo);
    }
  }

  const mergedLetters = mergeGeometries(letterBlocksGeos);

  // 2. End Decorations (Hearts or Stars) - Exactly matching letter height with clean non-encroaching clearance
  const decorGeos: THREE.BufferGeometry[] = [];
  const heartHeight = letterHeight; // Same height as the letters (1:1)
  const heartDepth = letterDepth;
  
  const decorGap = Math.max(8, spacing * 0.28);
  const endOffset = (totalLettersSpan / 2) + (spacing * 0.5) + (heartHeight * 0.43) + decorGap;

  if (params.endDecoration === 'hearts') {
    const leftHeart = generateHeart3DGeometry(heartHeight, heartDepth);
    leftHeart.translate(-endOffset, baseElevation, 0);
    decorGeos.push(leftHeart);

    const rightHeart = generateHeart3DGeometry(heartHeight, heartDepth);
    rightHeart.translate(endOffset, baseElevation, 0);
    decorGeos.push(rightHeart);
  } else if (params.endDecoration === 'stars') {
    const leftStar = generateStar3DGeometry(heartHeight, heartDepth);
    leftStar.translate(-endOffset, baseElevation, 0);
    decorGeos.push(leftStar);

    const rightStar = generateStar3DGeometry(heartHeight, heartDepth);
    rightStar.translate(endOffset, baseElevation, 0);
    decorGeos.push(rightStar);
  }

  const mergedDecorations = mergeGeometries(decorGeos);

  // 3. Base Geometry
  let baseGeo: THREE.BufferGeometry = new THREE.BufferGeometry();
  const decorMargin = params.endDecoration !== 'none'
    ? (heartHeight * 0.43 + params.basePadding + 4)
    : (spacing * 0.5 + params.basePadding + 4);
  const totalBaseLength = ((params.endDecoration !== 'none' ? endOffset : totalLettersSpan / 2) + decorMargin) * 2;
  const baseDepth = Math.max(params.baseWidth || 32, letterHeight * 0.82 + params.basePadding * 2);

  if (hasBase) {
    if (params.baseType === 'pill' || params.baseType === 'pedestal') {
      baseGeo = generatePillBaseGeometry(totalBaseLength, baseDepth, baseHeight, params.chamferEdges);
    } else if (params.baseType === 'chamfer') {
      baseGeo = generatePillBaseGeometry(totalBaseLength, baseDepth, baseHeight, true);
    } else if (params.baseType === 'keychain') {
      const pill = generatePillBaseGeometry(totalBaseLength, baseDepth, baseHeight, false);
      const ringGeo = new THREE.TorusGeometry(params.keychainHoleRadius + 1.6, 1.6, 12, 24);
      ringGeo.rotateX(Math.PI / 2);
      ringGeo.translate(-totalBaseLength / 2 - params.keychainHoleRadius * 1.5, baseHeight / 2, 0);
      baseGeo = mergeGeometries([pill, ringGeo]);
    } else {
      // Basic solid box
      const box = new THREE.BoxGeometry(totalBaseLength, baseHeight, baseDepth);
      box.translate(0, baseHeight / 2, 0);
      baseGeo = box;
    }
  }

  // 4. Base Text Relief (only if explicitly filled by the user)
  let baseTextGeo: THREE.BufferGeometry = new THREE.BufferGeometry();
  if (params.baseText && params.baseText.trim()) {
    baseTextGeo = generateBaseTextReliefGeometry(
      params.baseText,
      totalBaseLength * 0.8,
      baseDepth,
      baseHeight,
      1.5
    );
  }

  // Combine everything for single-file STL export
  const combined = mergeGeometries([mergedLetters, mergedDecorations, baseGeo, baseTextGeo]);

  return {
    combined,
    lettersGeo: mergedLetters,
    baseGeo: baseGeo,
    decorationsGeo: mergedDecorations,
    baseTextGeo: baseTextGeo,
  };
}

/**
 * Traditional Monolith Dual-Text Generator (Gödel-Escher-Bach 90° block)
 */
export function generateMonolithDualTextGeometries(params: DualTextParams): DualTextGeometries {
  const wordA = (params.wordA || 'AMOR').toUpperCase();
  const wordB = (params.wordB || 'PAZ').toUpperCase();

  const lenA = Math.max(1, wordA.length);
  const lenB = Math.max(1, wordB.length);

  const targetHeight = params.height || 45;
  const sdfDataA = rasterizeMonolithSDF(wordA, params.font, targetHeight, false);
  const sdfDataB = rasterizeMonolithSDF(wordB, params.font, targetHeight, params.mirrorWordB);

  const modelW = targetHeight * Math.max(0.7, lenA * 0.65);
  const modelD = targetHeight * Math.max(0.7, lenB * 0.65);

  const Ny = Math.max(36, Math.min(64, params.resolution || 54));
  const Nx = Math.max(28, Math.round(Ny * (modelW / targetHeight)));
  const Nz = Math.max(28, Math.round(Ny * (modelD / targetHeight)));

  const dx = modelW / (Nx - 1);
  const dy = targetHeight / (Ny - 1);
  const dz = modelD / (Nz - 1);

  const halfW = modelW / 2;
  const halfD = modelD / 2;

  const gridScalars = new Float32Array(Nx * Ny * Nz);

  for (let iz = 0; iz < Nz; iz++) {
    const z = -halfD + iz * dz;
    const uB = z / modelD + 0.5;

    for (let iy = 0; iy < Ny; iy++) {
      const y = iy * dy;
      const v = y / targetHeight;

      for (let ix = 0; ix < Nx; ix++) {
        const x = -halfW + ix * dx;
        const uA = x / modelW + 0.5;

        const valA = sampleSDF(sdfDataA.sdf, sdfDataA.w, sdfDataA.h, uA, v) * (targetHeight / sdfDataA.h);
        const valB = sampleSDF(sdfDataB.sdf, sdfDataB.w, sdfDataB.h, uB, v) * (targetHeight / sdfDataB.h);

        let dist = Math.max(valA, valB);
        dist = Math.max(dist, -y, y - targetHeight);

        gridScalars[(iz * Ny + iy) * Nx + ix] = dist;
      }
    }
  }

  // Surface Nets for Monolith
  const cellVertices = new Int32Array(Nx * Ny * Nz).fill(-1);
  const vertices: number[] = [];
  const faces: number[] = [];

  const getScalar = (x: number, y: number, z: number) => gridScalars[(z * Ny + y) * Nx + x];

  for (let iz = 0; iz < Nz - 1; iz++) {
    for (let iy = 0; iy < Ny - 1; iy++) {
      for (let ix = 0; ix < Nx - 1; ix++) {
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
          x1: number, y1: number, z1: number, v1: number,
          x2: number, y2: number, z2: number, v2: number
        ) => {
          if ((v1 > 0 && v2 <= 0) || (v1 <= 0 && v2 > 0)) {
            const t = -v1 / (v2 - v1);
            sumX += x1 + t * (x2 - x1);
            sumY += y1 + t * (y2 - y1);
            sumZ += z1 + t * (z2 - z1);
            crossCount++;
          }
        };

        const x = -halfW + ix * dx;
        const y = iy * dy;
        const z = -halfD + iz * dz;

        checkEdge(x, y, z, s000, x + dx, y, z, s100);
        checkEdge(x + dx, y, z, s100, x + dx, y, z + dz, s101);
        checkEdge(x + dx, y, z + dz, s101, x, y, z + dz, s001);
        checkEdge(x, y, z + dz, s001, x, y, z, s000);

        checkEdge(x, y + dy, z, s010, x + dx, y + dy, z, s110);
        checkEdge(x + dx, y + dy, z, s110, x + dx, y + dy, z + dz, s111);
        checkEdge(x + dx, y + dy, z + dz, s111, x, y + dy, z + dz, s011);
        checkEdge(x, y + dy, z + dz, s011, x, y + dy, z, s010);

        checkEdge(x, y, z, s000, x, y + dy, z, s010);
        checkEdge(x + dx, y, z, s100, x + dx, y + dy, z, s110);
        checkEdge(x + dx, y, z + dz, s101, x + dx, y + dy, z + dz, s111);
        checkEdge(x, y, z + dz, s001, x, y + dy, z + dz, s011);

        if (crossCount > 0) {
          const vIdx = vertices.length / 3;
          vertices.push(sumX / crossCount, sumY / crossCount, sumZ / crossCount);
          cellVertices[(iz * Ny + iy) * Nx + ix] = vIdx;
        }
      }
    }
  }

  for (let iz = 0; iz < Nz; iz++) {
    for (let iy = 0; iy < Ny; iy++) {
      for (let ix = 0; ix < Nx; ix++) {
        if (ix < Nx - 1 && iy > 0 && iz > 0) {
          const v0 = getScalar(ix, iy, iz);
          const v1 = getScalar(ix + 1, iy, iz);
          if ((v0 > 0 && v1 <= 0) || (v0 <= 0 && v1 > 0)) {
            const c00 = cellVertices[((iz - 1) * Ny + (iy - 1)) * Nx + ix];
            const c10 = cellVertices[(iz * Ny + (iy - 1)) * Nx + ix];
            const c11 = cellVertices[(iz * Ny + iy) * Nx + ix];
            const c01 = cellVertices[((iz - 1) * Ny + iy) * Nx + ix];
            if (c00 >= 0 && c10 >= 0 && c11 >= 0 && c01 >= 0) {
              if (v0 > 0) faces.push(c00, c10, c11, c00, c11, c01);
              else faces.push(c00, c11, c10, c00, c01, c11);
            }
          }
        }
        if (iy < Ny - 1 && ix > 0 && iz > 0) {
          const v0 = getScalar(ix, iy, iz);
          const v1 = getScalar(ix, iy + 1, iz);
          if ((v0 > 0 && v1 <= 0) || (v0 <= 0 && v1 > 0)) {
            const c00 = cellVertices[((iz - 1) * Ny + iy) * Nx + (ix - 1)];
            const c10 = cellVertices[(iz * Ny + iy) * Nx + (ix - 1)];
            const c11 = cellVertices[(iz * Ny + iy) * Nx + ix];
            const c01 = cellVertices[((iz - 1) * Ny + iy) * Nx + ix];
            if (c00 >= 0 && c10 >= 0 && c11 >= 0 && c01 >= 0) {
              if (v0 <= 0) faces.push(c00, c10, c11, c00, c11, c01);
              else faces.push(c00, c11, c10, c00, c01, c11);
            }
          }
        }
        if (iz < Nz - 1 && ix > 0 && iy > 0) {
          const v0 = getScalar(ix, iy, iz);
          const v1 = getScalar(ix, iy, iz + 1);
          if ((v0 > 0 && v1 <= 0) || (v0 <= 0 && v1 > 0)) {
            const c00 = cellVertices[(iz * Ny + (iy - 1)) * Nx + (ix - 1)];
            const c10 = cellVertices[(iz * Ny + (iy - 1)) * Nx + ix];
            const c11 = cellVertices[(iz * Ny + iy) * Nx + ix];
            const c01 = cellVertices[(iz * Ny + iy) * Nx + (ix - 1)];
            if (c00 >= 0 && c10 >= 0 && c11 >= 0 && c01 >= 0) {
              if (v0 > 0) faces.push(c00, c10, c11, c00, c11, c01);
              else faces.push(c00, c11, c10, c00, c01, c11);
            }
          }
        }
      }
    }
  }

  const lettersGeo = new THREE.BufferGeometry();
  if (vertices.length > 0 && faces.length > 0) {
    lettersGeo.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    lettersGeo.setIndex(faces);
    lettersGeo.computeVertexNormals();
  }

  let baseGeo: THREE.BufferGeometry = new THREE.BufferGeometry();
  if (params.baseType && params.baseType !== 'none') {
    const baseW = modelW + params.basePadding * 2;
    const baseD = modelD + params.basePadding * 2;
    const baseH = params.baseHeight || 4;

    if (params.baseType === 'pill' || params.baseType === 'solid') {
      baseGeo = generatePillBaseGeometry(baseW, baseD, baseH, true);
    } else if (params.baseType === 'chamfer') {
      const shape = new THREE.Shape();
      const hw = baseW / 2;
      const hd = baseD / 2;
      shape.moveTo(-hw, -hd);
      shape.lineTo(hw, -hd);
      shape.lineTo(hw, hd);
      shape.lineTo(-hw, hd);
      shape.closePath();

      const extrudeSettings = {
        depth: baseH,
        bevelEnabled: true,
        bevelSegments: 3,
        steps: 1,
        bevelSize: 2,
        bevelThickness: 1.5,
      };
      const geo = new THREE.ExtrudeGeometry(shape, extrudeSettings);
      geo.rotateX(Math.PI / 2);
      geo.translate(0, -baseH / 2, 0);
      baseGeo = geo;
    } else {
      const box = new THREE.BoxGeometry(baseW, baseH, baseD);
      box.translate(0, -baseH / 2, 0);
      baseGeo = box;
    }
  }

  const combined = mergeGeometries([lettersGeo, baseGeo]);
  return {
    combined,
    lettersGeo,
    baseGeo,
  };
}

/**
 * Helper to rasterize entire word for monolith with continuous SDF
 */
function rasterizeMonolithSDF(
  text: string,
  fontFamily: string,
  targetH: number,
  mirror: boolean = false
): { sdf: Float32Array; w: number; h: number } {
  const canvasW = 256;
  const canvasH = 128;
  const canvas = document.createElement('canvas');
  canvas.width = canvasW;
  canvas.height = canvasH;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return { sdf: new Float32Array(canvasW * canvasH).fill(100), w: canvasW, h: canvasH };

  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, canvasW, canvasH);

  const cleanText = text.trim();
  if (!cleanText) return { sdf: new Float32Array(canvasW * canvasH).fill(100), w: canvasW, h: canvasH };

  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const fontSize = Math.floor(canvasH * 0.82);
  ctx.font = `900 ${fontSize}px "${fontFamily}", sans-serif`;

  const measured = ctx.measureText(cleanText);
  let scaleX = 1;
  const targetWidth = canvasW * 0.88;
  if (measured.width > targetWidth && measured.width > 0) {
    scaleX = targetWidth / measured.width;
  }

  ctx.save();
  ctx.translate(canvasW / 2, canvasH / 2);
  if (mirror) {
    ctx.scale(-scaleX, 1);
  } else {
    ctx.scale(scaleX, 1);
  }
  ctx.fillText(cleanText, 0, 2);
  ctx.restore();

  const imgData = ctx.getImageData(0, 0, canvasW, canvasH);
  const binaryMask = new Uint8Array(canvasW * canvasH);

  for (let y = 0; y < canvasH; y++) {
    const canvasY = canvasH - 1 - y;
    for (let x = 0; x < canvasW; x++) {
      const idx = (canvasY * canvasW + x) * 4;
      const r = imgData.data[idx];
      binaryMask[y * canvasW + x] = r > 110 ? 1 : 0;
    }
  }

  const sdf = compute2DSDF(binaryMask, canvasW, canvasH);
  return { sdf, w: canvasW, h: canvasH };
}

/**
 * Universal dispatcher
 */
export function generateDualTextGeometry(params: DualTextParams): THREE.BufferGeometry {
  const geos = generateDualTextCompleteGeometries(params);
  return geos.combined;
}

export function generateDualTextCompleteGeometries(params: DualTextParams): DualTextGeometries {
  if (params.layoutStyle === 'monolith') {
    return generateMonolithDualTextGeometries(params);
  }
  return generateLinearDualTextGeometries(params);
}

/**
 * Utility to merge multiple BufferGeometries into one
 */
export function mergeGeometries(geos: THREE.BufferGeometry[]): THREE.BufferGeometry {
  const validGeos = geos.filter((g) => g && g.getAttribute && g.getAttribute('position') && g.getAttribute('position').count > 0);
  if (validGeos.length === 0) return new THREE.BufferGeometry();
  if (validGeos.length === 1) return validGeos[0];

  let totalVerts = 0;
  for (const g of validGeos) {
    const nonIndexed = g.index ? g.toNonIndexed() : g;
    totalVerts += nonIndexed.getAttribute('position').count;
  }

  const mergedPos = new Float32Array(totalVerts * 3);
  const mergedNorm = new Float32Array(totalVerts * 3);

  let offset = 0;
  for (const g of validGeos) {
    const nonIndexed = g.index ? g.toNonIndexed() : g;
    const pos = nonIndexed.getAttribute('position');
    const norm = nonIndexed.getAttribute('normal');

    for (let i = 0; i < pos.count; i++) {
      mergedPos[(offset + i) * 3] = pos.getX(i);
      mergedPos[(offset + i) * 3 + 1] = pos.getY(i);
      mergedPos[(offset + i) * 3 + 2] = pos.getZ(i);

      if (norm) {
        mergedNorm[(offset + i) * 3] = norm.getX(i);
        mergedNorm[(offset + i) * 3 + 1] = norm.getY(i);
        mergedNorm[(offset + i) * 3 + 2] = norm.getZ(i);
      } else {
        mergedNorm[(offset + i) * 3 + 1] = 1;
      }
    }
    offset += pos.count;
  }

  const merged = new THREE.BufferGeometry();
  merged.setAttribute('position', new THREE.BufferAttribute(mergedPos, 3));
  merged.setAttribute('normal', new THREE.BufferAttribute(mergedNorm, 3));
  merged.computeVertexNormals();
  return merged;
}

