import * as THREE from 'three';
import { LithophaneParams } from '../types';

export const SAMPLE_LITHOPHANE_IMAGES: { id: string; name: string; url: string; category: string }[] = [
  {
    id: 'couple',
    name: 'Casal Romântico',
    category: 'Amor & Casamento',
    url: 'https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?w=600&auto=format&fit=crop&q=80',
  },
  {
    id: 'dog',
    name: 'Pet / Cachorrinho',
    category: 'Animais',
    url: 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=600&auto=format&fit=crop&q=80',
  },
  {
    id: 'landscape',
    name: 'Pôr do Sol & Montanha',
    category: 'Paisagem',
    url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=600&auto=format&fit=crop&q=80',
  },
  {
    id: 'family',
    name: 'Família & Bebê',
    category: 'Família',
    url: 'https://images.unsplash.com/photo-1511895426328-dc8714191300?w=600&auto=format&fit=crop&q=80',
  },
];

/**
 * Creates ultra-high quality 3D Lithophane / Photo Relief geometry with solid borders and kickstand
 */
export async function generateLithophaneGeometry(params: LithophaneParams): Promise<THREE.BufferGeometry> {
  const img = new Image();
  img.crossOrigin = 'anonymous';

  const defaultUrl = params.imageUrl || (SAMPLE_LITHOPHANE_IMAGES[0].url);

  await new Promise<void>((resolve) => {
    img.onload = () => resolve();
    img.onerror = () => {
      img.src = createProceduralLithoPattern();
      img.onload = () => resolve();
    };
    img.src = defaultUrl;
  });

  const widthMm = Math.max(40, Math.min(220, params.width || 90));
  const heightMm = Math.max(40, Math.min(220, params.height || 90));
  const minT = Math.max(0.6, Math.min(2.0, params.minThickness || 0.8));
  const maxT = Math.max(1.8, Math.min(5.0, params.maxThickness || 3.0));
  const borderMm = Math.max(0, Math.min(10, params.frameBorder || 3.5));
  const borderT = Math.max(minT, Math.min(6.0, params.frameThickness || 2.8));
  const shape = params.shape || 'curved';
  const curveAngleRad = ((params.curveAngle || 35) * Math.PI) / 180;

  // Grid resolution (140 to 180 points for high detail)
  const cols = 150;
  const aspect = (img.height || 1) / (img.width || 1);
  const rows = Math.round(cols * Math.max(0.5, Math.min(2.0, aspect)));

  const canvas = document.createElement('canvas');
  canvas.width = cols + 1;
  canvas.height = rows + 1;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return new THREE.PlaneGeometry(widthMm, heightMm);

  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  const rawData = ctx.getImageData(0, 0, canvas.width, canvas.height).data;

  // Compute normalized heightmap with brightness, contrast, gamma, and smoothing
  const heightMap: number[][] = [];
  const gamma = params.imageGamma || 1.0;
  const contrast = params.imageContrast || 1.1;
  const brightness = (params.imageBrightness || 0) / 100;

  for (let y = 0; y <= rows; y++) {
    heightMap[y] = [];
    for (let x = 0; x <= cols; x++) {
      const idx = (y * canvas.width + x) * 4;
      const r = rawData[idx];
      const g = rawData[idx + 1];
      const b = rawData[idx + 2];
      let lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255.0;

      // Apply contrast & brightness
      lum = (lum - 0.5) * contrast + 0.5 + brightness;
      lum = Math.max(0, Math.min(1, lum));

      // Apply gamma
      if (gamma !== 1.0) {
        lum = Math.pow(lum, 1 / gamma);
      }

      // Lithophane principle: bright pixels = thinner (more light), dark = thicker
      const val = params.inverted ? lum : (1.0 - lum);
      heightMap[y][x] = val;
    }
  }

  // Smooth filter if requested
  const smoothPasses = Math.max(0, Math.min(3, params.smoothing || 0));
  for (let pass = 0; pass < smoothPasses; pass++) {
    const smoothed: number[][] = [];
    for (let y = 0; y <= rows; y++) {
      smoothed[y] = [];
      for (let x = 0; x <= cols; x++) {
        let sum = heightMap[y][x] * 4;
        let count = 4;
        if (x > 0) { sum += heightMap[y][x - 1]; count++; }
        if (x < cols) { sum += heightMap[y][x + 1]; count++; }
        if (y > 0) { sum += heightMap[y - 1][x]; count++; }
        if (y < rows) { sum += heightMap[y + 1][x]; count++; }
        smoothed[y][x] = sum / count;
      }
    }
    for (let y = 0; y <= rows; y++) {
      for (let x = 0; x <= cols; x++) {
        heightMap[y][x] = smoothed[y][x];
      }
    }
  }

  const positions: number[] = [];

  // Helper coordinate mapper for various shapes (Flat, Curved, Cylinder, Heart)
  const mapPoint = (u: number, v: number, thickness: number): [number, number, number] => {
    const lx = (u - 0.5) * widthMm;
    const ly = (0.5 - v) * heightMm;

    if (shape === 'cylinder') {
      // 360° cylindrical night light
      const radius = widthMm / (Math.PI * 2);
      const angle = u * Math.PI * 2;
      const r = radius + thickness;
      return [Math.sin(angle) * r, ly, Math.cos(angle) * r];
    } else if (shape === 'curved' && curveAngleRad > 0.05) {
      // Gentle self-standing curved arc
      const radius = widthMm / curveAngleRad;
      const angle = (u - 0.5) * curveAngleRad;
      const r = radius + thickness;
      return [Math.sin(angle) * r, ly, Math.cos(angle) * r - radius];
    } else if (shape === 'heart') {
      // Heart contour boundary clipping
      const hx = (u - 0.5) * 2;
      const hy = (0.5 - v) * 2;
      const heartEquation = Math.pow(hx * hx + hy * hy - 1, 3) - hx * hx * hy * hy * hy;
      const t = heartEquation <= 0.1 ? thickness : minT * 0.5;
      return [lx, ly, t];
    }

    // Flat
    return [lx, ly, thickness];
  };

  // Helper for border mask: Is this vertex near the frame border?
  const getThicknessAt = (x: number, y: number): number => {
    const u = x / cols;
    const v = y / rows;

    const uDist = Math.min(u, 1 - u) * widthMm;
    const vDist = Math.min(v, 1 - v) * heightMm;

    if (borderMm > 0.5 && (uDist < borderMm || vDist < borderMm)) {
      return borderT; // Solid frame rim
    }

    const lumVal = heightMap[y][x];
    return minT + lumVal * (maxT - minT);
  };

  // Build Front and Back Grid Mesh (Triangulation)
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const u0 = x / cols;
      const u1 = (x + 1) / cols;
      const v0 = y / rows;
      const v1 = (y + 1) / rows;

      const t00 = getThicknessAt(x, y);
      const t10 = getThicknessAt(x + 1, y);
      const t11 = getThicknessAt(x + 1, y + 1);
      const t01 = getThicknessAt(x, y + 1);

      // Front Embossed Surface Points
      const f00 = mapPoint(u0, v0, t00);
      const f10 = mapPoint(u1, v0, t10);
      const f11 = mapPoint(u1, v1, t11);
      const f01 = mapPoint(u0, v1, t01);

      // Back Flat / Smooth Surface Points (at z=0)
      const b00 = mapPoint(u0, v0, 0);
      const b10 = mapPoint(u1, v0, 0);
      const b11 = mapPoint(u1, v1, 0);
      const b01 = mapPoint(u0, v1, 0);

      // Front Face (2 Triangles)
      positions.push(...f00, ...f10, ...f11);
      positions.push(...f00, ...f11, ...f01);

      // Back Face (2 Triangles, reversed winding)
      positions.push(...b10, ...b00, ...b11);
      positions.push(...b00, ...b01, ...b11);

      // Perimeter Edge Walls
      if (y === 0) {
        // Top edge
        positions.push(...f00, ...b00, ...f10);
        positions.push(...b00, ...b10, ...f10);
      }
      if (y === rows - 1) {
        // Bottom edge
        positions.push(...f01, ...f11, ...b01);
        positions.push(...b01, ...f11, ...b11);
      }
      if (x === 0 && shape !== 'cylinder') {
        // Left edge
        positions.push(...f00, ...f01, ...b00);
        positions.push(...b00, ...f01, ...b01);
      }
      if (x === cols - 1 && shape !== 'cylinder') {
        // Right edge
        positions.push(...f10, ...b10, ...f11);
        positions.push(...b10, ...b11, ...f11);
      }
    }
  }

  const lithoGeo = new THREE.BufferGeometry();
  lithoGeo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  lithoGeo.computeVertexNormals();

  const geometries: THREE.BufferGeometry[] = [lithoGeo];

  // Add Stable Stand / Easel Kickstand if requested
  if (params.standIncluded && shape !== 'cylinder') {
    const standWidth = widthMm * 0.85;
    const standDepth = 28;
    const standH = 6.0;

    const standShape = new THREE.Shape();
    standShape.moveTo(-standDepth / 2, 0);
    standShape.lineTo(standDepth / 2, 0);
    standShape.lineTo(standDepth / 2 - 3, standH);
    standShape.lineTo(-standDepth / 2 + 5, standH);
    standShape.closePath();

    const standGeo = new THREE.ExtrudeGeometry(standShape, {
      depth: standWidth,
      bevelEnabled: true,
      bevelSegments: 2,
      bevelSize: 0.8,
      bevelThickness: 0.8,
    });
    standGeo.rotateY(Math.PI / 2);
    standGeo.translate(-standWidth / 2, -heightMm / 2 - standH * 0.5, 4);
    geometries.push(standGeo);
  }

  // Add Hang Hole if requested (e.g. wall or night-light hook)
  if (params.hangHole && shape !== 'cylinder') {
    const loopGeo = new THREE.TorusGeometry(3.5, 1.2, 12, 24);
    loopGeo.translate(0, heightMm / 2 + 2.5, 0);
    geometries.push(loopGeo);
  }

  return mergeLithoGeometries(geometries);
}

function mergeLithoGeometries(geos: THREE.BufferGeometry[]): THREE.BufferGeometry {
  let count = 0;
  for (const g of geos) {
    const nonIndexed = g.index ? g.toNonIndexed() : g;
    count += nonIndexed.getAttribute('position').count;
  }
  const posArr = new Float32Array(count * 3);
  let offset = 0;
  for (const g of geos) {
    const nonIndexed = g.index ? g.toNonIndexed() : g;
    const p = nonIndexed.getAttribute('position');
    for (let i = 0; i < p.count; i++) {
      posArr[(offset + i) * 3] = p.getX(i);
      posArr[(offset + i) * 3 + 1] = p.getY(i);
      posArr[(offset + i) * 3 + 2] = p.getZ(i);
    }
    offset += p.count;
  }
  const merged = new THREE.BufferGeometry();
  merged.setAttribute('position', new THREE.BufferAttribute(posArr, 3));
  merged.computeVertexNormals();
  return merged;
}

function createProceduralLithoPattern(): string {
  const c = document.createElement('canvas');
  c.width = 160;
  c.height = 160;
  const ctx = c.getContext('2d');
  if (ctx) {
    const grad = ctx.createRadialGradient(80, 80, 10, 80, 80, 75);
    grad.addColorStop(0, '#ffffff');
    grad.addColorStop(0.3, '#d4d4d4');
    grad.addColorStop(0.7, '#666666');
    grad.addColorStop(1, '#111111');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 160, 160);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 38px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('3D LITH', 80, 80);
  }
  return c.toDataURL();
}
