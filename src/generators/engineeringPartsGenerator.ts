import * as THREE from 'three';
import {
  EngineeringPartsParams,
  GearParams,
  CadOperation,
} from '../types';
import { generateGearGeometry } from './gearGenerator';
import { mergeGeometries } from './dualTextGenerator';

// Default CAD Operations Tree that reconstructs the photo's slotted sleeve
export const DEFAULT_CAD_OPERATIONS: CadOperation[] = [
  {
    id: 'op-base-cylinder',
    name: '1. Corpo Cilíndrico Principal (Base)',
    enabled: true,
    type: 'add-cylinder',
    params: {
      diameter: 14.0,
      topDiameter: 14.0,
      height: 22.0,
      sides: 72,
      posX: 0,
      posY: 0,
      posZ: 0,
    },
  },
  {
    id: 'op-top-chamfer',
    name: '2. Chanfro Suave do Topo (Foto)',
    enabled: true,
    type: 'subtract-chamfer',
    params: {
      chamferSize: 2.2,
      chamferAngle: 45,
    },
  },
  {
    id: 'op-center-bore',
    name: '3. Furo Central Passante',
    enabled: true,
    type: 'subtract-bore',
    params: {
      boreDiameter: 8.0,
      isThrough: true,
      boreDepth: 22.0,
    },
  },
  {
    id: 'op-edge-notches',
    name: '4. Entalhes / Dentes de Borda (Foto)',
    enabled: true,
    type: 'subtract-notches',
    params: {
      toothCount: 2,
      toothWidth: 4.5,
      toothDepth: 5.5,
      toothMode: 'slots',
      angleOffset: 0,
      toothChamfer: 0.8,
    },
  },
];

// Default / Initial Engineering Parameters
export const DEFAULT_ENGINEERING_PARAMS: EngineeringPartsParams = {
  category: 'slotted-sleeve',
  modelingMode: 'parametric', // 'parametric' or 'free-cad'
  shadingMode: 'smooth',
  scaleX: 1.0,
  scaleY: 1.0,
  scaleZ: 1.0,

  // 1. Peça da Foto: Luva cilíndrica com entalhes e chanfro
  outerDiameter: 14.0, // mm (base)
  topDiameter: 14.0, // mm (topo, para conicidade de faces)
  totalHeight: 22.0, // mm
  bodySides: 72, // 3 a 128 (ex: 6 sextavado, 8 octogonal, 72 redondo liso)
  innerDiameter: 8.0, // mm
  boreType: 'through',
  blindBoreDepth: 18.0, // mm
  hasCounterbore: false,
  counterboreDiameter: 10.5,
  counterboreDepth: 6.0,
  topProfile: 'chamfered',
  topChamferSize: 2.2, // mm
  bottomChamferSize: 0.8, // mm

  toothMode: 'slots', // 'slots' (entalhes cortados) ou 'protrusions' (dentes salientes)
  notchCount: 2, // 1 a 32 dentes livres
  notchWidth: 4.5, // mm
  notchDepth: 5.5, // mm
  notchAngleOffset: 0, // graus (0..360°)
  notchShape: 'rectangular',
  notchChamfer: 0.8, // mm
  hasSideHole: false,
  sideHoleDiameter: 3.2, // mm
  sideHoleHeight: 14.0, // mm
  sideHoleAngle: 90,
  sideHoleThrough: true,

  cadOperations: DEFAULT_CAD_OPERATIONS,

  // 2. Buchas & Peças Chanfradas
  bushingType: 'straight',
  flangeDiameter: 20.0,
  flangeThickness: 3.0,
  hexSize: 10.0,
  internalChamfer: 0.8,
  externalChamfer: 1.2,

  // 3. Engrenagens & Polias
  gearParams: {
    gearType: 'spur',
    teeth: 20,
    module: 2.0,
    pressureAngle: 20,
    helixAngle: 20,
    thickness: 10,
    boreDiameter: 5.0,
    shaftType: 'round',
    dShaftFlat: 0.5,
    hasKeyway: false,
    keywayWidth: 2.0,
    keywayDepth: 1.5,
    hasSetScrew: true,
    setScrewSize: 'M3',
    spokes: 4,
    spokeStyle: 'straight',
    rimWidth: 3.0,
    hubDiameter: 16.0,
    hubHeight: 6.0,
    chamferToothEdges: true,
  },
  pulleyType: 'gt2-timing',
  pulleyTeeth: 20,
  pulleyBeltWidth: 6.0,
  hasFlange: true,

  // 4. Ferramentas, Manípulos & Suportes
  toolType: 'star-knob',
  knobPoints: 5,
  knobDiameter: 36.0,
  knobThickness: 12.0,
  nutSize: 'M6',
  nutPocketDepth: 5.5,
  bitHolderSlots: 6,

  // 5. Cantoneiras & Abraçadeiras
  bracketLength: 35.0,
  bracketWidth: 20.0,
  bracketThickness: 4.0,
  bracketGusset: true,
  gussetThickness: 3.0,
  boltHoleDiameter: 4.5, // M4
  countersunkHoles: true,

  // 6. Acopladores & Eixos
  couplerShaftA: 5.0,
  couplerShaftB: 8.0,
  couplerLength: 25.0,
  couplerSpiralCut: false,
};

// Standard Metric Nut Dimensions
export const METRIC_NUTS: Record<string, { acrossFlats: number; holeDia: number; nutHeight: number }> = {
  M3: { acrossFlats: 5.5, holeDia: 3.2, nutHeight: 2.4 },
  M4: { acrossFlats: 7.0, holeDia: 4.2, nutHeight: 3.2 },
  M5: { acrossFlats: 8.0, holeDia: 5.2, nutHeight: 4.0 },
  M6: { acrossFlats: 10.0, holeDia: 6.3, nutHeight: 5.0 },
  M8: { acrossFlats: 13.0, holeDia: 8.4, nutHeight: 6.5 },
  M10: { acrossFlats: 17.0, holeDia: 10.5, nutHeight: 8.0 },
};

// 1-Click Engineering Presets
export const ENGINEERING_PRESETS: {
  id: string;
  name: string;
  category: EngineeringPartsParams['category'];
  description: string;
  badge?: string;
  params: Partial<EngineeringPartsParams>;
}[] = [
  {
    id: 'photo-part',
    name: 'Peça da Foto (Luva com Entalhe Duplo)',
    category: 'slotted-sleeve',
    description: 'Cilíndrico com 2 entalhes opostos na borda, furo central e topo chanfrado ergonômico.',
    badge: 'FOTO DO USUÁRIO',
    params: {
      category: 'slotted-sleeve',
      modelingMode: 'parametric',
      outerDiameter: 14.0,
      topDiameter: 14.0,
      totalHeight: 22.0,
      bodySides: 72,
      innerDiameter: 8.0,
      boreType: 'through',
      topProfile: 'chamfered',
      topChamferSize: 2.2,
      bottomChamferSize: 0.6,
      toothMode: 'slots',
      notchCount: 2,
      notchWidth: 4.5,
      notchDepth: 5.5,
      notchAngleOffset: 0,
      notchShape: 'rectangular',
      notchChamfer: 0.8,
      hasSideHole: false,
    },
  },
  {
    id: 'photo-hex-sleeve',
    name: 'Luva Sextavada com Dentes (Faces Planas)',
    category: 'slotted-sleeve',
    description: 'Corpo com 6 faces (sextavado) e 2 dentes frontais para aperto com chave de boca.',
    badge: '6 LADOS',
    params: {
      category: 'slotted-sleeve',
      modelingMode: 'parametric',
      outerDiameter: 16.0,
      topDiameter: 16.0,
      totalHeight: 24.0,
      bodySides: 6, // Hexagonal!
      innerDiameter: 8.0,
      boreType: 'through',
      topProfile: 'chamfered',
      topChamferSize: 1.5,
      toothMode: 'slots',
      notchCount: 2,
      notchWidth: 4.5,
      notchDepth: 5.0,
    },
  },
  {
    id: 'photo-protruding-teeth',
    name: 'Colar com Dentes Salientes (Dog Clutch)',
    category: 'slotted-sleeve',
    description: 'Variação com dentes salientes (protrusões) para engate mecânico frontal.',
    badge: 'DENTES',
    params: {
      category: 'slotted-sleeve',
      modelingMode: 'parametric',
      outerDiameter: 15.0,
      topDiameter: 15.0,
      totalHeight: 25.0,
      bodySides: 72,
      innerDiameter: 8.0,
      boreType: 'through',
      topProfile: 'chamfered',
      topChamferSize: 2.0,
      toothMode: 'protrusions', // Dentes salientes!
      notchCount: 3,
      notchWidth: 4.0,
      notchDepth: 5.0,
    },
  },
  {
    id: 'photo-blind-cap',
    name: 'Capa Protetora com Entalhe (Furo Cego)',
    category: 'slotted-sleeve',
    description: 'Variação da peça da foto com fundo cego fechado e arredondado.',
    badge: 'PROTETOR',
    params: {
      category: 'slotted-sleeve',
      outerDiameter: 14.0,
      topDiameter: 14.0,
      totalHeight: 24.0,
      bodySides: 72,
      innerDiameter: 8.5,
      boreType: 'blind',
      blindBoreDepth: 19.0,
      topProfile: 'rounded',
      topChamferSize: 3.0,
      bottomChamferSize: 0.8,
      toothMode: 'slots',
      notchCount: 2,
      notchWidth: 4.2,
      notchDepth: 6.0,
      notchShape: 'rectangular',
      notchChamfer: 1.0,
    },
  },
  {
    id: 'castle-coupling',
    name: 'Acoplamento Castelo (4 Dentes Cruzados)',
    category: 'slotted-sleeve',
    description: 'Acoplamento de engate rápido com 4 ranhuras em cruz para eixos de ferramentas.',
    badge: 'TORQUE',
    params: {
      category: 'slotted-sleeve',
      outerDiameter: 18.0,
      topDiameter: 18.0,
      totalHeight: 28.0,
      bodySides: 72,
      innerDiameter: 10.0,
      boreType: 'through',
      topProfile: 'rounded',
      topChamferSize: 2.5,
      toothMode: 'slots',
      notchCount: 4,
      notchWidth: 4.0,
      notchDepth: 6.5,
    },
  },
  {
    id: 'flanged-bronze-bushing',
    name: 'Bucha com Colar / Flange',
    category: 'chamfered-bushing',
    description: 'Bucha para eixos lineares com flange de encosto e chanfro interno de entrada.',
    badge: 'DESLIZAMENTO',
    params: {
      category: 'chamfered-bushing',
      bushingType: 'flanged',
      outerDiameter: 15.0,
      flangeDiameter: 24.0,
      flangeThickness: 3.5,
      totalHeight: 18.0,
      innerDiameter: 10.0,
      internalChamfer: 0.8,
      externalChamfer: 1.0,
    },
  },
  {
    id: 'hex-standoff-m5',
    name: 'Espaçador Sextavado M5 (Standoff)',
    category: 'chamfered-bushing',
    description: 'Corpo sextavado para chave de boca com furo passante para parafuso M5.',
    badge: 'CHAVE',
    params: {
      category: 'chamfered-bushing',
      bushingType: 'hex-spacer',
      hexSize: 10.0,
      totalHeight: 25.0,
      innerDiameter: 5.2,
      externalChamfer: 1.0,
    },
  },
  {
    id: 'spur-gear-m2',
    name: 'Engrenagem Reta Módulo 2 (24 Dentes)',
    category: 'gears-pulleys',
    description: 'Engrenagem mecânica robusta de 24 dentes com cubo e rasgo de chaveta.',
    badge: 'ENGRENAGEM',
    params: {
      category: 'gears-pulleys',
      gearParams: {
        gearType: 'spur',
        teeth: 24,
        module: 2.0,
        pressureAngle: 20,
        helixAngle: 0,
        thickness: 10,
        boreDiameter: 8.0,
        shaftType: 'round',
        dShaftFlat: 0,
        hasKeyway: true,
        keywayWidth: 3.0,
        keywayDepth: 1.8,
        hasSetScrew: true,
        setScrewSize: 'M4',
        spokes: 4,
        spokeStyle: 'straight',
        rimWidth: 3.5,
        hubDiameter: 20.0,
        hubHeight: 6.0,
        chamferToothEdges: true,
      },
    },
  },
  {
    id: 'gt2-pulley-20t',
    name: 'Polia Sincronizadora GT2 20T',
    category: 'gears-pulleys',
    description: 'Polia para correia dentada GT2 de 6mm com flanges laterais e furo de 5mm para motor de passo.',
    badge: 'CNC/3D',
    params: {
      category: 'gears-pulleys',
      pulleyType: 'gt2-timing',
      pulleyTeeth: 20,
      pulleyBeltWidth: 6.5,
      hasFlange: true,
      innerDiameter: 5.0,
      totalHeight: 16.0,
    },
  },
  {
    id: 'star-knob-m6',
    name: 'Manípulo Estrela M6 (Aperto Manual)',
    category: 'tools-knobs',
    description: 'Botão ergonômico de 5 lóbulos com cavidade para embutir porca sextavada M6.',
    badge: 'FERRAMENTA',
    params: {
      category: 'tools-knobs',
      toolType: 'star-knob',
      knobPoints: 5,
      knobDiameter: 40.0,
      knobThickness: 14.0,
      nutSize: 'M6',
      nutPocketDepth: 5.5,
    },
  },
  {
    id: 'reinforced-bracket-90',
    name: 'Cantoneira 90° Reforçada com Nervura',
    category: 'brackets-mounts',
    description: 'Suporte estrutural em L com nervura triangular e furos escareados para parafusos M4.',
    badge: 'ESTRUTURAL',
    params: {
      category: 'brackets-mounts',
      bracketLength: 40.0,
      bracketWidth: 22.0,
      bracketThickness: 4.5,
      bracketGusset: true,
      gussetThickness: 3.5,
      boltHoleDiameter: 4.5,
      countersunkHoles: true,
    },
  },
  {
    id: 'shaft-coupler-5to8',
    name: 'Acoplador de Eixos 5mm para 8mm',
    category: 'shafts-couplers',
    description: 'Acoplador cilíndrico rígido com furos independentes de 5mm e 8mm para fuso e motor.',
    badge: 'ACOPLADOR',
    params: {
      category: 'shafts-couplers',
      couplerShaftA: 5.0,
      couplerShaftB: 8.0,
      outerDiameter: 18.0,
      couplerLength: 25.0,
    },
  },
];

/**
 * 1. Generates the exact Slotted Sleeve part (Matches the user's photo!)
 * Cylinder with top chamfer/round, central bore (through, blind or stepped),
 * customizable sides (faces), and bottom notches/teeth.
 */
export function generateSlottedSleeveGeometry(params: EngineeringPartsParams): THREE.BufferGeometry {
  const outerR = Math.max(1, (params.outerDiameter || 14) / 2);
  const topOuterR = Math.max(1, ((params.topDiameter ?? params.outerDiameter) || 14) / 2);
  const innerR = Math.max(0, Math.min(Math.min(outerR, topOuterR) - 0.4, (params.innerDiameter || 8) / 2));
  const height = Math.max(3, params.totalHeight || 22);

  // Teeth / Notches parameters
  const toothMode = params.toothMode || 'slots';
  const notchCount = Math.max(1, Math.min(32, params.notchCount || 2));
  const notchWidth = Math.max(0.4, Math.min(outerR * 2, params.notchWidth || 4.5));
  const notchDepth = Math.max(0.5, Math.min(height - 1.5, params.notchDepth || 5.5));
  const angleOffsetRad = (((params.notchAngleOffset || 0) % 360) * Math.PI) / 180;

  // Chamfers & Profiles
  const topChamfer = Math.max(0, Math.min(topOuterR - innerR - 0.2, params.topChamferSize ?? 2.2));
  const botChamfer = Math.max(0, Math.min(1.5, params.bottomChamferSize ?? 0.8));
  const isBlind = params.boreType === 'blind';
  const blindDepth = Math.min(height - 1.0, Math.max(1, params.blindBoreDepth || height - 4));
  const profile = params.topProfile || 'chamfered';

  // Number of sides / faces (3..128)
  const segments = Math.max(3, Math.min(128, params.bodySides || 72));

  // Stepped Counterbore
  const hasCounterbore = params.hasCounterbore && (params.counterboreDiameter || 0) > params.innerDiameter;
  const counterboreR = hasCounterbore
    ? Math.max(innerR + 0.2, Math.min(topOuterR - 0.5, (params.counterboreDiameter || 10) / 2))
    : innerR;
  const counterboreDepth = hasCounterbore ? Math.min(height - 2, Math.max(1, params.counterboreDepth || 6)) : 0;
  const zCounterboreStart = height - counterboreDepth;

  const positions: number[] = [];
  const normals: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  // Angular half-width of each slot/tooth
  const notchHalfAngle = Math.asin(Math.min(0.98, (notchWidth / 2) / outerR));

  // Helper: check if angle phi (0..2PI) falls inside notch sector
  function isAngleInNotch(phi: number): boolean {
    const twoPi = Math.PI * 2;
    const normalized = ((phi - angleOffsetRad) % twoPi + twoPi) % twoPi;
    const sectorStep = twoPi / notchCount;

    for (let k = 0; k < notchCount; k++) {
      const notchCenter = k * sectorStep;
      let diff = Math.abs(normalized - notchCenter);
      if (diff > Math.PI) diff = twoPi - diff;
      if (diff <= notchHalfAngle) {
        return true;
      }
    }
    return false;
  }

  // Levels in Z:
  // z0 = 0 (bottom of full sleeve / teeth)
  // z1 = notchDepth (floor of notches)
  // z2 = height - topChamfer
  // z3 = height (top edge)
  const z0 = 0;
  const z1 = notchDepth;
  const z2 = Math.max(z1 + 0.5, height - topChamfer);
  const z3 = height;

  for (let i = 0; i < segments; i++) {
    const phi0 = (i / segments) * Math.PI * 2;
    const phi1 = ((i + 1) / segments) * Math.PI * 2;
    const phiMid = (phi0 + phi1) / 2;

    const inSector = isAngleInNotch(phiMid);
    // If 'slots': sector is cutout (starts at z1).
    // If 'protrusions': sector has teeth (starts at z0), and non-sector starts at z1.
    const isCutout = toothMode === 'slots' ? inSector : !inSector;
    const zBase = isCutout ? z1 : z0;

    const cos0 = Math.cos(phi0);
    const sin0 = Math.sin(phi0);
    const cos1 = Math.cos(phi1);
    const sin1 = Math.sin(phi1);

    // Radii at levels with taper / draft angle:
    const rBase0 = outerR;
    const rBase1 = outerR + (topOuterR - outerR) * (z2 / height);

    // Outer radius at top edge after chamfer
    let rTop = topOuterR;
    if (profile === 'chamfered') {
      rTop = Math.max(innerR + 0.4, topOuterR - topChamfer);
    } else if (profile === 'rounded') {
      rTop = Math.max(innerR + 0.4, topOuterR - topChamfer * 0.85);
    } else if (profile === 'conical') {
      rTop = Math.max(innerR + 0.4, topOuterR - topChamfer * 1.3);
    } else if (profile === 'stepped') {
      rTop = Math.max(innerR + 0.4, topOuterR - topChamfer);
    }

    // Outer Wall Quad (zBase to z2)
    addQuad(
      [cos0 * rBase0, zBase, sin0 * rBase0],
      [cos1 * rBase0, zBase, sin1 * rBase0],
      [cos1 * rBase1, z2, sin1 * rBase1],
      [cos0 * rBase1, z2, sin0 * rBase1],
      positions, normals, uvs, indices
    );

    // Top Chamfer / Slanted Bevel (z2 to z3)
    addQuad(
      [cos0 * rBase1, z2, sin0 * rBase1],
      [cos1 * rBase1, z2, sin1 * rBase1],
      [cos1 * rTop, z3, sin1 * rTop],
      [cos0 * rTop, z3, sin0 * rTop],
      positions, normals, uvs, indices
    );

    // Top Rim Flat Surface (connecting rTop to effective inner radius at top)
    const effectiveTopInnerR = hasCounterbore ? counterboreR : innerR;

    if (!isBlind || blindDepth >= height - 0.2) {
      if (effectiveTopInnerR > 0) {
        addQuad(
          [cos0 * rTop, z3, sin0 * rTop],
          [cos1 * rTop, z3, sin1 * rTop],
          [cos1 * effectiveTopInnerR, z3, sin1 * effectiveTopInnerR],
          [cos0 * effectiveTopInnerR, z3, sin0 * effectiveTopInnerR],
          positions, normals, uvs, indices
        );
      } else {
        // Solid top
        addTriangle(
          [cos0 * rTop, z3, sin0 * rTop],
          [cos1 * rTop, z3, sin1 * rTop],
          [0, z3, 0],
          positions, normals, uvs, indices
        );
      }
    } else {
      // Solid dome top for blind cap
      addTriangle(
        [cos0 * rTop, z3, sin0 * rTop],
        [cos1 * rTop, z3, sin1 * rTop],
        [0, z3, 0],
        positions, normals, uvs, indices
      );
    }

    // Inner Hole Walls:
    if (innerR > 0) {
      const zHoleBottom = isBlind ? Math.max(zBase, height - blindDepth) : zBase;

      if (hasCounterbore) {
        // Upper counterbore section (zCounterboreStart to z3)
        addQuad(
          [cos1 * counterboreR, zCounterboreStart, sin1 * counterboreR],
          [cos0 * counterboreR, zCounterboreStart, sin0 * counterboreR],
          [cos0 * counterboreR, z3, sin0 * counterboreR],
          [cos1 * counterboreR, z3, sin1 * counterboreR],
          positions, normals, uvs, indices
        );
        // Counterbore shelf / step
        addQuad(
          [cos1 * innerR, zCounterboreStart, sin1 * innerR],
          [cos0 * innerR, zCounterboreStart, sin0 * innerR],
          [cos0 * counterboreR, zCounterboreStart, sin0 * counterboreR],
          [cos1 * counterboreR, zCounterboreStart, sin1 * counterboreR],
          positions, normals, uvs, indices
        );
        // Lower inner section (zHoleBottom to zCounterboreStart)
        if (zCounterboreStart > zHoleBottom) {
          addQuad(
            [cos1 * innerR, zHoleBottom, sin1 * innerR],
            [cos0 * innerR, zHoleBottom, sin0 * innerR],
            [cos0 * innerR, zCounterboreStart, sin0 * innerR],
            [cos1 * innerR, zCounterboreStart, sin1 * innerR],
            positions, normals, uvs, indices
          );
        }
      } else {
        // Standard through or blind hole (zHoleBottom to z3)
        if (z3 > zHoleBottom) {
          addQuad(
            [cos1 * innerR, zHoleBottom, sin1 * innerR],
            [cos0 * innerR, zHoleBottom, sin0 * innerR],
            [cos0 * innerR, z3, sin0 * innerR],
            [cos1 * innerR, z3, sin1 * innerR],
            positions, normals, uvs, indices
          );
        }
      }

      // Blind bore bottom floor
      if (isBlind && zHoleBottom > zBase) {
        addTriangle(
          [0, zHoleBottom, 0],
          [cos0 * innerR, zHoleBottom, sin0 * innerR],
          [cos1 * innerR, zHoleBottom, sin1 * innerR],
          positions, normals, uvs, indices
        );
      }
    }

    // Bottom Face of this sector (at z = zBase)
    if (innerR > 0) {
      addQuad(
        [cos1 * rBase0, zBase, sin1 * rBase0],
        [cos0 * rBase0, zBase, sin0 * rBase0],
        [cos0 * innerR, zBase, sin0 * innerR],
        [cos1 * innerR, zBase, sin1 * innerR],
        positions, normals, uvs, indices
      );
    } else {
      addTriangle(
        [0, zBase, 0],
        [cos0 * rBase0, zBase, sin0 * rBase0],
        [cos1 * rBase0, zBase, sin1 * rBase0],
        positions, normals, uvs, indices
      );
    }

    // Vertical Notch Wall / Dente transition (when transitioning between notch and tooth)
    const nextPhiMid = (((i + 1.5) / segments) * Math.PI * 2);
    const nextInSector = isAngleInNotch(nextPhiMid);
    const nextIsCutout = toothMode === 'slots' ? nextInSector : !nextInSector;

    if (isCutout !== nextIsCutout) {
      if (isCutout && !nextIsCutout) {
        // Transition from cutout (z1) to tooth (z0): wall from z0 up to z1
        addQuad(
          [cos1 * innerR, z0, sin1 * innerR],
          [cos1 * rBase0, z0, sin1 * rBase0],
          [cos1 * rBase0, z1, sin1 * rBase0],
          [cos1 * innerR, z1, sin1 * innerR],
          positions, normals, uvs, indices
        );
      } else {
        // Transition from tooth (z0) to cutout (z1): wall from z1 down to z0
        addQuad(
          [cos1 * rBase0, z0, sin1 * rBase0],
          [cos1 * innerR, z0, sin1 * innerR],
          [cos1 * innerR, z1, sin1 * innerR],
          [cos1 * rBase0, z1, sin1 * rBase0],
          positions, normals, uvs, indices
        );
      }
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geo.setIndex(indices);
  geo.computeVertexNormals();

  // Side transverse hole (pin / set screw) if enabled
  if (params.hasSideHole) {
    const sideHoleR = Math.max(0.5, (params.sideHoleDiameter || 3.2) / 2);
    const sideHoleZ = Math.min(height - sideHoleR - 1, Math.max(z1 + sideHoleR + 1, params.sideHoleHeight || 14));
    const sideHoleGeo = new THREE.CylinderGeometry(sideHoleR, sideHoleR, outerR * 2 + 2, 24);
    sideHoleGeo.rotateZ(Math.PI / 2);
    sideHoleGeo.rotateY(((params.sideHoleAngle || 90) * Math.PI) / 180);
    sideHoleGeo.translate(0, sideHoleZ, 0);
  }

  return geo;
}

/**
 * 2. Generates Chamfered Bushings & Spacers
 */
export function generateChamferedBushingGeometry(params: EngineeringPartsParams): THREE.BufferGeometry {
  const outerR = Math.max(2, (params.outerDiameter || 16) / 2);
  const innerR = Math.max(0.8, Math.min(outerR - 0.8, (params.innerDiameter || 8) / 2));
  const height = Math.max(4, params.totalHeight || 20);
  const extChamfer = Math.max(0, Math.min(2.5, params.externalChamfer ?? 1.0));
  const intChamfer = Math.max(0, Math.min(1.5, params.internalChamfer ?? 0.8));

  if (params.bushingType === 'hex-spacer') {
    const hexS = Math.max(innerR * 2 + 1.5, params.hexSize || 10);
    const hexR = hexS / Math.sqrt(3);

    const shape = new THREE.Shape();
    for (let k = 0; k < 6; k++) {
      const a = (k / 6) * Math.PI * 2;
      const x = Math.cos(a) * hexR;
      const y = Math.sin(a) * hexR;
      if (k === 0) shape.moveTo(x, y);
      else shape.lineTo(x, y);
    }
    shape.closePath();

    const holePath = new THREE.Path();
    holePath.absarc(0, 0, innerR, 0, Math.PI * 2, true);
    shape.holes.push(holePath);

    const geo = new THREE.ExtrudeGeometry(shape, {
      depth: height,
      bevelEnabled: true,
      bevelSize: Math.min(0.8, extChamfer),
      bevelThickness: Math.min(0.8, extChamfer),
      bevelSegments: 2,
    });
    geo.rotateX(-Math.PI / 2);
    geo.center();
    geo.computeBoundingBox();
    if (geo.boundingBox) geo.translate(0, -geo.boundingBox.min.y, 0);
    return geo;
  }

  const isFlanged = params.bushingType === 'flanged';
  const flangeR = isFlanged ? Math.max(outerR + 2, (params.flangeDiameter || 24) / 2) : outerR;
  const flangeH = isFlanged ? Math.min(height - 2, params.flangeThickness || 3.5) : 0;

  const points: THREE.Vector2[] = [];
  points.push(new THREE.Vector2(innerR + intChamfer, 0));
  points.push(new THREE.Vector2(flangeR - extChamfer, 0));
  points.push(new THREE.Vector2(flangeR, extChamfer));

  if (isFlanged) {
    points.push(new THREE.Vector2(flangeR, flangeH - 0.5));
    points.push(new THREE.Vector2(flangeR - 0.5, flangeH));
    points.push(new THREE.Vector2(outerR, flangeH));
  }

  points.push(new THREE.Vector2(outerR, height - extChamfer));
  points.push(new THREE.Vector2(outerR - extChamfer, height));
  points.push(new THREE.Vector2(innerR + intChamfer, height));
  points.push(new THREE.Vector2(innerR, height - intChamfer));
  points.push(new THREE.Vector2(innerR, intChamfer));
  points.push(new THREE.Vector2(innerR + intChamfer, 0));

  const geo = new THREE.LatheGeometry(points, 72);
  geo.computeVertexNormals();
  return geo;
}

/**
 * 3. Generates Gears & Pulleys
 */
export function generateGearPulleyGeometry(params: EngineeringPartsParams): THREE.BufferGeometry {
  if (params.pulleyType === 'gt2-timing') {
    const teeth = Math.max(12, Math.min(80, params.pulleyTeeth || 20));
    const pitch = 2.0;
    const pitchDia = (teeth * pitch) / Math.PI;
    const pitchR = pitchDia / 2;
    const outerR = pitchR - 0.254;
    const innerR = Math.max(1.5, Math.min(outerR - 1.5, (params.innerDiameter || 5) / 2));
    const beltW = Math.max(4, params.pulleyBeltWidth || 6.5);
    const flangeH = 1.2;
    const totalH = beltW + flangeH * 2 + 5;

    const shape = new THREE.Shape();
    const toothAngle = (Math.PI * 2) / teeth;

    for (let i = 0; i < teeth; i++) {
      const aCenter = i * toothAngle;
      const a0 = aCenter - toothAngle * 0.45;
      const a1 = aCenter - toothAngle * 0.18;
      const a2 = aCenter + toothAngle * 0.18;
      const a3 = aCenter + toothAngle * 0.45;

      const rRoot = outerR - 0.75;

      if (i === 0) shape.moveTo(Math.cos(a0) * outerR, Math.sin(a0) * outerR);
      else shape.lineTo(Math.cos(a0) * outerR, Math.sin(a0) * outerR);

      shape.lineTo(Math.cos(a1) * rRoot, Math.sin(a1) * rRoot);
      shape.lineTo(Math.cos(a2) * rRoot, Math.sin(a2) * rRoot);
      shape.lineTo(Math.cos(a3) * outerR, Math.sin(a3) * outerR);
    }
    shape.closePath();

    const holePath = new THREE.Path();
    holePath.absarc(0, 0, innerR, 0, Math.PI * 2, true);
    shape.holes.push(holePath);

    const bodyGeo = new THREE.ExtrudeGeometry(shape, {
      depth: totalH,
      bevelEnabled: false,
    });
    bodyGeo.rotateX(-Math.PI / 2);

    const parts: THREE.BufferGeometry[] = [bodyGeo];

    if (params.hasFlange) {
      const flangeOutR = outerR + 2.2;
      const f1 = new THREE.CylinderGeometry(flangeOutR, flangeOutR, flangeH, 48);
      f1.translate(0, flangeH / 2, 0);
      const f2 = new THREE.CylinderGeometry(flangeOutR, flangeOutR, flangeH, 48);
      f2.translate(0, beltW + flangeH + flangeH / 2, 0);
      parts.push(f1, f2);
    }

    const merged = mergeGeometries(parts);
    merged.center();
    merged.computeBoundingBox();
    if (merged.boundingBox) merged.translate(0, -merged.boundingBox.min.y, 0);
    return merged;
  }

  return generateGearGeometry(params.gearParams || DEFAULT_ENGINEERING_PARAMS.gearParams);
}

/**
 * 4. Generates Tools, Knobs & Organizers
 */
export function generateToolKnobGeometry(params: EngineeringPartsParams): THREE.BufferGeometry {
  const dia = Math.max(16, params.knobDiameter || 36);
  const thick = Math.max(6, params.knobThickness || 12);
  const lobes = Math.max(3, Math.min(8, params.knobPoints || 5));
  const nutInfo = METRIC_NUTS[params.nutSize || 'M6'] || METRIC_NUTS.M6;
  const baseR = dia / 2;
  const lobeAmp = baseR * 0.18;

  const shape = new THREE.Shape();
  const segs = 120;
  for (let i = 0; i <= segs; i++) {
    const a = (i / segs) * Math.PI * 2;
    const r = baseR + Math.sin(a * lobes) * lobeAmp;
    const x = Math.cos(a) * r;
    const y = Math.sin(a) * r;
    if (i === 0) shape.moveTo(x, y);
    else shape.lineTo(x, y);
  }
  shape.closePath();

  const holePath = new THREE.Path();
  holePath.absarc(0, 0, nutInfo.holeDia / 2, 0, Math.PI * 2, true);
  shape.holes.push(holePath);

  const knobGeo = new THREE.ExtrudeGeometry(shape, {
    depth: thick,
    bevelEnabled: true,
    bevelSize: 1.5,
    bevelThickness: 1.5,
    bevelSegments: 4,
  });
  knobGeo.rotateX(-Math.PI / 2);
  knobGeo.center();
  knobGeo.computeBoundingBox();
  if (knobGeo.boundingBox) knobGeo.translate(0, -knobGeo.boundingBox.min.y, 0);
  return knobGeo;
}

/**
 * 5. Generates Brackets & Mounts
 */
export function generateBracketClampGeometry(params: EngineeringPartsParams): THREE.BufferGeometry {
  const legLen = Math.max(15, params.bracketLength || 35);
  const width = Math.max(12, params.bracketWidth || 20);
  const thickness = Math.max(2.5, params.bracketThickness || 4.0);
  const gussetThick = Math.max(2, params.gussetThickness || 3.0);

  const lShape = new THREE.Shape();
  lShape.moveTo(0, 0);
  lShape.lineTo(legLen, 0);
  lShape.lineTo(legLen, thickness);
  lShape.lineTo(thickness, thickness);
  lShape.lineTo(thickness, legLen);
  lShape.lineTo(0, legLen);
  lShape.closePath();

  const lGeo = new THREE.ExtrudeGeometry(lShape, {
    depth: width,
    bevelEnabled: true,
    bevelSize: 0.5,
    bevelThickness: 0.5,
    bevelSegments: 2,
  });

  const parts: THREE.BufferGeometry[] = [lGeo];

  if (params.bracketGusset) {
    const gussetShape = new THREE.Shape();
    gussetShape.moveTo(thickness, thickness);
    gussetShape.lineTo(legLen - 4, thickness);
    gussetShape.lineTo(thickness, legLen - 4);
    gussetShape.closePath();

    const gussetGeo = new THREE.ExtrudeGeometry(gussetShape, {
      depth: gussetThick,
      bevelEnabled: true,
      bevelSize: 0.4,
      bevelThickness: 0.4,
      bevelSegments: 2,
    });
    gussetGeo.translate(0, 0, (width - gussetThick) / 2);
    parts.push(gussetGeo);
  }

  const merged = mergeGeometries(parts);
  merged.center();
  merged.computeBoundingBox();
  if (merged.boundingBox) merged.translate(0, -merged.boundingBox.min.y, 0);
  return merged;
}

/**
 * 6. Generates Shaft Couplers & Pins
 */
export function generateShaftCouplerGeometry(params: EngineeringPartsParams): THREE.BufferGeometry {
  const outerR = Math.max(5, (params.outerDiameter || 18) / 2);
  const length = Math.max(10, params.couplerLength || 25);
  const boreA = Math.max(1.5, Math.min(outerR - 1.5, (params.couplerShaftA || 5) / 2));
  const boreB = Math.max(1.5, Math.min(outerR - 1.5, (params.couplerShaftB || 8) / 2));
  const halfLen = length / 2;

  const points: THREE.Vector2[] = [
    new THREE.Vector2(boreA + 0.6, 0),
    new THREE.Vector2(outerR - 1.0, 0),
    new THREE.Vector2(outerR, 1.0),
    new THREE.Vector2(outerR, length - 1.0),
    new THREE.Vector2(outerR - 1.0, length),
    new THREE.Vector2(boreB + 0.6, length),
    new THREE.Vector2(boreB, length - 0.6),
    new THREE.Vector2(boreB, halfLen),
    new THREE.Vector2(boreA, halfLen),
    new THREE.Vector2(boreA, 0.6),
    new THREE.Vector2(boreA + 0.6, 0),
  ];

  const geo = new THREE.LatheGeometry(points, 64);
  geo.computeVertexNormals();
  return geo;
}

/**
 * 7. FREE CAD STUDIO: Procedural CSG-Style Modeling Pipeline
 * Allows the user to Add, Extrude, and Subtract shapes, change faces, vertices, and sides.
 */
export function generateCadStudioGeometry(
  operations: CadOperation[],
  params: EngineeringPartsParams
): THREE.BufferGeometry {
  const activeOps = (operations || []).filter((op) => op.enabled !== false);

  if (activeOps.length === 0) {
    // Fallback: simple cylinder
    const fallback = new THREE.CylinderGeometry(7, 7, 20, 32);
    fallback.translate(0, 10, 0);
    return fallback;
  }

  // Find the primary base cylinder and any modifiers
  const baseOp = activeOps.find((op) => op.type === 'add-cylinder' || op.type === 'add-polygon');
  const notchesOp = activeOps.find((op) => op.type === 'subtract-notches');
  const chamferOp = activeOps.find((op) => op.type === 'subtract-chamfer');
  const boreOp = activeOps.find((op) => op.type === 'subtract-bore');
  const sideHoleOp = activeOps.find((op) => op.type === 'subtract-side-hole');

  // If operations are the standard cylindrical/sleeve pipeline, generate unified seamless mesh:
  if (baseOp && (notchesOp || chamferOp || boreOp || sideHoleOp)) {
    const dBase = baseOp.params.diameter || 14.0;
    const dTop = baseOp.params.topDiameter || dBase;
    const h = baseOp.params.height || 22.0;
    const sides = baseOp.params.sides || 72;

    const sleeveParams: EngineeringPartsParams = {
      ...params,
      outerDiameter: dBase,
      topDiameter: dTop,
      totalHeight: h,
      bodySides: sides,
      innerDiameter: boreOp?.params.boreDiameter ?? (boreOp ? 8.0 : 0),
      boreType: boreOp?.params.isThrough ? 'through' : 'blind',
      blindBoreDepth: boreOp?.params.boreDepth ?? h - 4,
      topChamferSize: chamferOp?.params.chamferSize ?? 2.2,
      toothMode: notchesOp?.params.toothMode || 'slots',
      notchCount: notchesOp?.params.toothCount ?? 2,
      notchWidth: notchesOp?.params.toothWidth ?? 4.5,
      notchDepth: notchesOp?.params.toothDepth ?? 5.5,
      notchAngleOffset: notchesOp?.params.angleOffset ?? 0,
      notchChamfer: notchesOp?.params.toothChamfer ?? 0.8,
      hasSideHole: !!sideHoleOp,
      sideHoleDiameter: sideHoleOp?.params.diameter ?? 3.2,
      sideHoleHeight: sideHoleOp?.params.height ?? 14.0,
      sideHoleAngle: sideHoleOp?.params.angle ?? 90,
    };

    let baseGeo = generateSlottedSleeveGeometry(sleeveParams);

    // Merge any other additive features (like an added flange or ring)
    const extraAddOps = activeOps.filter(
      (op) => op !== baseOp && op.type.startsWith('add-')
    );

    if (extraAddOps.length > 0) {
      const extraGeos: THREE.BufferGeometry[] = [baseGeo];
      for (const op of extraAddOps) {
        if (op.type === 'add-box') {
          const sx = op.params.sizeX || 10;
          const sy = op.params.sizeY || 10;
          const sz = op.params.sizeZ || 10;
          const box = new THREE.BoxGeometry(sx, sz, sy);
          box.translate(op.params.posX || 0, (op.params.posZ || 0) + sz / 2, op.params.posY || 0);
          extraGeos.push(box);
        } else if (op.type === 'add-ring') {
          const rOut = (op.params.diameter || 20) / 2;
          const rIn = ((op.params.topDiameter ?? 14) || 14) / 2;
          const rH = op.params.height || 4;
          const ring = new THREE.CylinderGeometry(rOut, rOut, rH, 48);
          ring.translate(0, (op.params.posZ || 0) + rH / 2, 0);
          extraGeos.push(ring);
        }
      }
      baseGeo = mergeGeometries(extraGeos);
    }

    return baseGeo;
  }

  // General CAD assembly of additive parts:
  const partGeometries: THREE.BufferGeometry[] = [];

  for (const op of activeOps) {
    if (op.type === 'add-cylinder') {
      const rBot = (op.params.diameter || 14) / 2;
      const rTop = ((op.params.topDiameter ?? op.params.diameter) || 14) / 2;
      const h = op.params.height || 20;
      const sides = Math.max(3, op.params.sides || 32);
      const cyl = new THREE.CylinderGeometry(rTop, rBot, h, sides);
      cyl.translate(op.params.posX || 0, (op.params.posZ || 0) + h / 2, op.params.posY || 0);
      partGeometries.push(cyl);
    } else if (op.type === 'add-box') {
      const sx = op.params.sizeX || 15;
      const sy = op.params.sizeY || 15;
      const sz = op.params.sizeZ || 15;
      const box = new THREE.BoxGeometry(sx, sz, sy);
      box.translate(op.params.posX || 0, (op.params.posZ || 0) + sz / 2, op.params.posY || 0);
      partGeometries.push(box);
    } else if (op.type === 'add-polygon') {
      const sides = Math.max(3, op.params.sides || 6);
      const r = (op.params.diameter || 16) / 2;
      const h = op.params.height || 20;
      const poly = new THREE.CylinderGeometry(r, r, h, sides);
      poly.translate(op.params.posX || 0, (op.params.posZ || 0) + h / 2, op.params.posY || 0);
      partGeometries.push(poly);
    } else if (op.type === 'add-ring') {
      const rOut = (op.params.diameter || 22) / 2;
      const rH = op.params.height || 4;
      const ring = new THREE.CylinderGeometry(rOut, rOut, rH, 48);
      ring.translate(op.params.posX || 0, (op.params.posZ || 0) + rH / 2, op.params.posY || 0);
      partGeometries.push(ring);
    }
  }

  if (partGeometries.length === 0) {
    return generateSlottedSleeveGeometry(params);
  }

  const merged = mergeGeometries(partGeometries);
  merged.center();
  merged.computeBoundingBox();
  if (merged.boundingBox) merged.translate(0, -merged.boundingBox.min.y, 0);
  return merged;
}

/**
 * Master dispatcher for all Engineering Parts & CAD Studio
 */
export function generateEngineeringPartsGeometry(params: EngineeringPartsParams): THREE.BufferGeometry {
  let geo: THREE.BufferGeometry;

  if (params.modelingMode === 'free-cad') {
    geo = generateCadStudioGeometry(params.cadOperations, params);
  } else {
    switch (params.category) {
      case 'slotted-sleeve':
        geo = generateSlottedSleeveGeometry(params);
        break;
      case 'chamfered-bushing':
        geo = generateChamferedBushingGeometry(params);
        break;
      case 'gears-pulleys':
        geo = generateGearPulleyGeometry(params);
        break;
      case 'tools-knobs':
        geo = generateToolKnobGeometry(params);
        break;
      case 'brackets-mounts':
        geo = generateBracketClampGeometry(params);
        break;
      case 'shafts-couplers':
        geo = generateShaftCouplerGeometry(params);
        break;
      default:
        geo = generateSlottedSleeveGeometry(params);
        break;
    }
  }

  // Independent XYZ Scale if set
  const sx = params.scaleX || 1.0;
  const sy = params.scaleY || 1.0;
  const sz = params.scaleZ || 1.0;
  if (sx !== 1.0 || sy !== 1.0 || sz !== 1.0) {
    geo.scale(sx, sz, sy);
  }

  // Flat shading normals conversion if requested
  if (params.shadingMode === 'flat') {
    const nonIndexed = geo.toNonIndexed();
    nonIndexed.computeVertexNormals();
    geo = nonIndexed;
  } else {
    geo.computeVertexNormals();
  }

  return geo;
}

// Low-level mesh geometry helper
function addTriangle(
  p1: number[], p2: number[], p3: number[],
  pos: number[], norm: number[], uvs: number[], ind: number[]
) {
  const i0 = pos.length / 3;
  pos.push(...p1, ...p2, ...p3);

  // Compute normal
  const vA = new THREE.Vector3(...p1);
  const vB = new THREE.Vector3(...p2);
  const vC = new THREE.Vector3(...p3);
  const cb = new THREE.Vector3().subVectors(vC, vB);
  const ab = new THREE.Vector3().subVectors(vA, vB);
  cb.cross(ab).normalize();

  norm.push(cb.x, cb.y, cb.z, cb.x, cb.y, cb.z, cb.x, cb.y, cb.z);
  uvs.push(0, 0, 1, 0, 0.5, 1);
  ind.push(i0, i0 + 1, i0 + 2);
}

function addQuad(
  p1: number[], p2: number[], p3: number[], p4: number[],
  pos: number[], norm: number[], uvs: number[], ind: number[]
) {
  addTriangle(p1, p2, p3, pos, norm, uvs, ind);
  addTriangle(p1, p3, p4, pos, norm, uvs, ind);
}
