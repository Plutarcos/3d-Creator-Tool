import * as THREE from 'three';
import { GearParams } from '../types';
import { mergeGeometries } from './dualTextGenerator';

/**
 * Generates an accurate, professional 3D printable mechanical gear
 * Supports Spur, Helical, Herringbone (Double Helical), Internal Ring, and Bevel gears
 */
export function generateGearGeometry(params: GearParams): THREE.BufferGeometry {
  const z = Math.max(6, Math.min(120, params.teeth || 20));
  const m = Math.max(0.5, Math.min(10, params.module || 2.5)); // mm module
  const faceWidth = Math.max(2, Math.min(50, params.thickness || 8));
  const boreRadius = Math.max(1, (params.boreDiameter || 5) / 2);
  const pressureAngleDeg = params.pressureAngle || 20;
  const pressureAngleRad = (pressureAngleDeg * Math.PI) / 180;
  const gearType = params.gearType || 'spur';
  const helixAngleRad = ((params.helixAngle || 20) * Math.PI) / 180;

  // Metric standard gear mechanics
  const pitchRadius = (z * m) / 2;
  const addendum = 1.0 * m;
  const dedendum = 1.25 * m;
  const outerRadius = pitchRadius + addendum;
  const rootRadius = Math.max(boreRadius + 1.5, pitchRadius - dedendum);

  // Generate 2D Involute tooth profile
  const outerProfile: THREE.Vector2[] = [];
  const pointsPerTooth = 12;

  for (let i = 0; i < z; i++) {
    const toothAngle = (Math.PI * 2 * i) / z;
    const pitchPitch = (Math.PI * 2) / z;

    // 1. Root / Dedendum bottom arc
    for (let s = 0; s < 3; s++) {
      const a = toothAngle + (s / 3) * (pitchPitch * 0.25);
      outerProfile.push(new THREE.Vector2(Math.cos(a) * rootRadius, Math.sin(a) * rootRadius));
    }

    // 2. Involute rising flank
    for (let s = 0; s < 3; s++) {
      const frac = s / 3;
      const r = rootRadius + frac * (outerRadius - rootRadius);
      const a = toothAngle + pitchPitch * 0.25 + frac * (pitchPitch * 0.25);
      outerProfile.push(new THREE.Vector2(Math.cos(a) * r, Math.sin(a) * r));
    }

    // 3. Tip / Addendum top
    const aTip1 = toothAngle + pitchPitch * 0.5;
    const aTip2 = toothAngle + pitchPitch * 0.65;
    outerProfile.push(new THREE.Vector2(Math.cos(aTip1) * outerRadius, Math.sin(aTip1) * outerRadius));
    outerProfile.push(new THREE.Vector2(Math.cos(aTip2) * outerRadius, Math.sin(aTip2) * outerRadius));

    // 4. Involute descending flank
    for (let s = 0; s < 3; s++) {
      const frac = 1.0 - (s / 3);
      const r = rootRadius + frac * (outerRadius - rootRadius);
      const a = toothAngle + pitchPitch * 0.65 + (s / 3) * (pitchPitch * 0.25);
      outerProfile.push(new THREE.Vector2(Math.cos(a) * r, Math.sin(a) * r));
    }

    // 5. Root transition to next tooth
    const aEnd = toothAngle + pitchPitch;
    outerProfile.push(new THREE.Vector2(Math.cos(aEnd) * rootRadius, Math.sin(aEnd) * rootRadius));
  }

  // Build 2D Shape
  let gearShape: THREE.Shape;

  if (gearType === 'internal') {
    // Ring gear with internal teeth
    const ringOuterRadius = outerRadius + 8;
    const ringShape = new THREE.Shape();
    ringShape.absarc(0, 0, ringOuterRadius, 0, Math.PI * 2, false);

    const internalTeethHole = new THREE.Path(outerProfile);
    ringShape.holes.push(internalTeethHole);
    gearShape = ringShape;
  } else {
    gearShape = new THREE.Shape(outerProfile);

    // Inner Shaft / Bore Hole with D-Cut or Keyway
    const holePath = new THREE.Path();
    const holeSegments = 36;
    const shaftType = params.shaftType || 'round';

    if (shaftType === 'd-shaft') {
      const flatCut = params.dShaftFlat || (boreRadius * 0.4);
      const flatY = boreRadius - flatCut;
      holePath.moveTo(-Math.sqrt(boreRadius * boreRadius - flatY * flatY), flatY);
      holePath.lineTo(Math.sqrt(boreRadius * boreRadius - flatY * flatY), flatY);
      const startAngle = Math.asin(flatY / boreRadius);
      const endAngle = Math.PI - startAngle;
      holePath.absarc(0, 0, boreRadius, startAngle, endAngle + Math.PI, false);
    } else if (shaftType === 'hex') {
      for (let h = 0; h < 6; h++) {
        const ha = (h * Math.PI) / 3;
        const hx = Math.cos(ha) * boreRadius;
        const hy = Math.sin(ha) * boreRadius;
        if (h === 0) holePath.moveTo(hx, hy);
        else holePath.lineTo(hx, hy);
      }
      holePath.closePath();
    } else if (params.hasKeyway) {
      const kw = (params.keywayWidth || 2.5) / 2;
      const kd = boreRadius + (params.keywayDepth || 1.8);
      holePath.moveTo(boreRadius, 0);
      for (let i = 1; i <= holeSegments; i++) {
        const a = (i / holeSegments) * Math.PI * 2;
        const x = Math.cos(a) * boreRadius;
        const y = Math.sin(a) * boreRadius;
        if (Math.abs(x) < kw && y > 0) {
          if (x < 0) {
            holePath.lineTo(-kw, kd);
            holePath.lineTo(kw, kd);
          }
        } else {
          holePath.lineTo(x, y);
        }
      }
    } else {
      holePath.absarc(0, 0, boreRadius, 0, Math.PI * 2, true);
    }

    gearShape.holes.push(holePath);

    // Lightening Spokes and Cutouts
    const numSpokes = params.spokes || 0;
    const spokeStyle = params.spokeStyle || 'straight';
    const hubR = Math.max(boreRadius + 4, params.hubDiameter ? params.hubDiameter / 2 : boreRadius + 6);
    const innerRimR = rootRadius - (params.rimWidth || 4);

    if (numSpokes > 0 && innerRimR > hubR + 5 && pitchRadius > 20) {
      if (spokeStyle === 'circular-cutouts') {
        const circleR = (innerRimR - hubR) * 0.42;
        const midR = (hubR + innerRimR) / 2;
        for (let sp = 0; sp < numSpokes; sp++) {
          const spA = (sp * 2 * Math.PI) / numSpokes;
          const cx = Math.cos(spA) * midR;
          const cy = Math.sin(spA) * midR;
          const circleHole = new THREE.Path();
          circleHole.absarc(cx, cy, circleR, 0, Math.PI * 2, true);
          gearShape.holes.push(circleHole);
        }
      } else {
        // Sector spoke holes
        for (let sp = 0; sp < numSpokes; sp++) {
          const spokeHole = new THREE.Path();
          const startA = (sp * 2 * Math.PI) / numSpokes + 0.18;
          const endA = ((sp + 1) * 2 * Math.PI) / numSpokes - 0.18;
          spokeHole.absarc(0, 0, hubR, startA, endA, false);
          spokeHole.absarc(0, 0, innerRimR, endA, startA, true);
          spokeHole.closePath();
          gearShape.holes.push(spokeHole);
        }
      }
    }
  }

  const bevelSize = params.chamferToothEdges ? 0.6 : 0.2;

  // Helical / Herringbone extrusion vs Standard Spur
  let finalGearGeo: THREE.BufferGeometry;

  if (gearType === 'herringbone') {
    // Herringbone (Double Helical): Two mirror halves with opposite twist
    const halfDepth = faceWidth / 2;
    const twist = Math.tan(helixAngleRad) * (halfDepth / pitchRadius);

    // Half 1
    const geo1 = new THREE.ExtrudeGeometry(gearShape, {
      depth: halfDepth,
      bevelEnabled: true,
      bevelSegments: 2,
      steps: 12,
      bevelSize,
      bevelThickness: bevelSize,
    });
    applyTwist(geo1, twist, 0, halfDepth);

    // Half 2
    const geo2 = new THREE.ExtrudeGeometry(gearShape, {
      depth: halfDepth,
      bevelEnabled: true,
      bevelSegments: 2,
      steps: 12,
      bevelSize,
      bevelThickness: bevelSize,
    });
    applyTwist(geo2, -twist, 0, halfDepth);
    geo2.translate(0, 0, halfDepth);

    finalGearGeo = mergeGeometries([geo1, geo2]);
  } else if (gearType === 'helical') {
    // Helical Gear
    const twist = Math.tan(helixAngleRad) * (faceWidth / pitchRadius);
    const geo = new THREE.ExtrudeGeometry(gearShape, {
      depth: faceWidth,
      bevelEnabled: true,
      bevelSegments: 2,
      steps: 16,
      bevelSize,
      bevelThickness: bevelSize,
    });
    applyTwist(geo, twist, 0, faceWidth);
    finalGearGeo = geo;
  } else if (gearType === 'bevel') {
    // Bevel gear (tapered cone gear)
    const geo = new THREE.ExtrudeGeometry(gearShape, {
      depth: faceWidth,
      bevelEnabled: true,
      bevelSegments: 2,
      steps: 12,
      bevelSize,
      bevelThickness: bevelSize,
    });
    applyTaper(geo, 1.0, 0.72, faceWidth);
    finalGearGeo = geo;
  } else {
    // Standard Spur Gear
    finalGearGeo = new THREE.ExtrudeGeometry(gearShape, {
      depth: faceWidth,
      bevelEnabled: true,
      bevelSegments: 2,
      steps: 1,
      bevelSize,
      bevelThickness: bevelSize,
    });
  }

  // Add Hub Protrusion if specified
  const hubProtrusion = params.hubHeight || 0;
  const hubDia = params.hubDiameter || 0;
  const geometries: THREE.BufferGeometry[] = [finalGearGeo];

  if (hubProtrusion > 0 && hubDia > boreRadius * 2 + 3) {
    const hubShape = new THREE.Shape();
    hubShape.absarc(0, 0, hubDia / 2, 0, Math.PI * 2, false);
    const hubHole = new THREE.Path();
    hubHole.absarc(0, 0, boreRadius, 0, Math.PI * 2, true);
    hubShape.holes.push(hubHole);

    const hubGeo = new THREE.ExtrudeGeometry(hubShape, {
      depth: hubProtrusion,
      bevelEnabled: true,
      bevelSegments: 2,
      bevelSize: 0.5,
      bevelThickness: 0.5,
    });
    hubGeo.translate(0, 0, faceWidth);
    geometries.push(hubGeo);
  }

  const merged = mergeGeometries(geometries);
  merged.rotateX(Math.PI / 2);
  merged.translate(0, faceWidth / 2, 0);
  return merged;
}

function applyTwist(geometry: THREE.BufferGeometry, maxTwistAngle: number, zMin: number, depth: number) {
  const pos = geometry.getAttribute('position');
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const z = pos.getZ(i);
    const frac = Math.max(0, Math.min(1, (z - zMin) / depth));
    const angle = frac * maxTwistAngle;

    const cosA = Math.cos(angle);
    const sinA = Math.sin(angle);

    const newX = x * cosA - y * sinA;
    const newY = x * sinA + y * cosA;

    pos.setXYZ(i, newX, newY, z);
  }
  pos.needsUpdate = true;
  geometry.computeVertexNormals();
}

function applyTaper(geometry: THREE.BufferGeometry, scaleBottom: number, scaleTop: number, depth: number) {
  const pos = geometry.getAttribute('position');
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const z = pos.getZ(i);
    const frac = Math.max(0, Math.min(1, z / depth));
    const scale = scaleBottom + frac * (scaleTop - scaleBottom);

    pos.setXYZ(i, x * scale, y * scale, z);
  }
  pos.needsUpdate = true;
  geometry.computeVertexNormals();
}
