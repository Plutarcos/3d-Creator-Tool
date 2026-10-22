import * as THREE from 'three';

export type GeneratorMode =
  | 'dual-text'
  | 'engineering-parts'
  | 'stencil-3d'
  | 'keychain'
  | 'keychain-studio'
  | 'desk-nameplate'
  | 'ai-prompt-model'
  | 'ai-model-generator'
  | 'lithophane'
  | 'mechanical-gear'
  | 'parametric-vase'
  | 'qr-code-keychain';

export type FontChoice =
  | 'Bungee'
  | 'Alfa Slab One'
  | 'Black Ops One'
  | 'Fredoka'
  | 'Space Grotesk'
  | 'Cinzel'
  | 'Plus Jakarta Sans'
  | 'Pacifico'
  | 'Oswald'
  | 'Montserrat'
  | 'Bangers'
  | 'Orbitron'
  | 'Righteous';

export type BaseType = 'solid' | 'chamfer' | 'keychain' | 'none' | 'pedestal' | 'pill';
export type DualTextLayoutStyle = 'linear-display' | 'monolith';
export type EndDecoration = 'hearts' | 'stars' | 'rings' | 'none';
export type FillStrategy =
  | 'pad-heart-solid'
  | 'pad-heart'
  | 'pad-star-solid'
  | 'pad-star'
  | 'pad-infinity'
  | 'pad-flower'
  | 'pad-dot'
  | 'pad-repeat'
  | 'pad-space';
export type LetterSculptStyle = 'smooth' | 'chamfer' | 'rounded' | 'sharp';

export interface DualTextParams {
  wordA: string;
  wordB: string;
  layoutStyle: DualTextLayoutStyle;
  font: FontChoice;
  fontSize: number;
  height: number; // mm
  resolution: number; // grid resolution per letter (e.g. 64-96)
  viewAngle: number; // illusion angle in degrees (e.g. 45 for ±45° diagonal)
  sculptStyle: LetterSculptStyle;
  strokeBoldness: number; // 0 to 6
  smoothNormals: boolean;
  baseType: BaseType;
  baseHeight: number; // mm
  basePadding: number; // mm
  baseWidth: number; // mm
  endDecoration: EndDecoration;
  baseText: string;
  fillStrategy: FillStrategy;
  keychainHoleRadius: number; // mm
  letterSpacing: number; // mm
  letterDepth: number; // mm
  autoConnectFloatingParts: boolean;
  chamferEdges: boolean;
  mirrorWordB: boolean;
  multiColorPreview: boolean;
}

export interface ArticulatedSegmentData {
  index: number;
  char: string;
  isCharm?: boolean;
  pivot: THREE.Vector3; // Joint pivot in parent space
  baseGeo: THREE.BufferGeometry;
  lettersGeo?: THREE.BufferGeometry;
  nextPivot?: THREE.Vector3; // Location of next child joint in this segment's space
}

export interface DualTextGeometries {
  combined: THREE.BufferGeometry;
  lettersGeo?: THREE.BufferGeometry;
  baseGeo?: THREE.BufferGeometry;
  decorationsGeo?: THREE.BufferGeometry;
  baseTextGeo?: THREE.BufferGeometry;
  isArticulated?: boolean;
  articulatedSegments?: ArticulatedSegmentData[];
}

// ----------------------------------------------------
// AI 3D Model Generator Types
// ----------------------------------------------------
export interface AIModelComponent {
  type: 'box' | 'cylinder' | 'cone' | 'torus' | 'sphere' | 'extruded-polygon' | 'lathe-profile' | 'wedge' | 'hex-prism';
  operation?: 'add' | 'cut';
  position: [number, number, number];
  rotation?: [number, number, number];
  dimensions?: {
    width?: number;
    height?: number;
    depth?: number;
    radiusTop?: number;
    radiusBottom?: number;
    radialSegments?: number;
    radius?: number;
    tube?: number;
    sides?: number;
    wallThickness?: number;
    profile?: [number, number][];
  };
  chamfer?: number;
  color?: string;
}

export interface AIModelBlueprint {
  title: string;
  description: string;
  recommendedSettings?: {
    infill?: string;
    layerHeight?: string;
    supports?: string;
    filament?: string;
  };
  dimensions?: {
    width: number;
    depth: number;
    height: number;
  };
  components: AIModelComponent[];
}

export interface AIModelParams {
  prompt: string;
  category: 'functional' | 'decorative' | 'gadget' | 'home' | 'mechanical';
  style: 'modern' | 'minimalist' | 'geometric' | 'industrial' | 'organic';
  scale: number; // 0.5 to 2.0
  activePresetId?: string;
}

// ----------------------------------------------------
// Keychain Studio Types (Fixed & Articulated Flexi)
// ----------------------------------------------------
export type KeychainType = 'fixed-name' | 'flexi-articulated' | 'qr-code' | 'monogram';
export type KeychainBaseStyle = 'outline' | 'pill' | 'hexagon' | 'heart' | 'bone' | 'badge';
export type FlexiSegmentStyle = 'pure-letters' | 'capsule-links' | 'hexagon-links' | 'bone-links';
export type TailCharmType = 'heart' | 'star' | 'skull' | 'bone' | 'paw' | 'none';

export interface KeychainParams {
  type: KeychainType;
  text: string;
  subtitle: string;
  font: FontChoice;
  fontSize: number; // mm height of letters
  baseStyle: KeychainBaseStyle;
  baseThickness: number; // mm (e.g. 2.4)
  textExtrusion: number; // mm (e.g. 1.8)
  borderPadding: number; // mm
  holePosition: 'left' | 'right' | 'top' | 'none';
  holeDiameter: number; // mm (e.g. 4.0)
  reinforcedRing: boolean;
  // Flexi Articulated specific
  flexiSegmentStyle?: FlexiSegmentStyle;
  flexiJointClearance: number; // mm clearance (e.g. 0.45)
  flexiSegmentGap?: number; // mm spacing between letter edges (e.g. 4.8)
  tailCharm: TailCharmType;
  previewFlexAngle?: number; // degrees (0 for flat print-bed, 10-35 for articulated live preview)
  // QR code specific
  qrContent: string;
  qrSize: number;
  twoTone: boolean;
}

// ----------------------------------------------------
// Lithophane / Photo Relief Types
// ----------------------------------------------------
export type LithophaneShape = 'curved' | 'flat' | 'cylinder' | 'heart' | 'box-frame';

export interface LithophaneParams {
  imageUrl: string;
  imageBrightness: number;
  imageContrast: number;
  imageGamma: number;
  smoothing: number; // 0 (crisp) to 3 (smooth)
  shape: LithophaneShape;
  width: number; // mm
  height: number; // mm
  minThickness: number; // mm (lightest parts e.g. 0.8)
  maxThickness: number; // mm (darkest parts e.g. 3.2)
  curveAngle: number; // degrees (e.g. 40)
  frameThickness: number; // mm (e.g. 2.4)
  frameBorder: number; // mm (e.g. 3.5)
  standIncluded: boolean;
  hangHole: boolean;
  inverted: boolean; // negative vs positive
  backlightPreview: boolean;
  samplePreset?: string;
}

// ----------------------------------------------------
// Vase Types
// ----------------------------------------------------
export interface VaseParams {
  height: number; // mm
  bottomRadius: number; // mm
  topRadius: number; // mm
  middleBulge: number; // factor 0.5 - 2.0
  sides: number; // 3 to 36
  twistAngle: number; // degrees 0 - 360
  waves: number; // 0 to 12
  waveAmplitude: number; // mm
  wallThickness: number; // mm
  bottomThickness: number; // mm
  solidMode: boolean; // spiralize / vase mode ready
}

// ----------------------------------------------------
// Detailed Mechanical Gear Types
// ----------------------------------------------------
export type GearType = 'spur' | 'helical' | 'herringbone' | 'internal' | 'bevel';
export type ShaftType = 'round' | 'd-shaft' | 'hex';
export type SpokeStyle = 'solid' | 'straight' | 'circular-cutouts' | 'teardrop-cutouts';

export interface GearParams {
  gearType: GearType;
  teeth: number; // 6 to 120
  module: number; // pitch size (0.5 to 10 mm)
  pressureAngle: number; // 14.5, 20, 25 deg
  helixAngle: number; // 0 to 45 deg
  thickness: number; // mm
  boreDiameter: number; // shaft hole mm
  shaftType: ShaftType;
  dShaftFlat: number; // mm cut depth from edge
  hasKeyway: boolean;
  keywayWidth: number; // mm
  keywayDepth: number; // mm
  hasSetScrew: boolean;
  setScrewSize: 'M3' | 'M4' | 'M5';
  spokes: number; // 0, 3, 4, 5, 6
  spokeStyle: SpokeStyle;
  rimWidth: number; // mm
  hubDiameter: number; // mm
  hubHeight: number; // mm protrusion
  chamferToothEdges: boolean;
}

// ----------------------------------------------------
// Engineering Parts & Mechanical Tools Types
// ----------------------------------------------------
export type EngineeringCategory =
  | 'slotted-sleeve' // Peça da Foto: Luva cilíndrica com entalhe/ranhura e chanfro/arredondamento
  | 'chamfered-bushing' // Buchas, espaçadores chanfrados e anilhas
  | 'gears-pulleys' // Engrenagens e polias técnicas
  | 'tools-knobs' // Ferramentas, manípulos estrela, suportes de bits
  | 'brackets-mounts' // Cantoneiras 90° chanfradas reforçadas, abraçadeiras
  | 'shafts-couplers'; // Acopladores de eixo, pinos guia chanfrados

export type SleeveTopProfile = 'chamfered' | 'rounded' | 'flat' | 'stepped' | 'conical';
export type BoreType = 'through' | 'blind' | 'stepped';
export type NotchShape = 'rectangular' | 'u-groove' | 'v-notch';
export type ToothMode = 'slots' | 'protrusions';
export type ShadingMode = 'smooth' | 'flat' | 'wireframe' | 'vertices';

// CAD Modeling Operations (Add, Extrude, Subtract)
export type CadOpType =
  | 'add-cylinder'
  | 'add-box'
  | 'add-polygon'
  | 'add-ring'
  | 'add-teeth'
  | 'subtract-bore'
  | 'subtract-notches'
  | 'subtract-side-hole'
  | 'subtract-keyway'
  | 'subtract-chamfer'
  | 'subtract-slot';

export interface CadOperation {
  id: string;
  name: string;
  enabled: boolean;
  type: CadOpType;
  params: {
    // Shared dimensions
    diameter?: number;
    topDiameter?: number;
    height?: number;
    sides?: number;
    posX?: number;
    posY?: number;
    posZ?: number;
    rotX?: number;
    rotY?: number;
    rotZ?: number;
    // Box
    sizeX?: number;
    sizeY?: number;
    sizeZ?: number;
    // Teeth / Notches
    toothCount?: number;
    toothWidth?: number;
    toothDepth?: number;
    toothMode?: ToothMode;
    toothChamfer?: number;
    angleOffset?: number;
    // Bore
    boreDiameter?: number;
    boreDepth?: number;
    isThrough?: boolean;
    // Chamfer
    chamferSize?: number;
    chamferAngle?: number;
    // Slot
    slotWidth?: number;
    slotDepth?: number;
    [key: string]: any;
  };
}

export interface EngineeringPartsParams {
  category: EngineeringCategory;
  modelingMode: 'parametric' | 'free-cad'; // Parametric piece or Free CAD Operations Tree

  // Visual & Shading Display Modes (Smooth, Flat/Faceted, Wireframe, Vertices)
  shadingMode: ShadingMode;
  scaleX: number; // 0.2 to 5.0
  scaleY: number;
  scaleZ: number;

  // 1. Slotted Sleeve / Peça da foto (Luva Cilíndrica com Entalhes e Topo Chanfrado)
  outerDiameter: number; // mm (ex: 14 mm base)
  topDiameter: number; // mm (para conicidade/inclinação de faces, ex: 14 mm)
  totalHeight: number; // mm (ex: 22 mm)
  bodySides: number; // Qtd de faces/lados: 3..128 (ex: 6 sextavado, 8 octogonal, 72 redondo suave)
  innerDiameter: number; // mm (ex: 8 mm)
  boreType: BoreType; // 'through' ou 'blind'
  blindBoreDepth: number; // mm (ex: 18 mm)
  hasCounterbore: boolean; // Furo escalonado interno (2 diâmetros)
  counterboreDiameter: number; // mm (ex: 10 mm)
  counterboreDepth: number; // mm (ex: 6 mm)
  topProfile: SleeveTopProfile; // 'chamfered' | 'rounded' | 'flat' | 'conical' | 'stepped'
  topChamferSize: number; // mm (ex: 2.2 mm)
  bottomChamferSize: number; // mm (ex: 0.8 mm)

  // Entalhes / Dentes da borda (Controle Total como na foto!)
  toothMode: ToothMode; // 'slots' (cortes/ranhuras na borda) ou 'protrusions' (dentes salientes/castelo)
  notchCount: number; // 1 a 32 dentes livres!
  notchWidth: number; // mm (ex: 4.5 mm)
  notchDepth: number; // mm (altura do entalhe/dente na borda, ex: 5.5 mm)
  notchAngleOffset: number; // Rotação dos dentes em graus (0..360°)
  notchShape: NotchShape; // 'rectangular' | 'u-groove' | 'v-notch'
  notchChamfer: number; // mm (chanfro de entrada no dente, ex: 0.8 mm)
  hasSideHole: boolean; // furo lateral para pino / parafuso de trava
  sideHoleDiameter: number; // mm
  sideHoleHeight: number; // mm
  sideHoleAngle: number; // graus (0..360°)
  sideHoleThrough: boolean; // furo passante ou cego

  // Free CAD Operations (Adicionar, Extrudar e Subtrair)
  cadOperations: CadOperation[];

  // 2. Buchas & Espaçadores Chanfrados (Bushings & Spacers)
  bushingType: 'straight' | 'flanged' | 'hex-spacer' | 'conical-washer';
  flangeDiameter: number; // mm
  flangeThickness: number; // mm
  hexSize: number; // mm para espaçador sextavado (chave sextavada)
  internalChamfer: number; // mm
  externalChamfer: number; // mm

  // 3. Engrenagens & Polias (Gears & Pulleys)
  gearParams: GearParams;
  pulleyType: 'gt2-timing' | 'v-belt' | 'flat-flanged';
  pulleyTeeth: number; // 16 to 80
  pulleyBeltWidth: number; // mm (ex: 6mm ou 9mm)
  hasFlange: boolean; // flanges de contenção lateral

  // 4. Ferramentas, Manípulos & Suportes (Tools & Knobs)
  toolType: 'star-knob' | 'wing-knob' | 'hex-bit-holder' | 'wrench-handle' | 'drill-stop';
  knobPoints: number; // 4, 5, 6, 7 lóbulos na estrela
  knobDiameter: number; // mm (ex: 36 mm)
  knobThickness: number; // mm (ex: 12 mm)
  nutSize: 'M3' | 'M4' | 'M5' | 'M6' | 'M8' | 'M10'; // para porca embutida
  nutPocketDepth: number; // mm
  bitHolderSlots: number; // 4, 6, 8, 10, 12 furos sextavados 1/4"

  // 5. Cantoneiras & Abraçadeiras (Brackets & Clamps)
  bracketLength: number; // mm
  bracketWidth: number; // mm
  bracketThickness: number; // mm
  bracketGusset: boolean; // nervura triangular de reforço
  gussetThickness: number; // mm
  boltHoleDiameter: number; // mm
  countersunkHoles: boolean; // furos escareados para cabeça cônica

  // 6. Acopladores & Eixos (Couplers & Shafts)
  couplerShaftA: number; // mm (ex: 5 mm motor)
  couplerShaftB: number; // mm (ex: 8 mm fuso)
  couplerLength: number; // mm
  couplerSpiralCut: boolean; // corte espiral flexível
}

// ----------------------------------------------------
// Legacy QR params for backward compatibility
// ----------------------------------------------------
export interface QrParams {
  content: string;
  size: number;
  baseThickness: number;
  raisedThickness: number;
  hasBorder: boolean;
  hasKeychainHole: boolean;
  keychainHoleRadius: number;
  roundedCorners: boolean;
}

// ----------------------------------------------------
// Desk Nameplate Types (Fixed with 3D raised letters)
// ----------------------------------------------------
export type NameplateStyle = 'triangular-wedge' | 'curved-stand' | 'flat-slide-in' | 'desk-organizer';

export interface NameplateParams {
  title: string;
  subtitle: string;
  font: FontChoice;
  style: NameplateStyle;
  plateWidth: number; // mm
  plateHeight: number; // mm
  plateAngle: number; // degrees (e.g. 65)
  plateThickness: number; // mm
  textExtrusion: number; // mm
  fontSize: number; // Title font size
  subtitleFontSize: number; // Subtitle font size
  hasBorder: boolean;
  borderThickness: number; // mm
  addPenSlot: boolean;
  multiColorPreview: boolean;
}

// ----------------------------------------------------
// Stencil 3D (Gabarito de Pintura / Confeitaria / Artesanato)
// ----------------------------------------------------
export type StencilShape = 'rounded-rect' | 'circle' | 'rectangle' | 'oval' | 'heart' | 'hexagon';
export type StencilTextPosition = 'bottom' | 'top' | 'split' | 'center' | 'none';
export type StencilMode = 'cutout' | 'embossed';
export type StencilHandlePosition = 'right' | 'left' | 'top' | 'none';

export interface StencilParams {
  // Plate parameters
  shape: StencilShape;
  width: number; // mm (e.g. 100)
  height: number; // mm (e.g. 100)
  thickness: number; // mm (e.g. 1.2 to 2.4 mm, default 1.4 mm)
  cornerRadius: number; // mm (e.g. 8 mm)
  hasBorderRim: boolean; // Raised border for structural rigidity
  borderRimThickness: number; // mm (e.g. 2.4 mm)
  borderMargin: number; // mm (distance from edge to cutout, e.g. 8 mm)

  // Handle & Hanging hole
  handlePosition: StencilHandlePosition;
  handleLength: number; // mm (e.g. 24 mm)
  handleWidth: number; // mm (e.g. 20 mm)
  hasHangingHole: boolean;
  hangingHoleRadius: number; // mm (e.g. 3 mm)

  // Image parameters
  imageUrl: string;
  imagePresetId: string;
  invertImage: boolean; // default true: dark/black object = cutout
  threshold: number; // 0-255, default 128
  imageScale: number; // 0.3 to 1.5, default 0.85
  imageOffsetX: number; // mm (-45 to +45)
  imageOffsetY: number; // mm (-45 to +45)
  imageRotation?: number; // degrees (-180 to +180)

  // Text parameters
  text: string; // e.g. "CAFÉ", "FELIZ ANIVERSÁRIO", "SPECIAL"
  subtitle: string; // e.g. "ESPECIAL", "2026"
  font: FontChoice;
  fontSize: number; // mm height, e.g. 14 mm
  textPosition?: StencilTextPosition; // Optional legacy field
  textOffsetX?: number; // mm horizontal adjustment (-45 to +45)
  textOffsetY?: number; // mm vertical adjustment (-45 to +45)
  textRotation?: number; // degrees (-180 to +180)
  stencilBridges: boolean; // Add island bridge connectors so O, A, B, D, etc. centers don't fall out!
  bridgeWidth: number; // mm (e.g. 1.2 mm)

  // Stencil Mode
  stencilMode: StencilMode; // 'cutout' (furo passante) or 'embossed' (alto relevo / carimbo)
  reliefHeight: number; // mm when in embossed mode (e.g. 2.0 mm)
}

export interface StencilGeometries {
  combined: THREE.BufferGeometry;
  plateGeo?: THREE.BufferGeometry;
  rimGeo?: THREE.BufferGeometry;
  reliefGeo?: THREE.BufferGeometry;
}

export type MaterialPreset =
  | 'gold'
  | 'matte-black'
  | 'silk-silver'
  | 'neon-cyan'
  | 'ruby-red'
  | 'marble-white'
  | 'glow-green'
  | 'galaxy-purple'
  | 'wood-pla';

export interface ModelStats {
  dimensions: { x: number; y: number; z: number }; // mm
  triangleCount: number;
  estimatedWeightGrams: number;
  estimatedPrintTimeMinutes: number;
  isPrintable: boolean;
  warnings: string[];
}
