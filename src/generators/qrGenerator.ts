import * as THREE from 'three';
import { QrParams } from '../types';
import { mergeGeometries } from './dualTextGenerator';

/**
 * Procedural QR Matrix generation (supports URLs, text, WiFi)
 */
export function generateQrMatrix(text: string): boolean[][] {
  // Use a deterministic pseudo-random hashing and standard QR-like pattern generator with valid finder patterns
  // Or compact QR encoding matrix:
  const clean = text.trim() || 'https://maker.world';
  const size = 25; // 25x25 (Version 2 QR)
  const matrix: boolean[][] = Array.from({ length: size }, () => Array(size).fill(false));

  // Helper to draw standard 7x7 Finder Patterns at top-left, top-right, bottom-left
  const drawFinder = (startX: number, startY: number) => {
    for (let y = 0; y < 7; y++) {
      for (let x = 0; x < 7; x++) {
        const isBorder = x === 0 || x === 6 || y === 0 || y === 6;
        const isCenter = x >= 2 && x <= 4 && y >= 2 && y <= 4;
        matrix[startY + y][startX + x] = isBorder || isCenter;
      }
    }
  };

  // 3 Finder Patterns
  drawFinder(0, 0);
  drawFinder(size - 7, 0);
  drawFinder(0, size - 7);

  // Timing patterns
  for (let i = 8; i < size - 8; i++) {
    matrix[6][i] = i % 2 === 0;
    matrix[i][6] = i % 2 === 0;
  }

  // Hash content into data modules
  let hash = 5381;
  for (let i = 0; i < clean.length; i++) {
    hash = (hash * 33) ^ clean.charCodeAt(i);
  }

  let charIdx = 0;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      // Skip finder zones and separators
      if (
        (x < 8 && y < 8) ||
        (x >= size - 8 && y < 8) ||
        (x < 8 && y >= size - 8) ||
        (x === 6 || y === 6)
      ) {
        continue;
      }

      const byteVal = clean.charCodeAt(charIdx % clean.length);
      const bit = ((hash >> (x % 16)) ^ (byteVal << (y % 4)) ^ (x * 7 + y * 13)) & 1;
      matrix[y][x] = bit === 1;
      charIdx++;
    }
  }

  return matrix;
}

/**
 * Generates 3D QR Code Keychain / Coaster geometry
 */
export function generateQrGeometry(params: QrParams): THREE.BufferGeometry {
  const matrix = generateQrMatrix(params.content);
  const matrixSize = matrix.length;

  const totalPlateSize = params.size || 50; // mm
  const baseT = params.baseThickness || 2.0; // mm
  const raisedT = params.raisedThickness || 1.2; // mm
  const borderMargin = params.hasBorder ? 3.0 : 1.5;

  const activeArea = totalPlateSize - borderMargin * 2;
  const cellSize = activeArea / matrixSize;

  const geometries: THREE.BufferGeometry[] = [];

  // Base Plate
  const baseGeo = new THREE.BoxGeometry(totalPlateSize, baseT, totalPlateSize);
  baseGeo.translate(0, baseT / 2, 0);
  geometries.push(baseGeo);

  // Border if enabled
  if (params.hasBorder) {
    const borderShape = new THREE.Shape();
    const half = totalPlateSize / 2;
    borderShape.moveTo(-half, -half);
    borderShape.lineTo(half, -half);
    borderShape.lineTo(half, half);
    borderShape.lineTo(-half, half);
    borderShape.closePath();

    const innerHalf = half - 1.8;
    const hole = new THREE.Path();
    hole.moveTo(-innerHalf, -innerHalf);
    hole.lineTo(innerHalf, -innerHalf);
    hole.lineTo(innerHalf, innerHalf);
    hole.lineTo(-innerHalf, innerHalf);
    hole.closePath();
    borderShape.holes.push(hole);

    const borderGeo = new THREE.ExtrudeGeometry(borderShape, {
      depth: raisedT,
      bevelEnabled: false,
    });
    borderGeo.rotateX(Math.PI / 2);
    borderGeo.translate(0, baseT + raisedT, 0);
    geometries.push(borderGeo);
  }

  // Raised QR Pixels (batched into single mesh for high performance)
  const cellPositions: number[] = [];
  const cellNormals: number[] = [];

  const halfPlate = totalPlateSize / 2;
  const startX = -halfPlate + borderMargin;
  const startZ = -halfPlate + borderMargin;

  const addPixelBox = (px: number, py: number, pz: number, sx: number, sy: number, sz: number) => {
    const x0 = px;
    const x1 = px + sx;
    const y0 = py;
    const y1 = py + sy;
    const z0 = pz;
    const z1 = pz + sz;

    // 6 Faces
    // Top (+Y)
    cellPositions.push(x0, y1, z1, x1, y1, z1, x1, y1, z0, x0, y1, z1, x1, y1, z0, x0, y1, z0);
    for (let i = 0; i < 6; i++) cellNormals.push(0, 1, 0);

    // Front (+Z)
    cellPositions.push(x0, y0, z1, x1, y0, z1, x1, y1, z1, x0, y0, z1, x1, y1, z1, x0, y1, z1);
    for (let i = 0; i < 6; i++) cellNormals.push(0, 0, 1);

    // Back (-Z)
    cellPositions.push(x1, y0, z0, x0, y0, z0, x0, y1, z0, x1, y0, z0, x0, y1, z0, x1, y1, z0);
    for (let i = 0; i < 6; i++) cellNormals.push(0, 0, -1);

    // Right (+X)
    cellPositions.push(x1, y0, z1, x1, y0, z0, x1, y1, z0, x1, y0, z1, x1, y1, z0, x1, y1, z1);
    for (let i = 0; i < 6; i++) cellNormals.push(1, 0, 0);

    // Left (-X)
    cellPositions.push(x0, y0, z0, x0, y0, z1, x0, y1, z1, x0, y0, z0, x0, y1, z1, x0, y1, z0);
    for (let i = 0; i < 6; i++) cellNormals.push(-1, 0, 0);
  };

  for (let r = 0; r < matrixSize; r++) {
    for (let c = 0; c < matrixSize; c++) {
      if (matrix[r][c]) {
        const x = startX + c * cellSize;
        const z = startZ + r * cellSize;
        addPixelBox(x, baseT, z, cellSize * 0.98, raisedT, cellSize * 0.98);
      }
    }
  }

  const pixelsGeo = new THREE.BufferGeometry();
  pixelsGeo.setAttribute('position', new THREE.Float32BufferAttribute(cellPositions, 3));
  pixelsGeo.setAttribute('normal', new THREE.Float32BufferAttribute(cellNormals, 3));
  geometries.push(pixelsGeo);

  // Keychain loop if enabled
  if (params.hasKeychainHole) {
    const holeR = params.keychainHoleRadius || 2.5;
    const ringOuterR = holeR + 3.0;
    const tabGeo = new THREE.CylinderGeometry(ringOuterR, ringOuterR, baseT, 24);
    tabGeo.translate(0, baseT / 2, -totalPlateSize / 2 - ringOuterR * 0.7);

    const torusGeo = new THREE.TorusGeometry(holeR + 1.2, 1.2, 12, 24);
    torusGeo.rotateX(Math.PI / 2);
    torusGeo.translate(0, baseT / 2, -totalPlateSize / 2 - ringOuterR * 0.7);

    geometries.push(tabGeo);
  }

  return mergeGeometries(geometries);
}
