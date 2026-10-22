import * as THREE from 'three';
import { NameplateParams, FontChoice } from '../types';
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

export interface NameplateGeometries {
  combined: THREE.BufferGeometry;
  basePlateGeo: THREE.BufferGeometry;
  lettersGeo: THREE.BufferGeometry;
}

/**
 * Generates an angled desk nameplate with robust, high-resolution 3D raised text
 */
export function generateNameplateCompleteGeometries(params: NameplateParams): NameplateGeometries {
  const width = Math.max(60, Math.min(240, params.plateWidth || 130));
  const height = Math.max(25, Math.min(80, params.plateHeight || 40));
  const thickness = Math.max(3, Math.min(15, params.plateThickness || 5));
  const angleDeg = params.plateAngle || 65;
  const angleRad = (angleDeg * Math.PI) / 180;
  const textExtrusion = Math.max(1.0, Math.min(6.0, params.textExtrusion || 2.0));
  const style = params.style || 'triangular-wedge';

  const baseGeometries: THREE.BufferGeometry[] = [];
  const letterGeometries: THREE.BufferGeometry[] = [];

  const slantCos = Math.cos(angleRad);
  const slantSin = Math.sin(angleRad);

  // Slanted front face parameters:
  // - Length along slant: height (H)
  // - Face slopes upward and backward from front (+Z) to back (-Z)
  // - Front bottom: (Z = zFront, Y = 0)
  // - Front top: (Z = zTop, Y = yTop)
  const zFront = (height * slantCos) / 2;
  const zTop = -zFront;
  const yTop = height * slantSin;
  const faceCenterY = yTop / 2;

  // Rotation angle around X axis to align local (u, v, w) to the slanted front face:
  // Local (u, v) is in plane with +v pointing up the slant, and +w pointing outward along normal (forward & up)
  const slantRotX = -(Math.PI / 2 - angleRad);

  if (style === 'triangular-wedge') {
    // Classic desk wedge: Solid triangular prism with slanted front face facing user (+Z)
    const zBack = zTop - 14;

    const wedgeShape = new THREE.Shape();
    wedgeShape.moveTo(zFront, 0);         // 1. Front bottom lip
    wedgeShape.lineTo(zTop, yTop);         // 2. Slanted front face to top
    wedgeShape.lineTo(zTop - 4, yTop);     // 3. Top flat ridge (4mm)
    wedgeShape.lineTo(zBack, 0);           // 4. Back slope to desk
    wedgeShape.lineTo(zFront, 0);          // 5. Flat bottom on desk

    const wedgeGeo = new THREE.ExtrudeGeometry(wedgeShape, {
      depth: width,
      bevelEnabled: true,
      bevelSegments: 2,
      bevelSize: 0.8,
      bevelThickness: 0.8,
    });
    // Extrusion was along +Z; rotate so extrusion is along X (-W/2 to +W/2) and Z_shape stays Z
    wedgeGeo.rotateY(-Math.PI / 2);
    wedgeGeo.translate(width / 2, 0, 0);
    baseGeometries.push(wedgeGeo);
  } else if (style === 'curved-stand') {
    // Elegant ergonomic curved profile stand
    const zBack = zTop - 18;

    const standShape = new THREE.Shape();
    standShape.moveTo(zFront, 0);
    standShape.lineTo(zTop, yTop);
    standShape.quadraticCurveTo(zTop - 2, yTop + 2, zTop - 5, yTop - 1);
    standShape.lineTo(zTop - 5, yTop * 0.45);
    standShape.quadraticCurveTo(zTop - 9, 8, zBack, 0);
    standShape.lineTo(zBack + 12, 0);
    standShape.quadraticCurveTo(zFront - 8, 4, zFront, 0);

    const standGeo = new THREE.ExtrudeGeometry(standShape, {
      depth: width,
      bevelEnabled: true,
      bevelSegments: 2,
      bevelSize: 0.8,
      bevelThickness: 0.8,
    });
    standGeo.rotateY(-Math.PI / 2);
    standGeo.translate(width / 2, 0, 0);
    baseGeometries.push(standGeo);
  } else {
    // Flat Slide-in Plate with heavy base foot
    const plateShape = new THREE.Shape();
    const hw = width / 2;
    const hh = height / 2;
    const cr = 2.0;
    plateShape.moveTo(-hw + cr, -hh);
    plateShape.lineTo(hw - cr, -hh);
    plateShape.quadraticCurveTo(hw, -hh, hw, -hh + cr);
    plateShape.lineTo(hw, hh - cr);
    plateShape.quadraticCurveTo(hw, hh, hw - cr, hh);
    plateShape.lineTo(-hw + cr, hh);
    plateShape.quadraticCurveTo(-hw, hh, -hw, hh - cr);
    plateShape.lineTo(-hw, -hh + cr);
    plateShape.quadraticCurveTo(-hw, -hh, -hw + cr, -hh);

    const plateGeo = new THREE.ExtrudeGeometry(plateShape, {
      depth: thickness,
      bevelEnabled: true,
      bevelSegments: 2,
      bevelSize: 0.5,
      bevelThickness: 0.5,
    });
    // Center extrusion along local Z
    plateGeo.translate(0, 0, -thickness / 2);
    plateGeo.rotateX(slantRotX);
    plateGeo.translate(0, faceCenterY + 4, 0);
    baseGeometries.push(plateGeo);

    // Foot base resting on desk
    const footDepth = height * slantCos + 22;
    const footGeo = new THREE.BoxGeometry(width * 0.96, 7, footDepth);
    footGeo.translate(0, 3.5, 0);
    baseGeometries.push(footGeo);
  }

  // Border frame on the slanted front face if enabled
  if (params.hasBorder) {
    const borderThick = params.borderThickness || 1.2;
    const borderFrameShape = new THREE.Shape();
    const hw = width / 2 - 2.5;
    const hh = height / 2 - 2.5;
    const frameW = 2.2;

    borderFrameShape.moveTo(-hw, -hh);
    borderFrameShape.lineTo(hw, -hh);
    borderFrameShape.lineTo(hw, hh);
    borderFrameShape.lineTo(-hw, hh);
    borderFrameShape.closePath();

    const holePath = new THREE.Path();
    holePath.moveTo(-hw + frameW, -hh + frameW);
    holePath.lineTo(hw - frameW, -hh + frameW);
    holePath.lineTo(hw - frameW, hh - frameW);
    holePath.lineTo(-hw + frameW, hh - frameW);
    holePath.closePath();
    borderFrameShape.holes.push(holePath);

    const borderGeo = new THREE.ExtrudeGeometry(borderFrameShape, {
      depth: borderThick,
      bevelEnabled: false,
    });
    // Center thickness and place slightly on front surface
    const frontZOffset = style === 'flat-slide-in' ? thickness / 2 : 0;
    borderGeo.translate(0, 0, frontZOffset);
    borderGeo.rotateX(slantRotX);
    borderGeo.translate(0, style === 'flat-slide-in' ? faceCenterY + 4 : faceCenterY, 0);
    baseGeometries.push(borderGeo);
  }

  // ----------------------------------------------------
  // Generate 3D Raised Vector Letter Solids (Auto-Fitting & Safe Bounds)
  // ----------------------------------------------------
  const title = (params.title || 'GABRIEL SOUZA').trim();
  const subtitle = (params.subtitle || '').trim();
  const fontName = FONT_CANVAS_MAP[params.font] || 'Bungee, sans-serif';

  // Calculate physical safe printable area inside the plate & border
  const marginX = params.hasBorder ? Math.max(9.0, width * 0.08) : Math.max(6.0, width * 0.06);
  const marginY = params.hasBorder ? Math.max(7.0, height * 0.14) : Math.max(5.0, height * 0.10);
  const safeWidth = width - marginX * 2;
  const safeHeight = height - marginY * 2;

  // High-resolution canvas for crisp rasterization
  const cw = 640;
  const ch = Math.max(140, Math.round(640 * (height / width)));
  const canvas = document.createElement('canvas');
  canvas.width = cw;
  canvas.height = ch;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });

  if (ctx && title.length > 0) {
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, cw, ch);

    const safeCanvasW = cw * (safeWidth / width);
    const safeCanvasH = ch * (safeHeight / height);
    const hasSub = subtitle.length > 0;

    // Calculate maximum allowable font sizes to strictly prevent overflowing
    let titleFontSize = Math.round(hasSub ? safeCanvasH * 0.44 : safeCanvasH * 0.62);
    let subFontSize = Math.round(safeCanvasH * 0.24);
    const gap = Math.round(safeCanvasH * 0.12);

    // Measure and auto-scale Title font size to fit within safe width
    ctx.font = `900 ${titleFontSize}px ${fontName}`;
    let titleWidth = ctx.measureText(title.toUpperCase()).width;
    if (titleWidth > safeCanvasW) {
      titleFontSize = Math.max(12, Math.floor(titleFontSize * (safeCanvasW / titleWidth) * 0.96));
      ctx.font = `900 ${titleFontSize}px ${fontName}`;
    }

    // Measure and auto-scale Subtitle font size to fit within safe width
    if (hasSub) {
      ctx.font = `700 ${subFontSize}px ${fontName}`;
      let subWidth = ctx.measureText(subtitle.toUpperCase()).width;
      if (subWidth > safeCanvasW) {
        subFontSize = Math.max(10, Math.floor(subFontSize * (safeCanvasW / subWidth) * 0.94));
        ctx.font = `700 ${subFontSize}px ${fontName}`;
      }
    }

    // Vertical positioning: vertically center the entire text block within canvas
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    if (hasSub) {
      const totalBlockH = titleFontSize + gap + subFontSize;
      const titleCenterY = ch / 2 - totalBlockH / 2 + titleFontSize / 2;
      const subCenterY = ch / 2 + totalBlockH / 2 - subFontSize / 2;

      ctx.font = `900 ${titleFontSize}px ${fontName}`;
      ctx.fillText(title.toUpperCase(), cw / 2, titleCenterY);

      ctx.font = `700 ${subFontSize}px ${fontName}`;
      ctx.fillText(subtitle.toUpperCase(), cw / 2, subCenterY);
    } else {
      ctx.font = `900 ${titleFontSize}px ${fontName}`;
      ctx.fillText(title.toUpperCase(), cw / 2, ch / 2);
    }

    const imgData = ctx.getImageData(0, 0, cw, ch).data;

    // Scan horizontal spans to build watertight solid 3D box extrusions
    const spanPositions: number[] = [];
    const spanNormals: number[] = [];

    const scaleX = width / cw;
    const scaleY = height / ch;
    const threshold = 115;
    const frontZOffset = style === 'flat-slide-in' ? thickness / 2 : 0;
    const embedDepth = 0.5; // Embed 0.5mm into plate for 3D print adhesion
    const boxD = textExtrusion + embedDepth;

    for (let y = 0; y < ch; y++) {
      let inSpan = false;
      let spanStart = 0;

      for (let x = 0; x <= cw; x++) {
        const isPixel = x < cw && imgData[(y * cw + x) * 4] > threshold;

        if (isPixel && !inSpan) {
          inSpan = true;
          spanStart = x;
        } else if (!isPixel && inSpan) {
          inSpan = false;
          const spanLen = x - spanStart;

          // Convert canvas pixel span to physical millimeter box on slanted face
          const boxW = spanLen * scaleX;
          const boxH = scaleY * 1.04;
          const centerX = (spanStart + spanLen / 2 - cw / 2) * scaleX;
          const centerY = -(y + 0.5 - ch / 2) * scaleY;
          const centerZ = frontZOffset + (textExtrusion - embedDepth) / 2;

          const blockGeo = new THREE.BoxGeometry(boxW, boxH, boxD);
          blockGeo.translate(centerX, centerY, centerZ);

          const pos = blockGeo.getAttribute('position');
          const norm = blockGeo.getAttribute('normal');
          const idx = blockGeo.getIndex();

          if (idx) {
            for (let i = 0; i < idx.count; i++) {
              const vi = idx.getX(i);
              spanPositions.push(pos.getX(vi), pos.getY(vi), pos.getZ(vi));
              spanNormals.push(norm.getX(vi), norm.getY(vi), norm.getZ(vi));
            }
          }
          blockGeo.dispose();
        }
      }
    }

    if (spanPositions.length > 0) {
      const textGeo = new THREE.BufferGeometry();
      textGeo.setAttribute('position', new THREE.Float32BufferAttribute(spanPositions, 3));
      textGeo.setAttribute('normal', new THREE.Float32BufferAttribute(spanNormals, 3));

      // Rotate to match slanted face and position on front surface
      textGeo.rotateX(slantRotX);
      textGeo.translate(0, style === 'flat-slide-in' ? faceCenterY + 4 : faceCenterY, 0);
      letterGeometries.push(textGeo);
    }
  }

  const baseMerged = mergeGeometries(baseGeometries.length > 0 ? baseGeometries : [new THREE.BoxGeometry(10, 10, 10)]);
  const lettersMerged = letterGeometries.length > 0 ? mergeGeometries(letterGeometries) : new THREE.BufferGeometry();

  const allGeos = [...baseGeometries, ...letterGeometries];
  const combined = mergeGeometries(allGeos);

  return {
    combined,
    basePlateGeo: baseMerged,
    lettersGeo: lettersMerged,
  };
}

export function generateNameplateGeometry(params: NameplateParams): THREE.BufferGeometry {
  return generateNameplateCompleteGeometries(params).combined;
}
