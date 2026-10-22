import * as THREE from 'three';
import { AIModelBlueprint, AIModelParams, AIModelComponent } from '../types';
import { mergeGeometries } from './dualTextGenerator';

export const AI_PRESET_TEMPLATES: { id: string; title: string; prompt: string; category: string; description: string }[] = [
  {
    id: 'phone-stand',
    title: 'Suporte de Celular Articulado',
    prompt: 'Suporte de mesa ergonômico para smartphone com ângulo ajustável, canal para cabo de carregador e pés antiderrapantes',
    category: 'gadget',
    description: 'Suporte estável para celular na horizontal ou vertical com recorte para cabo.',
  },
  {
    id: 'desk-organizer',
    title: 'Organizador Hexagonal Modular',
    prompt: 'Organizador de mesa moderno com compartimentos hexagonais em diferentes alturas para canetas, clipes e cartões',
    category: 'functional',
    description: 'Módulo hexagonal com 3 alturas para manter a mesa impecável.',
  },
  {
    id: 'headphone-hanger',
    title: 'Suporte de Fone / Headset',
    prompt: 'Suporte de headphone para fixar na lateral da mesa com curva suave para não marcar a espuma e gancho para enrolar o cabo',
    category: 'gadget',
    description: 'Gancho robusto para headset com curva anatômica e guia de cabos.',
  },
  {
    id: 'screw-container',
    title: 'Pote Rosqueável com Tampa',
    prompt: 'Recipiente cilíndrico com rosca rápida, textura externa recartilhada antiderrapante e tampa estanque',
    category: 'functional',
    description: 'Pote com tampa rosqueável para parafusos, remédios ou pequenos objetos.',
  },
  {
    id: 'geometric-trophy',
    title: 'Troféu Geométrico Prisma',
    prompt: 'Troféu decorativo moderno com base escalonada pesada, corpo facetado em espiral e topo angular',
    category: 'decorative',
    description: 'Objeto de premiação moderno facetado com base imponente.',
  },
  {
    id: 'dice-tower',
    title: 'Mini Torre de Dados RPG',
    prompt: 'Torre de dados de mesa para jogos de RPG com rampa interna helicoidal e bandeja de retenção frontal',
    category: 'gadget',
    description: 'Torre compacta com defletores internos para rolagem perfeita de dados.',
  },
];

/**
 * Builds 3D BufferGeometry from AI Blueprint specification
 */
export function buildGeometryFromAIBlueprint(blueprint: AIModelBlueprint, scale = 1.0): THREE.BufferGeometry {
  const geometries: THREE.BufferGeometry[] = [];

  if (!blueprint || !blueprint.components || blueprint.components.length === 0) {
    return generateFallbackPhoneStand(scale);
  }

  for (const comp of blueprint.components) {
    const geo = createPrimitiveGeometry(comp, scale);
    if (geo) {
      geometries.push(geo);
    }
  }

  if (geometries.length === 0) {
    return generateFallbackPhoneStand(scale);
  }

  const merged = mergeGeometries(geometries);
  merged.computeBoundingBox();
  if (merged.boundingBox) {
    // Ground to build plate (min.y = 0) and center on X/Z
    const min = merged.boundingBox.min;
    const max = merged.boundingBox.max;
    const centerX = (min.x + max.x) / 2;
    const centerZ = (min.z + max.z) / 2;
    const minY = min.y;
    merged.translate(-centerX, -minY, -centerZ);
  }

  return merged;
}

function createPrimitiveGeometry(comp: AIModelComponent, globalScale: number): THREE.BufferGeometry | null {
  const dim = comp.dimensions || {};
  const [px, py, pz] = comp.position || [0, 0, 0];
  const [rxDeg, ryDeg, rzDeg] = comp.rotation || [0, 0, 0];

  let geo: THREE.BufferGeometry | null = null;
  const compType = (comp.type || 'box').toLowerCase();

  switch (compType) {
    case 'box': {
      const w = Math.max(1, (dim.width || 20) * globalScale);
      const h = Math.max(1, (dim.height || 20) * globalScale);
      const d = Math.max(1, (dim.depth || 20) * globalScale);
      geo = new THREE.BoxGeometry(w, h, d);
      break;
    }
    case 'cylinder': {
      const rt = Math.max(0.5, (dim.radiusTop !== undefined ? dim.radiusTop : (dim.radius || 10)) * globalScale);
      const rb = Math.max(0.5, (dim.radiusBottom !== undefined ? dim.radiusBottom : (dim.radius || 10)) * globalScale);
      const h = Math.max(1, (dim.height || 20) * globalScale);
      const segs = Math.max(12, Math.min(64, dim.radialSegments || 32));
      geo = new THREE.CylinderGeometry(rt, rb, h, segs);
      break;
    }
    case 'cone': {
      const r = Math.max(0.5, (dim.radius || 12) * globalScale);
      const h = Math.max(1, (dim.height || 25) * globalScale);
      geo = new THREE.ConeGeometry(r, h, 32);
      break;
    }
    case 'sphere': {
      const r = Math.max(1, (dim.radius || 15) * globalScale);
      geo = new THREE.SphereGeometry(r, 24, 24);
      break;
    }
    case 'torus': {
      const r = Math.max(2, (dim.radius || 15) * globalScale);
      const tube = Math.max(0.5, (dim.tube || 3) * globalScale);
      geo = new THREE.TorusGeometry(r, tube, 16, 32);
      break;
    }
    case 'hex-prism': {
      const r = Math.max(1, (dim.radius || 15) * globalScale);
      const h = Math.max(1, (dim.height || 30) * globalScale);
      geo = new THREE.CylinderGeometry(r, r, h, 6);
      break;
    }
    case 'tube':
    case 'ring': {
      const outerR = Math.max(2, (dim.radius || (dim.width ? dim.width / 2 : 15)) * globalScale);
      const wallT = Math.max(0.8, (dim.wallThickness || 3) * globalScale);
      const innerR = Math.max(0.5, outerR - wallT);
      const h = Math.max(1, (dim.height || 20) * globalScale);
      
      const shape = new THREE.Shape();
      shape.absarc(0, 0, outerR, 0, Math.PI * 2, false);
      const holePath = new THREE.Path();
      holePath.absarc(0, 0, innerR, 0, Math.PI * 2, true);
      shape.holes.push(holePath);

      geo = new THREE.ExtrudeGeometry(shape, { depth: h, bevelEnabled: false });
      geo.rotateX(Math.PI / 2);
      geo.translate(0, h / 2, 0);
      break;
    }
    case 'wedge': {
      const w = Math.max(1, (dim.width || 30) * globalScale);
      const h = Math.max(1, (dim.height || 20) * globalScale);
      const d = Math.max(1, (dim.depth || 40) * globalScale);
      const shape = new THREE.Shape();
      shape.moveTo(-d / 2, 0);
      shape.lineTo(d / 2, 0);
      shape.lineTo(d / 2, h);
      shape.closePath();
      geo = new THREE.ExtrudeGeometry(shape, { depth: w, bevelEnabled: false });
      geo.rotateY(Math.PI / 2);
      geo.translate(-w / 2, 0, 0);
      break;
    }
    default: {
      const w = Math.max(1, (dim.width || 20) * globalScale);
      const h = Math.max(1, (dim.height || 20) * globalScale);
      const d = Math.max(1, (dim.depth || 20) * globalScale);
      geo = new THREE.BoxGeometry(w, h, d);
    }
  }

  if (geo) {
    if (rxDeg || ryDeg || rzDeg) {
      geo.rotateX((rxDeg * Math.PI) / 180);
      geo.rotateY((ryDeg * Math.PI) / 180);
      geo.rotateZ((rzDeg * Math.PI) / 180);
    }
    geo.translate(px * globalScale, py * globalScale, pz * globalScale);
  }

  return geo;
}

/**
 * Generates built-in fallback parametric models when offline or testing
 */
export function generateProceduralAIModel(params: AIModelParams): THREE.BufferGeometry {
  const prompt = (params.prompt || '').toLowerCase();
  const scale = params.scale || 1.0;

  if (prompt.includes('fone') || prompt.includes('headphone') || prompt.includes('headset')) {
    return generateHeadphoneHanger(scale);
  } else if (prompt.includes('organizador') || prompt.includes('hexagonal') || prompt.includes('gaveta') || prompt.includes('caixa')) {
    return generateHexOrganizer(scale);
  } else if (prompt.includes('trofeu') || prompt.includes('troféu') || prompt.includes('premio') || prompt.includes('escultura')) {
    return generateGeometricTrophy(scale);
  } else if (prompt.includes('pote') || prompt.includes('rosca') || prompt.includes('recipiente')) {
    return generateScrewContainer(scale);
  } else if (prompt.includes('dado') || prompt.includes('torre') || prompt.includes('rpg')) {
    return generateDiceTower(scale);
  }

  // Default: Ergonomic Phone & Tablet Stand
  return generateFallbackPhoneStand(scale);
}

function generateFallbackPhoneStand(scale = 1.0): THREE.BufferGeometry {
  const geos: THREE.BufferGeometry[] = [];

  // Base Plate
  const baseW = 70 * scale;
  const baseD = 85 * scale;
  const baseH = 5 * scale;
  const baseGeo = new THREE.BoxGeometry(baseW, baseH, baseD);
  baseGeo.translate(0, baseH / 2, 0);
  geos.push(baseGeo);

  // Slanted Backrest (65 degrees)
  const backW = 66 * scale;
  const backH = 80 * scale;
  const backT = 4.5 * scale;
  const angle = (65 * Math.PI) / 180;

  const backGeo = new THREE.BoxGeometry(backW, backH, backT);
  backGeo.rotateX(Math.PI / 2 - angle);
  backGeo.translate(0, (backH / 2) * Math.sin(angle) + baseH, -10 * scale);
  geos.push(backGeo);

  // Front Lip Support Pegs
  const lipW = 16 * scale;
  const lipH = 18 * scale;
  const lipT = 6 * scale;

  const lipLeft = new THREE.BoxGeometry(lipW, lipH, lipT);
  lipLeft.translate(-baseW * 0.3, lipH / 2 + baseH, baseD * 0.32);

  const lipRight = new THREE.BoxGeometry(lipW, lipH, lipT);
  lipRight.translate(baseW * 0.3, lipH / 2 + baseH, baseD * 0.32);

  geos.push(lipLeft, lipRight);

  return mergeGeometries(geos);
}

function generateHexOrganizer(scale = 1.0): THREE.BufferGeometry {
  const geos: THREE.BufferGeometry[] = [];
  const r = 24 * scale;
  const wallT = 2.5 * scale;
  const heights = [70 * scale, 50 * scale, 35 * scale];
  const centers: [number, number][] = [
    [0, 0],
    [r * 1.55, r * 0.9],
    [-r * 1.55, r * 0.9],
  ];

  for (let i = 0; i < 3; i++) {
    const h = heights[i];
    const [cx, cz] = centers[i];

    // Hex Outer
    const outerGeo = new THREE.CylinderGeometry(r, r, h, 6);
    outerGeo.translate(cx, h / 2, cz);

    // Bottom Base plate
    const basePlate = new THREE.CylinderGeometry(r, r, 3 * scale, 6);
    basePlate.translate(cx, 1.5 * scale, cz);

    geos.push(outerGeo);
  }

  return mergeGeometries(geos);
}

function generateHeadphoneHanger(scale = 1.0): THREE.BufferGeometry {
  const geos: THREE.BufferGeometry[] = [];

  // Table Clamp Top Bracket
  const topBracket = new THREE.BoxGeometry(45 * scale, 6 * scale, 60 * scale);
  topBracket.translate(0, 75 * scale, 0);
  geos.push(topBracket);

  // Vertical Spine
  const spine = new THREE.BoxGeometry(45 * scale, 80 * scale, 8 * scale);
  spine.translate(0, 38 * scale, -26 * scale);
  geos.push(spine);

  // Headset Curved Cradle Arm
  const cradleShape = new THREE.Shape();
  cradleShape.absarc(0, 0, 35 * scale, 0, Math.PI, false);
  const cradleGeo = new THREE.ExtrudeGeometry(cradleShape, { depth: 40 * scale, bevelEnabled: true, bevelSize: 1 });
  cradleGeo.rotateY(Math.PI / 2);
  cradleGeo.translate(-20 * scale, 0, 10 * scale);
  geos.push(cradleGeo);

  return mergeGeometries(geos);
}

function generateGeometricTrophy(scale = 1.0): THREE.BufferGeometry {
  const geos: THREE.BufferGeometry[] = [];

  // Heavy Pedestal Base
  const base1 = new THREE.BoxGeometry(70 * scale, 8 * scale, 70 * scale);
  base1.translate(0, 4 * scale, 0);
  const base2 = new THREE.BoxGeometry(56 * scale, 6 * scale, 56 * scale);
  base2.translate(0, 11 * scale, 0);
  geos.push(base1, base2);

  // Faceted Spiral Tower
  const layers = 10;
  const hPerLayer = 8 * scale;
  for (let l = 0; l < layers; l++) {
    const frac = l / layers;
    const layerR = (22 - frac * 12) * scale;
    const twist = (l * 12 * Math.PI) / 180;

    const layerGeo = new THREE.CylinderGeometry(layerR * 0.92, layerR, hPerLayer, 6);
    layerGeo.rotateY(twist);
    layerGeo.translate(0, 14 * scale + l * hPerLayer + hPerLayer / 2, 0);
    geos.push(layerGeo);
  }

  // Top Gem Star
  const gemGeo = new THREE.OctahedronGeometry(12 * scale);
  gemGeo.translate(0, 14 * scale + layers * hPerLayer + 12 * scale, 0);
  geos.push(gemGeo);

  return mergeGeometries(geos);
}

function generateScrewContainer(scale = 1.0): THREE.BufferGeometry {
  const geos: THREE.BufferGeometry[] = [];
  const r = 30 * scale;
  const h = 50 * scale;

  // Outer Knurled Jar Body
  const jarGeo = new THREE.CylinderGeometry(r, r, h, 36);
  jarGeo.translate(0, h / 2, 0);
  geos.push(jarGeo);

  // Top Thread Lip
  const threadGeo = new THREE.CylinderGeometry(r * 0.88, r * 0.88, 12 * scale, 36);
  threadGeo.translate(0, h + 6 * scale, 0);
  geos.push(threadGeo);

  return mergeGeometries(geos);
}

function generateDiceTower(scale = 1.0): THREE.BufferGeometry {
  const geos: THREE.BufferGeometry[] = [];
  const w = 55 * scale;
  const d = 55 * scale;
  const h = 110 * scale;

  // Main Tower Body
  const tower = new THREE.BoxGeometry(w, h, d);
  tower.translate(0, h / 2, 0);
  geos.push(tower);

  // Front Dice Catch Tray
  const trayW = w;
  const trayD = 65 * scale;
  const trayH = 18 * scale;
  const tray = new THREE.BoxGeometry(trayW, trayH, trayD);
  tray.translate(0, trayH / 2, d / 2 + trayD / 2 - 4 * scale);
  geos.push(tray);

  return mergeGeometries(geos);
}
