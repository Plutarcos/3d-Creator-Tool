import * as THREE from 'three';
import { VaseParams } from '../types';

/**
 * Generates a procedural 3D printable parametric vase / holder with spiral twists, waves, and hollow cavity
 */
export function generateVaseGeometry(params: VaseParams): THREE.BufferGeometry {
  const height = params.height || 100;
  const bottomR = params.bottomRadius || 25;
  const topR = params.topRadius || 30;
  const bulge = params.middleBulge || 1.25;
  const sides = Math.max(3, Math.min(64, params.sides || 6));
  const twist = (params.twistAngle || 45) * (Math.PI / 180);
  const waves = params.waves || 0;
  const waveAmp = params.waveAmplitude || 3;
  const wallT = params.wallThickness || 2.4;
  const bottomT = params.bottomThickness || 3.0;
  const solidMode = params.solidMode || false; // Vase mode / spiralize print

  const verticalSegments = 40;
  const positions: number[] = [];

  // Helper to calculate radius and angle at a given height fraction t (0 to 1)
  const getProfile = (t: number, isInner: boolean = false) => {
    // Smooth quadratic or sin curve for waist/bulge
    const curve = Math.sin(t * Math.PI) * (bulge - 1.0);
    let baseR = bottomR * (1 - t) + topR * t + curve * bottomR;
    if (isInner) {
      baseR = Math.max(2, baseR - wallT);
    }
    const currentTwist = t * twist;
    return { baseR, currentTwist };
  };

  const getPoint = (t: number, sideIdx: number, isInner: boolean): [number, number, number] => {
    const { baseR, currentTwist } = getProfile(t, isInner);
    const angleStep = (Math.PI * 2) / sides;
    const baseAngle = sideIdx * angleStep + currentTwist;

    // Apply sinusoidal ripple / waves along perimeter
    let r = baseR;
    if (waves > 0) {
      r += Math.sin(sideIdx * angleStep * waves + t * Math.PI * 4) * waveAmp * (isInner ? 0.4 : 1.0);
    }

    const x = Math.cos(baseAngle) * r;
    const z = Math.sin(baseAngle) * r;
    const y = isInner ? bottomT + t * (height - bottomT) : t * height;
    return [x, y, z];
  };

  // 1. Outer Shell Surface
  for (let iy = 0; iy < verticalSegments; iy++) {
    const t0 = iy / verticalSegments;
    const t1 = (iy + 1) / verticalSegments;

    for (let is = 0; is < sides; is++) {
      const isNext = (is + 1) % sides;

      const p00 = getPoint(t0, is, false);
      const p10 = getPoint(t0, isNext, false);
      const p11 = getPoint(t1, isNext, false);
      const p01 = getPoint(t1, is, false);

      // Quad on outer wall
      positions.push(...p00, ...p10, ...p11);
      positions.push(...p00, ...p11, ...p01);
    }
  }

  // 2. Bottom Cap (Outer)
  const pBottomCenter: [number, number, number] = [0, 0, 0];
  for (let is = 0; is < sides; is++) {
    const isNext = (is + 1) % sides;
    const p1 = getPoint(0, is, false);
    const p2 = getPoint(0, isNext, false);
    positions.push(...pBottomCenter, ...p2, ...p1);
  }

  if (solidMode) {
    // If solid mode (spiral vase slicing), cap the top too or leave open
    // Leave open top for vase mode
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.computeVertexNormals();
    return geometry;
  }

  // 3. Inner Hollow Cavity
  for (let iy = 0; iy < verticalSegments; iy++) {
    const t0 = iy / verticalSegments;
    const t1 = (iy + 1) / verticalSegments;

    for (let is = 0; is < sides; is++) {
      const isNext = (is + 1) % sides;

      const p00 = getPoint(t0, is, true);
      const p10 = getPoint(t0, isNext, true);
      const p11 = getPoint(t1, isNext, true);
      const p01 = getPoint(t1, is, true);

      // Reversed orientation for inside cavity normals
      positions.push(...p10, ...p00, ...p11);
      positions.push(...p00, ...p01, ...p11);
    }
  }

  // 4. Inside Floor Cap
  const pInnerFloorCenter: [number, number, number] = [0, bottomT, 0];
  for (let is = 0; is < sides; is++) {
    const isNext = (is + 1) % sides;
    const p1 = getPoint(0, is, true);
    const p2 = getPoint(0, isNext, true);
    positions.push(...pInnerFloorCenter, ...p1, ...p2);
  }

  // 5. Top Rim (bridges outer lip to inner lip)
  for (let is = 0; is < sides; is++) {
    const isNext = (is + 1) % sides;

    const out0 = getPoint(1, is, false);
    const out1 = getPoint(1, isNext, false);
    const in0 = getPoint(1, is, true);
    const in1 = getPoint(1, isNext, true);

    positions.push(...out0, ...out1, ...in1);
    positions.push(...out0, ...in1, ...in0);
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.computeVertexNormals();
  return geometry;
}
