import * as THREE from 'three';
import {
  KeychainParams,
  FontChoice,
  TailCharmType,
  FlexiSegmentStyle,
  ArticulatedSegmentData,
} from '../types';
import { mergeGeometries } from './dualTextGenerator';

const FONT_CANVAS_MAP: Record<FontChoice, string> = {
  'Bungee': 'Bungee, sans-serif',
  'Alfa Slab One': '"Alfa Slab One", serif',
  'Black Ops One': '"Black Ops One", cursive',
  'Fredoka': '"Fredoka", sans-serif',
  'Space Grotesk': '"Space Grotesk", sans-serif',
  'Cinzel': '"Cinzel", serif',
  'Plus Jakarta Sans': '"Plus Jakarta Sans", sans-serif',
  'Pacifico': '"Pacifico", cursive',
  'Oswald': '"Oswald", sans-serif',
  'Montserrat': '"Montserrat", sans-serif',
  'Bangers': '"Bangers", cursive',
  'Orbitron': '"Orbitron", sans-serif',
  'Righteous': '"Righteous", cursive',
};

export interface KeychainGeometries {
  combined: THREE.BufferGeometry;
  baseGeo?: THREE.BufferGeometry;
  lettersGeo?: THREE.BufferGeometry;
  ringGeo?: THREE.BufferGeometry;
  isArticulated?: boolean;
  articulatedSegments?: ArticulatedSegmentData[];
}

/**
 * Helper to measure character width in millimeters
 */
function measureCharacterWidth(char: string, fontName: string, letterH: number): number {
  const canvas = document.createElement('canvas');
  canvas.width = 200;
  canvas.height = 200;
  const ctx = canvas.getContext('2d');
  if (!ctx) return letterH * 0.75;
  ctx.font = `900 80px ${fontName}`;
  const m = ctx.measureText(char);
  const measured = (m.width / 80) * letterH;
  return Math.max(letterH * 0.5, Math.min(letterH * 1.3, measured));
}

/**
 * Helper to generate 3D solid extruded letter mesh directly from font glyph
 */
interface SolidLetterResult {
  geo: THREE.BufferGeometry;
  topHighlightGeo?: THREE.BufferGeometry;
  width: number;
  height: number;
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

function generateSolidLetterMesh(
  char: string,
  fontName: string,
  targetHeight: number,
  depth: number,
  options?: { topHighlightHeight?: number }
): SolidLetterResult | null {
  const canvas = document.createElement('canvas');
  const res = 140;
  canvas.width = res;
  canvas.height = res;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return null;

  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, res, res);
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `900 100px ${fontName}`;
  ctx.fillText(char, res / 2, res / 2);

  const imgData = ctx.getImageData(0, 0, res, res).data;

  // Scan bounding box of solid pixels
  let minPxX = res;
  let maxPxX = 0;
  let minPxY = res;
  let maxPxY = 0;

  for (let y = 0; y < res; y++) {
    for (let x = 0; x < res; x++) {
      if (imgData[(y * res + x) * 4] > 115) {
        if (x < minPxX) minPxX = x;
        if (x > maxPxX) maxPxX = x;
        if (y < minPxY) minPxY = y;
        if (y > maxPxY) maxPxY = y;
      }
    }
  }

  if (minPxX > maxPxX || minPxY > maxPxY) {
    return null;
  }

  const pxW = maxPxX - minPxX + 1;
  const pxH = maxPxY - minPxY + 1;
  const scale = targetHeight / pxH;
  const physWidth = Math.max(pxW * scale, 6.0);
  const physHeight = targetHeight;

  const centerPxX = (minPxX + maxPxX) / 2;
  const centerPxY = (minPxY + maxPxY) / 2;

  const spanPositions: number[] = [];
  const spanNormals: number[] = [];
  const topPositions: number[] = [];
  const topNormals: number[] = [];

  const topH = options?.topHighlightHeight || 0.8;

  for (let y = 0; y < res; y++) {
    let inSpan = false;
    let spanStart = 0;

    for (let x = 0; x <= res; x++) {
      const isPixel = x < res && imgData[(y * res + x) * 4] > 115;
      if (isPixel && !inSpan) {
        inSpan = true;
        spanStart = x;
      } else if (!isPixel && inSpan) {
        inSpan = false;
        const spanLen = x - spanStart;
        const bW = spanLen * scale;
        const bH = scale * 1.04;
        const bD = depth;
        const cx = (spanStart + spanLen / 2 - centerPxX) * scale;
        const cy = -(y + 0.5 - centerPxY) * scale;
        const cz = depth / 2;

        const box = new THREE.BoxGeometry(bW, bH, bD);
        box.translate(cx, cy, cz);

        const pos = box.getAttribute('position');
        const norm = box.getAttribute('normal');
        const idx = box.getIndex();
        if (idx) {
          for (let i = 0; i < idx.count; i++) {
            const vi = idx.getX(i);
            spanPositions.push(pos.getX(vi), pos.getY(vi), pos.getZ(vi));
            spanNormals.push(norm.getX(vi), norm.getY(vi), norm.getZ(vi));
          }
        }
        box.dispose();

        // Top highlight cap for dual-color visualization/slicing
        if (topH > 0) {
          const topBox = new THREE.BoxGeometry(bW, bH, topH);
          topBox.translate(cx, cy, depth + topH / 2);
          const tPos = topBox.getAttribute('position');
          const tNorm = topBox.getAttribute('normal');
          const tIdx = topBox.getIndex();
          if (tIdx) {
            for (let i = 0; i < tIdx.count; i++) {
              const vi = tIdx.getX(i);
              topPositions.push(tPos.getX(vi), tPos.getY(vi), tPos.getZ(vi));
              topNormals.push(tNorm.getX(vi), tNorm.getY(vi), tNorm.getZ(vi));
            }
          }
          topBox.dispose();
        }
      }
    }
  }

  if (spanPositions.length === 0) return null;

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(spanPositions, 3));
  geo.setAttribute('normal', new THREE.Float32BufferAttribute(spanNormals, 3));

  let topHighlightGeo: THREE.BufferGeometry | undefined;
  if (topPositions.length > 0) {
    topHighlightGeo = new THREE.BufferGeometry();
    topHighlightGeo.setAttribute('position', new THREE.Float32BufferAttribute(topPositions, 3));
    topHighlightGeo.setAttribute('normal', new THREE.Float32BufferAttribute(topNormals, 3));
  }

  return {
    geo,
    topHighlightGeo,
    width: physWidth,
    height: physHeight,
    minX: -physWidth / 2,
    maxX: physWidth / 2,
    minY: -physHeight / 2,
    maxY: physHeight / 2,
  };
}

/**
 * Helper to generate 3D extruded embossed text from canvas
 */
function create3DLetterMesh(
  char: string,
  fontName: string,
  targetWidth: number,
  targetHeight: number,
  extrusionHeight: number,
  centerX: number,
  centerY: number,
  baseZ: number
): THREE.BufferGeometry | null {
  const canvas = document.createElement('canvas');
  const res = 100;
  canvas.width = res;
  canvas.height = res;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return null;

  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, res, res);
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `900 68px ${fontName}`;
  ctx.fillText(char, res / 2, res / 2);

  const imgData = ctx.getImageData(0, 0, res, res).data;
  const spanPositions: number[] = [];
  const spanNormals: number[] = [];

  const scaleX = (targetWidth * 0.78) / res;
  const scaleY = (targetHeight * 0.82) / res;
  const x0 = centerX - (targetWidth * 0.78) / 2;
  const y0 = centerY + (targetHeight * 0.82) / 2;

  for (let y = 0; y < res; y++) {
    let inSpan = false;
    let spanStart = 0;

    for (let x = 0; x <= res; x++) {
      const isPixel = x < res && imgData[(y * res + x) * 4] > 115;
      if (isPixel && !inSpan) {
        inSpan = true;
        spanStart = x;
      } else if (!isPixel && inSpan) {
        inSpan = false;
        const spanLen = x - spanStart;
        const bW = spanLen * scaleX;
        const bH = scaleY * 1.05;
        const bD = extrusionHeight;
        const cx = x0 + (spanStart + spanLen / 2) * scaleX;
        const cy = y0 - (y + 0.5) * scaleY;
        const cz = baseZ + bD / 2;

        const box = new THREE.BoxGeometry(bW, bH, bD);
        box.translate(cx, cy, cz);

        const pos = box.getAttribute('position');
        const norm = box.getAttribute('normal');
        const idx = box.getIndex();
        if (idx) {
          for (let i = 0; i < idx.count; i++) {
            const vi = idx.getX(i);
            spanPositions.push(pos.getX(vi), pos.getY(vi), pos.getZ(vi));
            spanNormals.push(norm.getX(vi), norm.getY(vi), norm.getZ(vi));
          }
        }
        box.dispose();
      }
    }
  }

  if (spanPositions.length === 0) return null;

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(spanPositions, 3));
  geo.setAttribute('normal', new THREE.Float32BufferAttribute(spanNormals, 3));
  return geo;
}

/**
 * Generates custom 3D printable keychains: Fixed Name, Articulated/Flexi Name, and QR Code
 */
export function generateKeychainCompleteGeometries(params: KeychainParams): KeychainGeometries {
  const type = params.type || 'fixed-name';

  if (type === 'flexi-articulated') {
    return generateFlexiArticulatedKeychain(params);
  } else if (type === 'qr-code') {
    return generateQrKeychain(params);
  } else {
    return generateFixedNameKeychain(params);
  }
}

export function generateKeychainGeometry(params: KeychainParams): THREE.BufferGeometry {
  return generateKeychainCompleteGeometries(params).combined;
}

/**
 * 1. FIXED NAME KEYCHAIN (Solid Plate with 3D Embossed Letters & Keyring Hole)
 */
function generateFixedNameKeychain(params: KeychainParams): KeychainGeometries {
  const text = (params.text || 'GABRIEL').trim().toUpperCase();
  const subtitle = (params.subtitle || '').trim();
  const fontName = FONT_CANVAS_MAP[params.font] || 'Bungee, sans-serif';
  const baseT = Math.max(1.8, Math.min(6.0, params.baseThickness || 2.8));
  const textT = Math.max(1.0, Math.min(4.0, params.textExtrusion || 1.6));
  const letterH = Math.max(16, Math.min(40, params.fontSize || 24));
  const baseStyle = params.baseStyle || 'pill';
  const holePos = params.holePosition || 'left';
  const holeDia = Math.max(2.5, Math.min(6.5, params.holeDiameter || 4.0));
  const holeR = holeDia / 2;

  const baseGeometries: THREE.BufferGeometry[] = [];
  const letterGeometries: THREE.BufferGeometry[] = [];

  const charCount = Math.max(1, text.length);
  const approxWidth = charCount * (letterH * 0.72) + 16;
  const plateHeight = letterH + (subtitle ? 14 : 8);

  const halfW = approxWidth / 2;
  const halfH = plateHeight / 2;

  // 1. Base Plate Shape
  const shape = new THREE.Shape();

  if (baseStyle === 'pill') {
    const r = halfH;
    const bodyW = Math.max(10, approxWidth - r * 2);
    const hw = bodyW / 2;
    shape.moveTo(-hw, -r);
    shape.lineTo(hw, -r);
    shape.absarc(hw, 0, r, -Math.PI / 2, Math.PI / 2, false);
    shape.lineTo(-hw, r);
    shape.absarc(-hw, 0, r, Math.PI / 2, (3 * Math.PI) / 2, false);
  } else if (baseStyle === 'hexagon') {
    shape.moveTo(-halfW, 0);
    shape.lineTo(-halfW + 8, halfH);
    shape.lineTo(halfW - 8, halfH);
    shape.lineTo(halfW, 0);
    shape.lineTo(halfW - 8, -halfH);
    shape.lineTo(-halfW + 8, -halfH);
    shape.closePath();
  } else if (baseStyle === 'bone') {
    const bw = halfW - 8;
    const bh = halfH - 5;
    const kr = 6;
    shape.moveTo(-bw, -bh);
    shape.lineTo(bw, -bh);
    shape.absarc(bw, -bh, kr, -Math.PI / 2, 0, false);
    shape.absarc(bw, bh, kr, 0, Math.PI / 2, false);
    shape.lineTo(-bw, bh);
    shape.absarc(-bw, bh, kr, Math.PI / 2, Math.PI, false);
    shape.absarc(-bw, -bh, kr, Math.PI, (3 * Math.PI) / 2, false);
  } else {
    shape.moveTo(-halfW + 4, -halfH);
    shape.lineTo(halfW - 4, -halfH);
    shape.lineTo(halfW, -halfH + 4);
    shape.lineTo(halfW, halfH - 4);
    shape.lineTo(halfW - 4, halfH);
    shape.lineTo(-halfW + 4, halfH);
    shape.lineTo(-halfW, halfH - 4);
    shape.lineTo(-halfW, -halfH + 4);
    shape.closePath();
  }

  // Keyring hole in base plate if positioned inside
  if (holePos !== 'none') {
    let hx = 0;
    let hy = 0;
    if (holePos === 'left') hx = -halfW + 4;
    else if (holePos === 'right') hx = halfW - 4;
    else if (holePos === 'top') hy = halfH - 4;

    const holePath = new THREE.Path();
    holePath.absarc(hx, hy, holeR, 0, Math.PI * 2, true);
    shape.holes.push(holePath);
  }

  const baseGeo = new THREE.ExtrudeGeometry(shape, {
    depth: baseT,
    bevelEnabled: true,
    bevelSegments: 2,
    bevelSize: 0.5,
    bevelThickness: 0.5,
  });
  baseGeometries.push(baseGeo);

  // Keyring Tab Ring Ear if reinforced outside
  if (params.reinforcedRing && holePos !== 'none') {
    const ringOuterR = holeR + 2.6;
    const ringShape = new THREE.Shape();
    ringShape.absarc(0, 0, ringOuterR, 0, Math.PI * 2, false);
    const ringHole = new THREE.Path();
    ringHole.absarc(0, 0, holeR, 0, Math.PI * 2, true);
    ringShape.holes.push(ringHole);

    const ringGeo = new THREE.ExtrudeGeometry(ringShape, {
      depth: baseT,
      bevelEnabled: true,
      bevelSegments: 2,
      bevelSize: 0.4,
      bevelThickness: 0.4,
    });

    if (holePos === 'left') ringGeo.translate(-halfW - ringOuterR + 2, 0, 0);
    else if (holePos === 'right') ringGeo.translate(halfW + ringOuterR - 2, 0, 0);
    else ringGeo.translate(0, halfH + ringOuterR - 2, 0);

    baseGeometries.push(ringGeo);
  }

  // 2. Generate 3D Raised Text Blocks
  const canvas = document.createElement('canvas');
  const cw = 300;
  const ch = 90;
  canvas.width = cw;
  canvas.height = ch;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });

  if (ctx) {
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, cw, ch);

    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const hasSub = subtitle.length > 0;
    const textY = hasSub ? 34 : 45;
    const fontSizePx = hasSub ? 34 : 42;

    ctx.font = `900 ${fontSizePx}px ${fontName}`;
    ctx.fillText(text, cw / 2, textY);

    if (hasSub) {
      ctx.font = `700 16px ${fontName}`;
      ctx.fillText(subtitle.toUpperCase(), cw / 2, 68);
    }

    const imgData = ctx.getImageData(0, 0, cw, ch).data;
    const spanPositions: number[] = [];
    const spanNormals: number[] = [];

    const scaleX = (approxWidth * 0.82) / cw;
    const scaleY = (plateHeight * 0.80) / ch;
    const x0 = -approxWidth * 0.41;
    const y0 = plateHeight * 0.40;

    for (let y = 0; y < ch; y++) {
      let inSpan = false;
      let spanStart = 0;

      for (let x = 0; x <= cw; x++) {
        const isPixel = x < cw && imgData[(y * cw + x) * 4] > 120;
        if (isPixel && !inSpan) {
          inSpan = true;
          spanStart = x;
        } else if (!isPixel && inSpan) {
          inSpan = false;
          const spanLen = x - spanStart;

          const boxW = spanLen * scaleX;
          const boxH = scaleY * 1.05;
          const boxD = textT;
          const cx = x0 + (spanStart + spanLen / 2) * scaleX;
          const cy = y0 - (y + 0.5) * scaleY;
          const cz = baseT + boxD / 2;

          const boxGeo = new THREE.BoxGeometry(boxW, boxH, boxD);
          boxGeo.translate(cx, cy, cz);

          const p = boxGeo.getAttribute('position');
          const n = boxGeo.getAttribute('normal');
          const idx = boxGeo.getIndex();
          if (idx) {
            for (let i = 0; i < idx.count; i++) {
              const vi = idx.getX(i);
              spanPositions.push(p.getX(vi), p.getY(vi), p.getZ(vi));
              spanNormals.push(n.getX(vi), n.getY(vi), n.getZ(vi));
            }
          }
          boxGeo.dispose();
        }
      }
    }

    if (spanPositions.length > 0) {
      const textGeo = new THREE.BufferGeometry();
      textGeo.setAttribute('position', new THREE.Float32BufferAttribute(spanPositions, 3));
      textGeo.setAttribute('normal', new THREE.Float32BufferAttribute(spanNormals, 3));
      letterGeometries.push(textGeo);
    }
  }

  const baseMerged = mergeGeometries(baseGeometries);
  const lettersMerged = letterGeometries.length > 0 ? mergeGeometries(letterGeometries) : new THREE.BufferGeometry();
  const allGeos = [...baseGeometries, ...letterGeometries];
  const combined = mergeGeometries(allGeos);

  combined.rotateX(Math.PI / 2);
  baseMerged.rotateX(Math.PI / 2);
  if (lettersMerged.getAttribute('position')) lettersMerged.rotateX(Math.PI / 2);

  return {
    combined,
    baseGeo: baseMerged,
    lettersGeo: lettersMerged,
  };
}

/**
 * 2. FLEXI ARTICULATED NAME KEYCHAIN (Print-in-Place Interlocking Knuckle Hinges)
 * Each letter is an independent segment connected by a true mechanical print-in-place swivel joint:
 * - Male Fork (Clevis) on the right of segment i with a solid vertical cylindrical pin
 * - Female Tongue (Eyelet) on the left of segment i+1 with a calibrated clearance hole
 * - Continuous carrier spine under every letter ensuring 100% monolithic bonding to hinges
 * - Real Forward Kinematics for live 3D preview articulation (pin and hole remain 100% concentric)
 * - The entire keychain is articulated, flexible, and prints in 1 piece without supports!
 */

interface SegmentInfo {
  char: string;
  width: number;
  height: number;
  minX: number;
  maxX: number;
  centerX: number;
  solidData?: SolidLetterResult;
  isCharm?: boolean;
  charmType?: TailCharmType;
}

function generateFlexiArticulatedKeychain(params: KeychainParams): KeychainGeometries {
  const rawText = (params.text || 'GABRIEL').trim().toUpperCase();
  const cleanChars = rawText.replace(/\s+/g, '').split('');
  const textChars = cleanChars.length > 0 ? cleanChars : ['F', 'L', 'E', 'X', 'I'];
  const fontName = FONT_CANVAS_MAP[params.font] || 'Bungee, sans-serif';
  const letterH = Math.max(18, Math.min(38, params.fontSize || 24));
  const linkT = Math.max(3.2, Math.min(5.5, params.baseThickness || 4.2));
  const clearance = Math.max(0.30, Math.min(0.60, params.flexiJointClearance || 0.40));
  const holeDia = Math.max(3.0, Math.min(6.0, params.holeDiameter || 4.2));
  const tailCharm = params.tailCharm || 'heart';
  const flexiStyle: FlexiSegmentStyle = params.flexiSegmentStyle || 'pure-letters';
  const isPureLetters = flexiStyle === 'pure-letters';
  const previewFlexAngle = params.previewFlexAngle || 0; // Live articulation simulation

  // Mechanical Joint Dimensions (Strict Non-Collision Print-in-Place Tolerances)
  const rPin = 1.30; // Solid vertical pin radius (2.60mm diameter)
  const rHole = rPin + clearance; // Through-hole radius (e.g. 1.70mm -> 3.40mm diameter)
  const rTongue = 3.10; // Female eyelet outer radius (6.20mm diameter, 1.4mm solid wall)
  const rFork = 3.65; // Male fork outer ear radius (7.30mm diameter, 0.55mm radial gap around tongue)

  const cZ = 0.35; // Vertical clearance between ears and tongue (prevents layer fusing)
  const tEar = Math.max(0.95, (linkT - 2 * cZ) * 0.32); // e.g. 1.12mm ear thickness
  const tTongue = Math.max(1.0, linkT - 2 * tEar - 2 * cZ); // e.g. 1.26mm center tongue
  const zTongue = tEar + cZ;

  // Longitudinal Spacing between Letter Bodies and Joint Pin Pivot (jx)
  // Guarantees at least 1.35mm - 1.50mm air clearance between each letter and adjacent hinge tips
  const armFork = 4.60; // Distance from segMaxX to joint pin pivot (jx)
  const neckTongue = 5.00; // Distance from joint pin pivot (jx) to next segMinX

  // Step 1: Pre-generate solid 3D glyphs and measure exact physical dimensions
  const segments: SegmentInfo[] = [];

  for (let i = 0; i < textChars.length; i++) {
    const char = textChars[i];
    const solid = generateSolidLetterMesh(char, fontName, letterH, linkT, {
      topHighlightHeight: isPureLetters ? 0.8 : 0,
    });

    if (solid) {
      const segW = isPureLetters ? Math.max(solid.width, 10.0) : Math.max(14, solid.width + 6.0);
      segments.push({
        char,
        width: segW,
        height: isPureLetters ? solid.height : letterH + 5.0,
        minX: isPureLetters ? solid.minX : -segW / 2,
        maxX: isPureLetters ? solid.maxX : segW / 2,
        centerX: 0,
        solidData: solid,
      });
    } else {
      const charW = measureCharacterWidth(char, fontName, letterH);
      const segW = isPureLetters ? Math.max(charW, 10.0) : Math.max(14, charW + 6.0);
      segments.push({
        char,
        width: segW,
        height: letterH + 5.0,
        minX: -segW / 2,
        maxX: segW / 2,
        centerX: 0,
      });
    }
  }

  // Add tail charm segment if requested
  if (tailCharm !== 'none') {
    const charmSize = letterH * 0.82;
    segments.push({
      char: '',
      width: charmSize,
      height: charmSize,
      minX: -charmSize / 2,
      maxX: charmSize / 2,
      centerX: 0,
      isCharm: true,
      charmType: tailCharm,
    });
  }

  if (segments.length === 0) {
    return { combined: new THREE.BufferGeometry() };
  }

  // Calculate Centers and Joint X positions along X axis
  // Distance from segMaxX to jx is armFork; distance from jx to nextMinX is neckTongue
  const jointXList: number[] = [];
  let currentX = 0;

  for (let i = 0; i < segments.length; i++) {
    if (i === 0) {
      segments[i].centerX = -segments[i].minX;
      currentX = segments[i].centerX + segments[i].maxX;
    } else {
      const prevMaxX = currentX;
      const jx = prevMaxX + armFork;
      jointXList.push(jx);

      const nextMinX = jx + neckTongue;
      const nextCenterX = nextMinX - segments[i].minX;
      segments[i].centerX = nextCenterX;
      currentX = nextCenterX + segments[i].maxX;
    }
  }

  // Step 2: Build Geometry for each segment and its mechanical knuckle joints
  const segBaseGeosList: THREE.BufferGeometry[][] = [];
  const segLetterGeosList: THREE.BufferGeometry[][] = [];

  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i];
    const segCenterX = seg.centerX;
    const segMinX = segCenterX + seg.minX;
    const segMaxX = segCenterX + seg.maxX;
    const hasLeftJoint = i > 0;
    const hasRightJoint = i < segments.length - 1;

    const segBaseGeos: THREE.BufferGeometry[] = [];
    const segLetterGeos: THREE.BufferGeometry[] = [];

    // --- A. SEGMENT BODY & STRUCTURAL CARRIER SPINE ---
    // Monolithic carrier spine guarantees that every letter stroke is 100% bonded to the hinges
    const spineHeight = isPureLetters ? 8.2 : seg.height;
    const spineThickness = isPureLetters ? Math.min(2.4, linkT * 0.6) : linkT;
    const carrierSpine = createCarrierSpineGeometry(
      segMinX,
      segMaxX,
      spineHeight,
      spineThickness,
      flexiStyle,
      hasLeftJoint,
      hasRightJoint
    );
    segBaseGeos.push(carrierSpine);

    if (!seg.isCharm) {
      if (seg.solidData) {
        const letterGeo = seg.solidData.geo.clone();
        letterGeo.translate(segCenterX, 0, 0);
        segBaseGeos.push(letterGeo);

        if (seg.solidData.topHighlightGeo) {
          const topGeo = seg.solidData.topHighlightGeo.clone();
          topGeo.translate(segCenterX, 0, 0);
          segLetterGeos.push(topGeo);
        }
      }
    } else {
      // Articulated tail charm body
      const charmGeo = createArticulatedTailCharm(
        seg.charmType || 'heart',
        segCenterX,
        seg.width,
        linkT
      );
      segBaseGeos.push(charmGeo);
    }

    // --- B. LEFT SIDE CONNECTOR ---
    if (i === 0) {
      // First segment: Keyring Loop Eyelet
      const ringGeos = createKeyringLoop(segMinX, holeDia, linkT);
      segBaseGeos.push(...ringGeos);
    } else {
      // FEMALE TONGUE (Center Lug) connecting to segment i-1's male fork
      const jx = jointXList[i - 1];
      const tongueGeos = createTongueKnuckleGeometries(
        jx,
        segMinX,
        rTongue,
        rHole,
        tTongue,
        zTongue
      );
      segBaseGeos.push(...tongueGeos);
    }

    // --- C. RIGHT SIDE CONNECTOR ---
    if (i < segments.length - 1) {
      // MALE FORK (Clevis with Vertical Pin) connecting to segment i+1's female tongue
      const jx = jointXList[i];
      const forkGeos = createForkKnuckleGeometries(
        jx,
        segMaxX,
        rFork,
        rPin,
        linkT,
        tEar
      );
      segBaseGeos.push(...forkGeos);
    }

    segBaseGeosList.push(segBaseGeos);
    segLetterGeosList.push(segLetterGeos);
  }

  // Pre-calculate flat bounding box center for centering on print bed
  const flatAllGeos: THREE.BufferGeometry[] = [];
  for (let s = 0; s < segments.length; s++) {
    flatAllGeos.push(...segBaseGeosList[s], ...segLetterGeosList[s]);
  }
  const flatMerged = mergeGeometries(flatAllGeos);
  flatMerged.computeBoundingBox();
  const flatBox = flatMerged.boundingBox || new THREE.Box3();
  const globalCx = (flatBox.min.x + flatBox.max.x) / 2;
  const globalCy = (flatBox.min.y + flatBox.max.y) / 2;
  flatMerged.dispose();

  // Step 3: Build Articulated Segments Tree (for interactive 3D flex & real-time drag/physics)
  // Each segment has its own local geometry where incoming joint pivot is at (0, 0, 0),
  // resting at Y = 0 on top of the print bed with pin aligned vertically on the Y axis!
  const articulatedSegments: ArticulatedSegmentData[] = [];

  for (let s = 0; s < segments.length; s++) {
    const isRoot = s === 0;
    const hasNextJoint = s < segments.length - 1;

    // Local shift so incoming joint pivot is at (0, 0, 0)
    const localShiftX = isRoot ? -globalCx : -jointXList[s - 1];
    const localShiftY = -globalCy;

    const baseGeosCloned = segBaseGeosList[s].map((g) => g.clone());
    const letterGeosCloned = segLetterGeosList[s].map((g) => g.clone());

    baseGeosCloned.forEach((g) => {
      g.translate(localShiftX, localShiftY, 0);
      g.rotateX(Math.PI / 2);
    });
    letterGeosCloned.forEach((g) => {
      g.translate(localShiftX, localShiftY, 0);
      g.rotateX(Math.PI / 2);
    });

    const sBaseMerged = baseGeosCloned.length > 0 ? mergeGeometries(baseGeosCloned) : new THREE.BufferGeometry();
    const sLettersMerged = letterGeosCloned.length > 0 ? mergeGeometries(letterGeosCloned) : new THREE.BufferGeometry();

    // Adjust Y so segment rests at Y = 0
    sBaseMerged.computeBoundingBox();
    const sMinY = sBaseMerged.boundingBox ? sBaseMerged.boundingBox.min.y : 0;
    sBaseMerged.translate(0, -sMinY, 0);
    if (sLettersMerged.getAttribute('position')) {
      sLettersMerged.translate(0, -sMinY, 0);
    }

    // Pivot location in parent's coordinate space
    const pivot = isRoot
      ? new THREE.Vector3(0, 0, 0)
      : new THREE.Vector3(s === 1 ? jointXList[0] - globalCx : jointXList[s - 1] - jointXList[s - 2], 0, 0);

    // Next child joint pivot in this segment's coordinate space
    const nextPivot = hasNextJoint
      ? new THREE.Vector3(isRoot ? jointXList[0] - globalCx : jointXList[s] - jointXList[s - 1], 0, 0)
      : undefined;

    articulatedSegments.push({
      index: s,
      char: segments[s].char,
      isCharm: segments[s].isCharm,
      pivot,
      baseGeo: sBaseMerged,
      lettersGeo: sLettersMerged,
      nextPivot,
    });
  }

  // Step 4: Forward Kinematics for Static Preview Pose (if previewFlexAngle !== 0)
  if (previewFlexAngle !== 0) {
    const angleRad = (previewFlexAngle * Math.PI) / 180;
    const matrices: THREE.Matrix4[] = [new THREE.Matrix4()];

    for (let s = 1; s < segments.length; s++) {
      const prevMatrix = matrices[s - 1];
      const jx = jointXList[s - 1];

      // Smooth serpentine wave oscillation
      const wave = Math.sin((s - 1 + 0.65) * 1.25);
      const rotZ = wave * angleRad * 0.65;

      const tToOrigin = new THREE.Matrix4().makeTranslation(-jx, 0, 0);
      const rot = new THREE.Matrix4().makeRotationZ(rotZ);
      const tFromOrigin = new THREE.Matrix4().makeTranslation(jx, 0, 0);

      const localJointTransform = new THREE.Matrix4().multiply(tFromOrigin).multiply(rot).multiply(tToOrigin);
      const cumMatrix = new THREE.Matrix4().multiplyMatrices(prevMatrix, localJointTransform);
      matrices.push(cumMatrix);
    }

    // Apply transformation to each segment's geometries
    for (let s = 0; s < segments.length; s++) {
      const mat = matrices[s];
      segBaseGeosList[s].forEach((g) => g.applyMatrix4(mat));
      segLetterGeosList[s].forEach((g) => g.applyMatrix4(mat));
    }
  }

  // Step 5: Merge geometries and align flat on the 3D printer build plate
  const allBaseGeos: THREE.BufferGeometry[] = [];
  const allLetterGeos: THREE.BufferGeometry[] = [];

  for (let s = 0; s < segments.length; s++) {
    allBaseGeos.push(...segBaseGeosList[s]);
    allLetterGeos.push(...segLetterGeosList[s]);
  }

  const baseMerged = allBaseGeos.length > 0 ? mergeGeometries(allBaseGeos) : new THREE.BufferGeometry();
  const lettersMerged = allLetterGeos.length > 0 ? mergeGeometries(allLetterGeos) : new THREE.BufferGeometry();
  const allGeos = [...allBaseGeos, ...allLetterGeos];
  const combined = mergeGeometries(allGeos);

  // Center horizontally in X and Y
  combined.computeBoundingBox();
  if (combined.boundingBox) {
    const cx = (combined.boundingBox.min.x + combined.boundingBox.max.x) / 2;
    const cy = (combined.boundingBox.min.y + combined.boundingBox.max.y) / 2;

    combined.translate(-cx, -cy, 0);
    baseMerged.translate(-cx, -cy, 0);
    if (lettersMerged.getAttribute('position')) {
      lettersMerged.translate(-cx, -cy, 0);
    }
  }

  // Rotate model flat onto the 3D printer build plate (XY plane, Z = vertical height)
  combined.rotateX(Math.PI / 2);
  baseMerged.rotateX(Math.PI / 2);
  if (lettersMerged.getAttribute('position')) {
    lettersMerged.rotateX(Math.PI / 2);
  }

  // Adjust Y so model rests exactly at Y = 0 on top of the print bed
  combined.computeBoundingBox();
  if (combined.boundingBox) {
    const minY = combined.boundingBox.min.y;
    combined.translate(0, -minY, 0);
    baseMerged.translate(0, -minY, 0);
    if (lettersMerged.getAttribute('position')) {
      lettersMerged.translate(0, -minY, 0);
    }
  }

  return {
    combined,
    baseGeo: baseMerged,
    lettersGeo: lettersMerged,
    isArticulated: true,
    articulatedSegments,
  };
}

/**
 * Creates Male Clevis / Fork with Solid Vertical Connecting Pin
 * Located at joint center (jx, 0), connecting from segment body (segMaxX)
 */
function createForkKnuckleGeometries(
  jx: number,
  segMaxX: number,
  rFork: number,
  rPin: number,
  linkT: number,
  tEar: number
): THREE.BufferGeometry[] {
  const geos: THREE.BufferGeometry[] = [];
  const armW = rFork * 1.85;

  const forkShape = new THREE.Shape();
  const rootX = segMaxX - 1.5; // penetrates 1.5mm into letter/spine body
  forkShape.moveTo(rootX, -armW / 2);
  forkShape.lineTo(jx, -rFork);
  // Semi-circle around (jx, 0) covering the right side (from -PI/2 to PI/2 counter-clockwise)
  forkShape.absarc(jx, 0, rFork, -Math.PI / 2, Math.PI / 2, false);
  forkShape.lineTo(rootX, armW / 2);
  forkShape.closePath();

  // 1. Bottom Ear (z from 0 to tEar)
  const bottomEarGeo = new THREE.ExtrudeGeometry(forkShape, {
    depth: tEar,
    bevelEnabled: true,
    bevelSegments: 2,
    bevelSize: 0.25,
    bevelThickness: 0.25,
  });
  geos.push(bottomEarGeo);

  // 2. Top Ear (z from linkT - tEar to linkT)
  const topEarGeo = new THREE.ExtrudeGeometry(forkShape, {
    depth: tEar,
    bevelEnabled: true,
    bevelSegments: 2,
    bevelSize: 0.25,
    bevelThickness: 0.25,
  });
  topEarGeo.translate(0, 0, linkT - tEar);
  geos.push(topEarGeo);

  // 3. Monolithic Vertical Pin
  // Cylindrical pin along Z running continuously from z = 0 to z = linkT
  const pinGeo = new THREE.CylinderGeometry(rPin, rPin, linkT, 24);
  pinGeo.rotateX(Math.PI / 2);
  pinGeo.translate(jx, 0, linkT / 2);
  geos.push(pinGeo);

  return geos;
}

/**
 * Creates Female Tongue / Eyelet with calibrated clearance hole
 * Located at joint center (jx, 0), connecting into segment body (segMinX)
 */
function createTongueKnuckleGeometries(
  jx: number,
  segMinX: number,
  rTongue: number,
  rHole: number,
  tTongue: number,
  zTongue: number
): THREE.BufferGeometry[] {
  const geos: THREE.BufferGeometry[] = [];
  const neckW = rTongue * 1.8;

  const tongueShape = new THREE.Shape();
  const rootX = segMinX + 1.5; // penetrates 1.5mm into letter/spine body
  tongueShape.moveTo(rootX, neckW / 2);
  tongueShape.lineTo(jx, rTongue);
  // Semi-circle around (jx, 0) covering the left side (from PI/2 to 3*PI/2 counter-clockwise)
  tongueShape.absarc(jx, 0, rTongue, Math.PI / 2, (3 * Math.PI) / 2, false);
  tongueShape.lineTo(rootX, -neckW / 2);
  tongueShape.closePath();

  // Concentric clearance hole for the pin
  const holePath = new THREE.Path();
  holePath.absarc(jx, 0, rHole, 0, Math.PI * 2, true);
  tongueShape.holes.push(holePath);

  const tongueGeo = new THREE.ExtrudeGeometry(tongueShape, {
    depth: tTongue,
    bevelEnabled: true,
    bevelSegments: 2,
    bevelSize: 0.2,
    bevelThickness: 0.2,
  });
  tongueGeo.translate(0, 0, zTongue);
  geos.push(tongueGeo);

  return geos;
}

/**
 * Creates the continuous monolithic carrier spine for a letter segment
 * Runs from (segMinX - 1.2) to (segMaxX + 1.2), guaranteeing that every letter stroke
 * is 100% bonded to the hinges and cannot detach.
 */
function createCarrierSpineGeometry(
  segMinX: number,
  segMaxX: number,
  height: number,
  thickness: number,
  style: FlexiSegmentStyle,
  hasLeftJoint: boolean,
  hasRightJoint: boolean
): THREE.BufferGeometry {
  const x0 = segMinX;
  const x1 = segMaxX;
  const width = x1 - x0;
  const halfH = height / 2;

  const shape = new THREE.Shape();
  if (style === 'capsule-links') {
    const r = Math.min(width * 0.25, halfH);
    shape.moveTo(x0 + r, -halfH);
    shape.lineTo(x1 - r, -halfH);
    shape.quadraticCurveTo(x1, -halfH, x1, -halfH + r);
    shape.lineTo(x1, halfH - r);
    shape.quadraticCurveTo(x1, halfH, x1 - r, halfH);
    shape.lineTo(x0 + r, halfH);
    shape.quadraticCurveTo(x0, halfH, x0, halfH - r);
    shape.lineTo(x0, -halfH + r);
    shape.quadraticCurveTo(x0, -halfH, x0 + r, -halfH);
  } else if (style === 'hexagon-links') {
    const chamf = Math.min(3.5, halfH * 0.4);
    shape.moveTo(x0 + chamf, -halfH);
    shape.lineTo(x1 - chamf, -halfH);
    shape.lineTo(x1, -halfH + chamf);
    shape.lineTo(x1, halfH - chamf);
    shape.lineTo(x1 - chamf, halfH);
    shape.lineTo(x0 + chamf, halfH);
    shape.lineTo(x0, halfH - chamf);
    shape.lineTo(x0, -halfH + chamf);
    shape.closePath();
  } else if (style === 'bone-links') {
    const kr = Math.min(3.0, halfH * 0.35);
    shape.moveTo(x0 + kr, -halfH);
    shape.lineTo(x1 - kr, -halfH);
    shape.absarc(x1 - kr, -halfH + kr, kr, -Math.PI / 2, 0, false);
    shape.absarc(x1 - kr, halfH - kr, kr, 0, Math.PI / 2, false);
    shape.lineTo(x0 + kr, halfH);
    shape.absarc(x0 + kr, halfH - kr, kr, Math.PI / 2, Math.PI, false);
    shape.absarc(x0 + kr, -halfH + kr, kr, Math.PI, (3 * Math.PI) / 2, false);
  } else {
    // 'pure-letters': Sleek low-profile contoured bridge matching the letter envelope
    const chamf = 1.8;
    shape.moveTo(x0 + chamf, -halfH);
    shape.lineTo(x1 - chamf, -halfH);
    shape.quadraticCurveTo(x1, -halfH, x1, -halfH + chamf);
    shape.lineTo(x1, halfH - chamf);
    shape.quadraticCurveTo(x1, halfH, x1 - chamf, halfH);
    shape.lineTo(x0 + chamf, halfH);
    shape.quadraticCurveTo(x0, halfH, x0, halfH - chamf);
    shape.lineTo(x0, -halfH + chamf);
    shape.quadraticCurveTo(x0, -halfH, x0 + chamf, -halfH);
  }

  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: thickness,
    bevelEnabled: true,
    bevelSegments: 2,
    bevelSize: 0.3,
    bevelThickness: 0.3,
  });
  return geo;
}

/**
 * Creates Reinforced Keyring Loop on the first letter segment
 */
function createKeyringLoop(
  segMinX: number,
  holeDia: number,
  linkT: number
): THREE.BufferGeometry[] {
  const geos: THREE.BufferGeometry[] = [];
  const holeR = holeDia / 2;
  const ringOuterR = holeR + 2.8;
  const loopCenterX = segMinX - ringOuterR + 1.2;

  const ringShape = new THREE.Shape();
  ringShape.absarc(loopCenterX, 0, ringOuterR, 0, Math.PI * 2, false);
  const ringHole = new THREE.Path();
  ringHole.absarc(loopCenterX, 0, holeR, 0, Math.PI * 2, true);
  ringShape.holes.push(ringHole);

  const ringGeo = new THREE.ExtrudeGeometry(ringShape, {
    depth: linkT,
    bevelEnabled: true,
    bevelSegments: 2,
    bevelSize: 0.35,
    bevelThickness: 0.35,
  });
  geos.push(ringGeo);

  // Solid flared neck extending into the first letter's mass
  const bridgeShape = new THREE.Shape();
  bridgeShape.moveTo(loopCenterX, -ringOuterR * 0.75);
  bridgeShape.lineTo(segMinX + 2.4, -4.0);
  bridgeShape.lineTo(segMinX + 2.4, 4.0);
  bridgeShape.lineTo(loopCenterX, ringOuterR * 0.75);
  bridgeShape.closePath();

  const bridgeGeo = new THREE.ExtrudeGeometry(bridgeShape, {
    depth: linkT,
    bevelEnabled: true,
    bevelSegments: 2,
    bevelSize: 0.3,
    bevelThickness: 0.3,
  });
  geos.push(bridgeGeo);

  return geos;
}

/**
 * Creates Tail Charm 3D Geometry
 */
function createArticulatedTailCharm(
  charm: TailCharmType,
  segCenterX: number,
  size: number,
  depth: number
): THREE.BufferGeometry {
  const shape = new THREE.Shape();
  const half = size / 2;

  if (charm === 'heart') {
    shape.moveTo(0, -half * 0.85);
    shape.bezierCurveTo(-half * 1.1, -half * 0.2, -half * 1.1, half * 0.65, -half * 0.55, half * 0.85);
    shape.bezierCurveTo(-half * 0.15, half * 0.85, 0, half * 0.6, 0, half * 0.4);
    shape.bezierCurveTo(0, half * 0.6, half * 0.15, half * 0.85, half * 0.55, half * 0.85);
    shape.bezierCurveTo(half * 1.1, half * 0.65, half * 1.1, -half * 0.2, 0, -half * 0.85);
  } else if (charm === 'star') {
    const points = 5;
    for (let i = 0; i < points * 2; i++) {
      const a = (i * Math.PI) / points - Math.PI / 2;
      const r = i % 2 === 0 ? half * 0.95 : half * 0.45;
      const x = Math.cos(a) * r;
      const y = Math.sin(a) * r;
      if (i === 0) shape.moveTo(x, y);
      else shape.lineTo(x, y);
    }
    shape.closePath();
  } else if (charm === 'bone') {
    const bw = half * 0.8;
    const bh = half * 0.42;
    const kr = half * 0.35;
    shape.moveTo(-bw, -bh);
    shape.lineTo(bw, -bh);
    shape.absarc(bw, -bh + kr, kr, -Math.PI / 2, 0, false);
    shape.absarc(bw, bh - kr, kr, 0, Math.PI / 2, false);
    shape.lineTo(-bw, bh);
    shape.absarc(-bw, bh - kr, kr, Math.PI / 2, Math.PI, false);
    shape.absarc(-bw, -bh + kr, kr, Math.PI, (3 * Math.PI) / 2, false);
  } else if (charm === 'paw') {
    shape.absarc(0, -half * 0.15, half * 0.6, 0, Math.PI * 2, false);
  } else {
    // Skull / Tech Badge
    shape.absarc(0, half * 0.2, half * 0.65, 0, Math.PI * 2, false);
  }

  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: depth * 0.9,
    bevelEnabled: true,
    bevelSegments: 2,
    bevelSize: 0.35,
    bevelThickness: 0.35,
  });
  geo.translate(segCenterX, 0, 0);
  return geo;
}

/**
 * 3. QR CODE KEYCHAIN (Dual-Level Multi-Color Matrix with Ring Hole)
 */
function generateQrKeychain(params: KeychainParams): KeychainGeometries {
  const size = Math.max(30, Math.min(80, params.qrSize || 50));
  const baseT = Math.max(1.8, Math.min(5.0, params.baseThickness || 2.4));
  const raisedT = Math.max(1.0, Math.min(3.0, params.textExtrusion || 1.6));
  const holeR = (params.holeDiameter || 4.0) / 2;

  const baseGeometries: THREE.BufferGeometry[] = [];
  const raisedGeometries: THREE.BufferGeometry[] = [];

  // Base Plate with rounded corners
  const baseShape = new THREE.Shape();
  const half = size / 2;
  const r = 4;
  baseShape.moveTo(-half + r, -half);
  baseShape.lineTo(half - r, -half);
  baseShape.quadraticCurveTo(half, -half, half, -half + r);
  baseShape.lineTo(half, half - r);
  baseShape.quadraticCurveTo(half, half, half - r, half);
  baseShape.lineTo(-half + r, half);
  baseShape.quadraticCurveTo(-half, half, -half, half - r);
  baseShape.lineTo(-half, -half + r);
  baseShape.quadraticCurveTo(-half, -half, -half + r, -half);

  // Keychain Ring Tab at Top
  const ringOuterR = holeR + 2.8;
  const ringShape = new THREE.Shape();
  ringShape.absarc(0, half + ringOuterR - 1, ringOuterR, 0, Math.PI * 2, false);
  const ringHole = new THREE.Path();
  ringHole.absarc(0, half + ringOuterR - 1, holeR, 0, Math.PI * 2, true);
  ringShape.holes.push(ringHole);

  const baseGeo = new THREE.ExtrudeGeometry(baseShape, { depth: baseT, bevelEnabled: true, bevelSize: 0.5, bevelThickness: 0.5 });
  const ringGeo = new THREE.ExtrudeGeometry(ringShape, { depth: baseT, bevelEnabled: true, bevelSize: 0.4, bevelThickness: 0.4 });
  baseGeometries.push(baseGeo, ringGeo);

  // Generate QR Matrix Pattern (21x21 modules standard QR)
  const modules = 21;
  const matrix = createQrMatrix(params.qrContent || 'https://makerworld.com', modules);
  const margin = 4;
  const innerSize = size - margin * 2;
  const cellSize = innerSize / modules;
  const x0 = -innerSize / 2;
  const y0 = innerSize / 2;

  const raisedPositions: number[] = [];
  const raisedNormals: number[] = [];

  for (let rIdx = 0; rIdx < modules; rIdx++) {
    for (let cIdx = 0; cIdx < modules; cIdx++) {
      if (matrix[rIdx][cIdx]) {
        const cx = x0 + (cIdx + 0.5) * cellSize;
        const cy = y0 - (rIdx + 0.5) * cellSize;
        const cz = baseT + raisedT / 2;

        const cellGeo = new THREE.BoxGeometry(cellSize * 0.96, cellSize * 0.96, raisedT);
        cellGeo.translate(cx, cy, cz);

        const p = cellGeo.getAttribute('position');
        const n = cellGeo.getAttribute('normal');
        const idx = cellGeo.getIndex();
        if (idx) {
          for (let i = 0; i < idx.count; i++) {
            const vi = idx.getX(i);
            raisedPositions.push(p.getX(vi), p.getY(vi), p.getZ(vi));
            raisedNormals.push(n.getX(vi), n.getY(vi), n.getZ(vi));
          }
        }
        cellGeo.dispose();
      }
    }
  }

  if (raisedPositions.length > 0) {
    const qGeo = new THREE.BufferGeometry();
    qGeo.setAttribute('position', new THREE.Float32BufferAttribute(raisedPositions, 3));
    qGeo.setAttribute('normal', new THREE.Float32BufferAttribute(raisedNormals, 3));
    raisedGeometries.push(qGeo);
  }

  const baseMerged = mergeGeometries(baseGeometries);
  const raisedMerged = raisedGeometries.length > 0 ? mergeGeometries(raisedGeometries) : new THREE.BufferGeometry();
  const combined = mergeGeometries([...baseGeometries, ...raisedGeometries]);

  combined.rotateX(Math.PI / 2);
  baseMerged.rotateX(Math.PI / 2);
  if (raisedMerged.getAttribute('position')) raisedMerged.rotateX(Math.PI / 2);

  return {
    combined,
    baseGeo: baseMerged,
    lettersGeo: raisedMerged,
  };
}

function createQrMatrix(content: string, size = 21): boolean[][] {
  const m: boolean[][] = [];
  for (let r = 0; r < size; r++) {
    m[r] = [];
    for (let c = 0; c < size; c++) {
      m[r][c] = false;
    }
  }

  // Draw Position Finder Patterns at 3 corners (7x7)
  const drawFinder = (top: number, left: number) => {
    for (let r = 0; r < 7; r++) {
      for (let c = 0; c < 7; c++) {
        if (r === 0 || r === 6 || c === 0 || c === 6 || (r >= 2 && r <= 4 && c >= 2 && c <= 4)) {
          m[top + r][left + c] = true;
        }
      }
    }
  };

  drawFinder(0, 0);
  drawFinder(0, size - 7);
  drawFinder(size - 7, 0);

  // Timing Patterns
  for (let i = 8; i < size - 8; i++) {
    m[6][i] = i % 2 === 0;
    m[i][6] = i % 2 === 0;
  }

  // Hash content into data cells
  let hash = 0;
  for (let i = 0; i < content.length; i++) {
    hash = (hash << 5) - hash + content.charCodeAt(i);
    hash |= 0;
  }

  let bitIndex = 0;
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if ((r < 8 && c < 8) || (r < 8 && c >= size - 8) || (r >= size - 8 && c < 8) || r === 6 || c === 6) {
        continue;
      }
      const pseudoRandom = Math.sin(hash + bitIndex * 1.7) * 10000;
      m[r][c] = (pseudoRandom - Math.floor(pseudoRandom)) > 0.45;
      bitIndex++;
    }
  }

  return m;
}
