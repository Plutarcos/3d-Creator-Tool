import React, { useState, useEffect, useMemo, useCallback } from 'react';
import * as THREE from 'three';
import confetti from 'canvas-confetti';
import {
  GeneratorMode,
  DualTextParams,
  DualTextGeometries,
  LithophaneParams,
  VaseParams,
  GearParams,
  QrParams,
  NameplateParams,
  KeychainParams,
  AIModelParams,
  AIModelBlueprint,
  MaterialPreset,
  ModelStats,
  StencilParams,
  EngineeringPartsParams,
} from './types';
import {
  generateDualTextGeometry,
  generateDualTextCompleteGeometries,
  ensureFontLoaded,
} from './generators/dualTextGenerator';
import { generateStencilCompleteGeometries } from './generators/stencilGenerator';
import {
  generateEngineeringPartsGeometry,
  DEFAULT_ENGINEERING_PARAMS,
} from './generators/engineeringPartsGenerator';
import { generateLithophaneGeometry } from './generators/lithophaneGenerator';
import { generateVaseGeometry } from './generators/vaseGenerator';
import { generateGearGeometry } from './generators/gearGenerator';
import { generateQrGeometry } from './generators/qrGenerator';
import {
  generateNameplateGeometry,
  generateNameplateCompleteGeometries,
} from './generators/nameplateGenerator';
import {
  generateKeychainGeometry,
  generateKeychainCompleteGeometries,
} from './generators/keychainGenerator';
import {
  buildGeometryFromAIBlueprint,
  generateProceduralAIModel,
  AI_PRESET_TEMPLATES,
} from './generators/aiModelGenerator';
import {
  downloadSTL,
  downloadMultiPartSTLs,
  exportToOBJ,
  calculateGeometryStats,
} from './utils/stlExporter';

import { Viewport3D } from './components/Viewport3D';
import { DualTextControls } from './components/DualTextControls';
import { EngineeringPartsControls } from './components/EngineeringPartsControls';
import { KeychainControls } from './components/KeychainControls';
import { NameplateControls } from './components/NameplateControls';
import { LithophaneControls } from './components/LithophaneControls';
import { GearControls } from './components/GearControls';
import { AIModelControls } from './components/AIModelControls';
import { VaseControls } from './components/VaseControls';
import { QrControls } from './components/QrControls';
import { StencilControls } from './components/StencilControls';
import { PrintEstimator } from './components/PrintEstimator';
import { SlicingPreviewSlider } from './components/SlicingPreviewSlider';

import {
  Layers,
  Download,
  FileCode,
  Sparkles,
  Box,
  Image as ImageIcon,
  Cog,
  QrCode,
  Type,
  KeyRound,
  Wand2,
  Printer,
  Info,
  CheckCircle2,
  Cpu,
  FolderArchive,
  Palette,
  Heart,
  Stamp,
  Wrench,
} from 'lucide-react';

export default function App() {
  const [activeMode, setActiveMode] = useState<GeneratorMode>('dual-text');
  const [materialPreset, setMaterialPreset] = useState<MaterialPreset>('ruby-red');
  const [wireframe, setWireframe] = useState<boolean>(false);
  const [multiColorPreview, setMultiColorPreview] = useState<boolean>(true);
  const [slicingProgress, setSlicingProgress] = useState<number>(1.0);
  const [isExporting, setIsExporting] = useState<boolean>(false);

  // 1. Dual-Text Parameters (Michael & Jessica Two-Names Illusion)
  const [dualTextParams, setDualTextParams] = useState<DualTextParams>({
    wordA: 'MICHAEL',
    wordB: 'JESSICA',
    layoutStyle: 'linear-display',
    font: 'Bungee',
    fontSize: 40,
    height: 40,
    resolution: 48,
    viewAngle: 45,
    sculptStyle: 'smooth',
    strokeBoldness: 2,
    smoothNormals: true,
    baseType: 'pill',
    baseHeight: 4.5,
    basePadding: 4,
    baseWidth: 32,
    endDecoration: 'hearts',
    baseText: '',
    fillStrategy: 'pad-heart-solid',
    keychainHoleRadius: 2.5,
    letterSpacing: 28,
    letterDepth: 28,
    autoConnectFloatingParts: true,
    chamferEdges: true,
    mirrorWordB: false,
    multiColorPreview: true,
  });

  // 2. Keychain Parameters (Fixed & Articulated Flexi)
  const [keychainParams, setKeychainParams] = useState<KeychainParams>({
    type: 'flexi-articulated',
    text: 'GABRIEL',
    subtitle: 'ENGENHARIA 3D',
    font: 'Bungee',
    fontSize: 24,
    baseThickness: 2.8,
    textExtrusion: 1.2,
    letterReliefHeight: 1.2,
    flatBottom: true,
    slicerLayerHeight: 0.20,
    baseStyle: 'pill',
    flexiSegmentStyle: 'pure-letters',
    previewFlexAngle: 0,
    holeDiameter: 4.2,
    holePosition: 'left',
    reinforcedRing: true,
    flexiJointClearance: 0.85,
    flexiSegmentGap: 5.6,
    tailCharm: 'heart',
    letterScaleRatio: 1.0,
    letterSizePreset: 'standard',
    qrContent: 'https://makerworld.com',
  });

  // 3. Desk Nameplate Parameters (with clear 3D embossed text)
  const [nameplateParams, setNameplateParams] = useState<NameplateParams>({
    title: 'DRA. JULIANA SILVA',
    subtitle: 'CIRURGIÃ DENTISTA',
    font: 'Bungee',
    style: 'triangular-wedge',
    plateWidth: 140,
    plateHeight: 42,
    plateAngle: 65,
    plateThickness: 5.0,
    textExtrusion: 2.2,
    hasBorder: true,
  });

  // 4. Lithophane Parameters (High resolution with curves & stands)
  const [lithoParams, setLithoParams] = useState<LithophaneParams>({
    imageUrl: 'https://images.unsplash.com/photo-1518895949257-7621c3c786d7?w=600&q=80',
    imageBrightness: 0,
    imageContrast: 1.2,
    smoothing: 1,
    shape: 'curved',
    width: 90,
    height: 90,
    minThickness: 0.8,
    maxThickness: 3.2,
    curveAngle: 40,
    frameThickness: 2.5,
    frameBorder: 3.5,
    standIncluded: true,
    hangHole: false,
    inverted: false,
  });

  // 5. Gear Parameters (Spur, Helical, Herringbone, Internal, Bevel)
  const [gearParams, setGearParams] = useState<GearParams>({
    gearType: 'spur',
    teeth: 20,
    module: 2.5,
    thickness: 10,
    pressureAngle: 20,
    helixAngle: 20,
    shaftType: 'round',
    boreDiameter: 5,
    hasKeyway: false,
    keywayWidth: 2,
    keywayDepth: 1.5,
    spokeStyle: 'solid',
    spokes: 4,
    rimWidth: 3.5,
    hubDiameter: 14,
    hubHeight: 3,
  });

  // 6. AI 3D Model Parameters (Gemini API & Parametric Blueprints)
  const [aiModelParams, setAiModelParams] = useState<AIModelParams>({
    prompt: 'Suporte de mesa articulado para celular com canal de cabo',
    category: 'gadget',
    style: 'modern',
    scale: 1.0,
    activePresetId: 'phone-stand',
  });
  const [aiBlueprint, setAiBlueprint] = useState<AIModelBlueprint | null>(null);
  const [isAiLoading, setIsAiLoading] = useState<boolean>(false);
  const [aiError, setAiError] = useState<string | null>(null);

  // 7. Vase Parameters
  const [vaseParams, setVaseParams] = useState<VaseParams>({
    height: 100,
    bottomRadius: 28,
    topRadius: 36,
    middleBulge: 1.25,
    sides: 6,
    twistAngle: 90,
    waves: 0,
    waveAmplitude: 3,
    wallThickness: 2.4,
    bottomThickness: 3.0,
    solidMode: false,
  });

  // 8. QR Code Parameters
  const [qrParams, setQrParams] = useState<QrParams>({
    content: 'https://makerworld.com',
    size: 55,
    baseThickness: 2.2,
    raisedThickness: 1.4,
    hasBorder: true,
    hasKeychainHole: true,
    keychainHoleRadius: 2.5,
    roundedCorners: true,
  });

  // 9. Stencil 3D Parameters (Gabarito / Imagem & Frases)
  const [stencilParams, setStencilParams] = useState<StencilParams>({
    shape: 'rounded-rect',
    width: 100,
    height: 100,
    thickness: 1.4,
    cornerRadius: 8,
    hasBorderRim: true,
    borderRimThickness: 2.4,
    borderMargin: 8,
    handlePosition: 'right',
    handleLength: 22,
    handleWidth: 18,
    hasHangingHole: true,
    hangingHoleRadius: 2.8,
    imageUrl: '',
    imagePresetId: 'coffee',
    invertImage: true,
    threshold: 128,
    imageScale: 0.85,
    imageOffsetX: 0,
    imageOffsetY: 0,
    imageRotation: 0,
    text: 'CAFÉ',
    subtitle: 'ESPECIAL',
    font: 'Black Ops One',
    fontSize: 14,
    textPosition: 'bottom',
    textOffsetX: 0,
    textOffsetY: 0,
    textRotation: 0,
    stencilBridges: true,
    bridgeWidth: 1.2,
    stencilMode: 'cutout',
    reliefHeight: 2.0,
  });

  // 10. Engineering Parts & Tools Parameters (Matches User Photo, Bushings, Gears, Knobs, Brackets)
  const [engineeringParams, setEngineeringParams] = useState<EngineeringPartsParams>(DEFAULT_ENGINEERING_PARAMS);

  // Geometry State
  const [geometry, setGeometry] = useState<THREE.BufferGeometry | null>(null);
  const [multiGeos, setMultiGeos] = useState<DualTextGeometries | null>(null);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);

  // Trigger AI Model Generation via Backend Endpoint
  const handleGenerateAI = async (prompt: string) => {
    setIsAiLoading(true);
    setAiError(null);
    try {
      const res = await fetch('/api/generate-3d-model', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          category: aiModelParams.category,
          style: aiModelParams.style,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || `Falha na geração do modelo (${res.status})`);
      }

      const blueprint = data.blueprint || data.model;
      if (blueprint && blueprint.components && blueprint.components.length > 0) {
        setAiBlueprint(blueprint);
        const geo = buildGeometryFromAIBlueprint(blueprint, aiModelParams.scale || 1.0);
        setGeometry(geo);
        setMultiGeos(null);

        try {
          confetti({ particleCount: 75, spread: 65, origin: { y: 0.8 } });
        } catch (_) {}
      } else {
        throw new Error('Formato de modelo inválido retornado pela IA');
      }
    } catch (err: any) {
      console.warn('AI generation error:', err);
      const errMsg = err?.message || 'Não foi possível conectar ao Gemini. Utilizando construtor paramétrico.';
      setAiError(errMsg);
      const geo = generateProceduralAIModel({ ...aiModelParams, prompt });
      setGeometry(geo);
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleApplyAIPreset = (presetId: string) => {
    setAiError(null);
    setAiBlueprint(null);
    const preset = AI_PRESET_TEMPLATES.find((p) => p.id === presetId);
    if (!preset) return;
    const geo = generateProceduralAIModel({ ...aiModelParams, prompt: preset.prompt, activePresetId: presetId });
    setGeometry(geo);
    setMultiGeos(null);
  };

  // Generate Geometry according to active mode
  useEffect(() => {
    let isCancelled = false;
    setIsGenerating(true);

    const generate = async () => {
      let geo: THREE.BufferGeometry | null = null;
      let multi: DualTextGeometries | null = null;

      try {
        switch (activeMode) {
          case 'dual-text': {
            await ensureFontLoaded(dualTextParams.font, dualTextParams.strokeBoldness);
            multi = generateDualTextCompleteGeometries(dualTextParams);
            geo = multi.combined;
            break;
          }
          case 'keychain': {
            const kcGeos = generateKeychainCompleteGeometries(keychainParams);
            geo = kcGeos.combined;
            multi = {
              combined: kcGeos.combined,
              baseGeo: kcGeos.baseGeo,
              lettersGeo: kcGeos.lettersGeo,
              decorationsGeo: kcGeos.ringGeo,
              isArticulated: kcGeos.isArticulated,
              articulatedSegments: kcGeos.articulatedSegments,
            };
            break;
          }
          case 'desk-nameplate': {
            const npGeos = generateNameplateCompleteGeometries(nameplateParams);
            geo = npGeos.combined;
            if (npGeos.basePlateGeo && npGeos.lettersGeo) {
              multi = {
                combined: npGeos.combined,
                baseGeo: npGeos.basePlateGeo,
                lettersGeo: npGeos.lettersGeo,
              };
            }
            break;
          }
          case 'lithophane': {
            geo = await generateLithophaneGeometry(lithoParams);
            break;
          }
          case 'mechanical-gear': {
            geo = generateGearGeometry(gearParams);
            break;
          }
          case 'ai-prompt-model': {
            if (aiBlueprint) {
              geo = buildGeometryFromAIBlueprint(aiBlueprint, aiModelParams.scale || 1.0);
            } else {
              geo = generateProceduralAIModel(aiModelParams);
            }
            break;
          }
          case 'parametric-vase': {
            geo = generateVaseGeometry(vaseParams);
            break;
          }
          case 'qr-code-keychain': {
            geo = generateQrGeometry(qrParams);
            break;
          }
          case 'stencil-3d': {
            const stGeos = await generateStencilCompleteGeometries(stencilParams);
            geo = stGeos.combined;
            if (stGeos.plateGeo && stGeos.rimGeo) {
              multi = {
                combined: stGeos.combined,
                baseGeo: stGeos.plateGeo,
                lettersGeo: stGeos.reliefGeo || stGeos.rimGeo,
                decorationsGeo: stGeos.rimGeo,
              };
            }
            break;
          }
          case 'engineering-parts': {
            geo = generateEngineeringPartsGeometry(engineeringParams);
            break;
          }
          default:
            geo = generateDualTextGeometry(dualTextParams);
        }

        if (!isCancelled) {
          setGeometry(geo);
          setMultiGeos(multi);
        }
      } catch (err) {
        console.error('Error generating geometry:', err);
      } finally {
        if (!isCancelled) {
          setIsGenerating(false);
        }
      }
    };

    const timer = setTimeout(generate, 60);
    return () => {
      isCancelled = true;
      clearTimeout(timer);
    };
  }, [
    activeMode,
    dualTextParams,
    keychainParams,
    nameplateParams,
    lithoParams,
    gearParams,
    aiModelParams,
    aiBlueprint,
    vaseParams,
    qrParams,
    stencilParams,
    engineeringParams,
  ]);

  // Calculate Geometry Print Metrics
  const stats: ModelStats = useMemo(() => {
    if (!geometry) {
      return {
        dimensions: { x: 0, y: 0, z: 0 },
        triangleCount: 0,
        estimatedWeightGrams: 0,
        estimatedPrintTimeMinutes: 0,
        isPrintable: true,
        warnings: [],
      };
    }
    return calculateGeometryStats(geometry);
  }, [geometry]);

  // Export STL handler
  const handleExportSTL = useCallback(() => {
    if (!geometry) return;
    setIsExporting(true);

    let filename = 'modelo_3d.stl';
    if (activeMode === 'dual-text') {
      filename = `dual_text_${dualTextParams.wordA}_${dualTextParams.wordB}.stl`;
    } else if (activeMode === 'keychain') {
      filename = `chaveiro_${keychainParams.text.replace(/\s+/g, '_')}_${keychainParams.type}.stl`;
    } else if (activeMode === 'desk-nameplate') {
      filename = `placa_mesa_${nameplateParams.title.replace(/\s+/g, '_')}.stl`;
    } else if (activeMode === 'lithophane') {
      filename = `litofania_3d_${lithoParams.shape}.stl`;
    } else if (activeMode === 'mechanical-gear') {
      filename = `engrenagem_${gearParams.gearType}_${gearParams.teeth}T_M${gearParams.module}.stl`;
    } else if (activeMode === 'ai-prompt-model') {
      filename = `ia_modelo_3d_${(aiModelParams.prompt || 'custom').slice(0, 16).replace(/\s+/g, '_')}.stl`;
    } else if (activeMode === 'parametric-vase') {
      filename = 'vaso_parametrico.stl';
    } else if (activeMode === 'qr-code-keychain') {
      filename = 'chaveiro_qrcode_3d.stl';
    } else if (activeMode === 'stencil-3d') {
      filename = `estencil_3d_${(stencilParams.text || stencilParams.imagePresetId || 'gabarito').toLowerCase().replace(/\s+/g, '_')}.stl`;
    } else if (activeMode === 'engineering-parts') {
      filename = `peca_tecnica_${engineeringParams.category}_OD${engineeringParams.outerDiameter || 14}mm.stl`;
    }

    let exportGeo = geometry;
    let tempFlatGeo: THREE.BufferGeometry | null = null;

    if (
      activeMode === 'keychain' &&
      keychainParams.type === 'flexi-articulated' &&
      (keychainParams.previewFlexAngle || 0) !== 0
    ) {
      const flatKc = generateKeychainCompleteGeometries({ ...keychainParams, previewFlexAngle: 0 });
      exportGeo = flatKc.combined;
      tempFlatGeo = flatKc.combined;
    }

    downloadSTL(exportGeo, filename);
    if (tempFlatGeo) {
      tempFlatGeo.dispose();
    }

    try {
      confetti({ particleCount: 80, spread: 60, origin: { y: 0.8 } });
    } catch (_) {}

    setTimeout(() => setIsExporting(false), 800);
  }, [
    geometry,
    activeMode,
    dualTextParams,
    keychainParams,
    nameplateParams,
    lithoParams,
    gearParams,
    aiModelParams,
    stencilParams,
    engineeringParams,
  ]);

  // Multi-part export for multi-material / AMS printing
  const handleExportMultiPart = useCallback(() => {
    if (!multiGeos) return;
    setIsExporting(true);

    let prefix = 'modelo';
    const parts: { name: string; geometry: THREE.BufferGeometry }[] = [];

    if (activeMode === 'dual-text') {
      prefix = `${dualTextParams.wordA}_${dualTextParams.wordB}`;
      if (multiGeos.baseGeo && multiGeos.baseGeo.getAttribute('position')) {
        parts.push({ name: '01_Base_Preta', geometry: multiGeos.baseGeo });
      }
      if (multiGeos.lettersGeo && multiGeos.lettersGeo.getAttribute('position')) {
        parts.push({ name: '02_Letras_Dual_Vermelhas', geometry: multiGeos.lettersGeo });
      }
      if (multiGeos.decorationsGeo && multiGeos.decorationsGeo.getAttribute('position')) {
        parts.push({ name: '03_Coracoes_Extremidades', geometry: multiGeos.decorationsGeo });
      }
      if (multiGeos.baseTextGeo && multiGeos.baseTextGeo.getAttribute('position')) {
        parts.push({ name: '04_Inscricao_Base_Branca', geometry: multiGeos.baseTextGeo });
      }
    } else if (activeMode === 'keychain') {
      prefix = `chaveiro_${keychainParams.text}`;
      let targetBase = multiGeos.baseGeo;
      let targetLetters = multiGeos.lettersGeo;

      if (
        keychainParams.type === 'flexi-articulated' &&
        (keychainParams.previewFlexAngle || 0) !== 0
      ) {
        const flatKc = generateKeychainCompleteGeometries({ ...keychainParams, previewFlexAngle: 0 });
        targetBase = flatKc.baseGeo;
        targetLetters = flatKc.lettersGeo;
      }

      if (targetBase && targetBase.getAttribute('position')) {
        parts.push({ name: '01_Base_Chaveiro', geometry: targetBase });
      }
      if (targetLetters && targetLetters.getAttribute('position')) {
        parts.push({ name: '02_Letras_Relevo', geometry: targetLetters });
      }
    } else if (activeMode === 'desk-nameplate') {
      prefix = `placa_${nameplateParams.title.replace(/\s+/g, '_')}`;
      if (multiGeos.baseGeo && multiGeos.baseGeo.getAttribute('position')) {
        parts.push({ name: '01_Placa_Base', geometry: multiGeos.baseGeo });
      }
      if (multiGeos.lettersGeo && multiGeos.lettersGeo.getAttribute('position')) {
        parts.push({ name: '02_Letras_Relevo_3D', geometry: multiGeos.lettersGeo });
      }
    } else if (activeMode === 'stencil-3d') {
      prefix = `estencil_${(stencilParams.text || stencilParams.imagePresetId || 'gabarito').toLowerCase().replace(/\s+/g, '_')}`;
      if (multiGeos.baseGeo && multiGeos.baseGeo.getAttribute('position')) {
        parts.push({ name: '01_Placa_Base_Vazada', geometry: multiGeos.baseGeo });
      }
      if (multiGeos.decorationsGeo && multiGeos.decorationsGeo.getAttribute('position')) {
        parts.push({ name: '02_Borda_Reforco_Alca', geometry: multiGeos.decorationsGeo });
      }
      if (multiGeos.lettersGeo && multiGeos.lettersGeo.getAttribute('position') && stencilParams.stencilMode === 'embossed') {
        parts.push({ name: '03_Relevo_Carimbo', geometry: multiGeos.lettersGeo });
      }
    }

    if (parts.length > 0) {
      downloadMultiPartSTLs(parts, prefix);
    } else if (geometry) {
      downloadSTL(geometry, `${prefix}.stl`);
    }

    try {
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.8 } });
    } catch (_) {}

    setTimeout(() => setIsExporting(false), 1000);
  }, [multiGeos, activeMode, dualTextParams, keychainParams, nameplateParams, stencilParams, geometry]);

  const handleExportOBJ = useCallback(() => {
    if (!geometry) return;
    const filename =
      activeMode === 'dual-text'
        ? `dual_text_${dualTextParams.wordA}_${dualTextParams.wordB}.obj`
        : 'modelo_3d.obj';
    exportToOBJ(geometry, filename);
  }, [geometry, activeMode, dualTextParams]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Top Navigation Header */}
      <header className="border-b border-slate-800/80 bg-slate-900/70 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500 via-indigo-600 to-cyan-500 p-0.5 shadow-lg shadow-indigo-500/20 flex items-center justify-center">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <Heart className="w-5 h-5 text-rose-400 fill-rose-500/20" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-100 to-indigo-200 bg-clip-text text-transparent">
                  Dual3D STL Studio
                </h1>
                <span className="px-2 py-0.5 rounded-full bg-rose-500/20 border border-rose-500/40 text-[10px] font-bold text-rose-300">
                  Gerador 3D para Impressão
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                Ilusão Dois Nomes, Chaveiros Articulados, Placas com Relevo, IA 3D e Utilitários Paramétricos
              </p>
            </div>
          </div>

          {/* Quick Export Actions */}
          <div className="flex items-center gap-2">
            {(activeMode === 'dual-text' || activeMode === 'keychain' || activeMode === 'desk-nameplate' || activeMode === 'stencil-3d') && (
              <button
                id="btn-export-multi-part"
                onClick={handleExportMultiPart}
                disabled={isExporting || !geometry}
                className="hidden sm:flex px-3 py-2 bg-slate-800/90 hover:bg-slate-700 text-indigo-300 hover:text-white rounded-xl text-xs font-semibold border border-indigo-500/30 transition-all items-center gap-1.5 shadow-sm"
                title="Exportar STLs separados por peça/cor (Ideal para Bambu Lab AMS ou pintura)"
              >
                <FolderArchive className="w-4 h-4 text-indigo-400" />
                <span>STLs Separados (Multi-Cor)</span>
              </button>
            )}

            <button
              id="btn-export-obj"
              onClick={handleExportOBJ}
              className="px-3 py-2 bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-semibold border border-slate-700/80 transition-colors flex items-center gap-1.5"
              title="Exportar no formato Wavefront OBJ"
            >
              <FileCode className="w-4 h-4 text-slate-400" />
              <span className="hidden sm:inline">OBJ</span>
            </button>

            <button
              id="btn-export-stl"
              onClick={handleExportSTL}
              disabled={isExporting || !geometry}
              className="px-4 py-2 bg-gradient-to-r from-rose-600 to-indigo-600 hover:from-rose-500 hover:to-indigo-500 text-white rounded-xl text-xs sm:text-sm font-bold shadow-lg shadow-rose-600/30 transition-all flex items-center gap-2 active:scale-95 disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              <span>Exportar STL Único</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 flex flex-col gap-6">
        {/* Mode Selector Tabs */}
        <div className="bg-slate-900/90 p-1.5 rounded-2xl border border-slate-800 shadow-xl overflow-x-auto flex gap-1.5">
          {[
            {
              id: 'dual-text' as GeneratorMode,
              label: 'Dois Nomes em 1 (Ilusão ±45°)',
              icon: Sparkles,
              badge: 'Principal',
            },
            {
              id: 'stencil-3d' as GeneratorMode,
              label: 'Estêncil 3D (Imagem & Frases)',
              icon: Stamp,
              badge: 'Novo',
            },
            {
              id: 'engineering-parts' as GeneratorMode,
              label: 'Peças Técnicas & Ferramentas (Foto)',
              icon: Wrench,
              badge: 'CAD',
            },
            {
              id: 'keychain' as GeneratorMode,
              label: 'Chaveiro com Nome (Fixo & Articulado)',
              icon: KeyRound,
            },
            {
              id: 'desk-nameplate' as GeneratorMode,
              label: 'Placa de Mesa / Letreiro Relevo',
              icon: Type,
            },
            {
              id: 'ai-prompt-model' as GeneratorMode,
              label: 'Criador 3D com IA (Gemini)',
              icon: Wand2,
              badge: 'IA',
            },
            {
              id: 'lithophane' as GeneratorMode,
              label: 'Foto Relevo / Litofania',
              icon: ImageIcon,
            },
            {
              id: 'mechanical-gear' as GeneratorMode,
              label: 'Engrenagens Mecânicas',
              icon: Cog,
            },
            {
              id: 'parametric-vase' as GeneratorMode,
              label: 'Vasos & Organizadores',
              icon: Box,
            },
            {
              id: 'qr-code-keychain' as GeneratorMode,
              label: 'QR Code 3D',
              icon: QrCode,
            },
          ].map((mode) => {
            const Icon = mode.icon;
            const isSelected = activeMode === mode.id;
            return (
              <button
                key={mode.id}
                id={`tab-mode-${mode.id}`}
                onClick={() => setActiveMode(mode.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                  isSelected
                    ? 'bg-gradient-to-r from-rose-600 to-indigo-600 text-white shadow-lg shadow-indigo-600/30 ring-1 ring-white/20'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <Icon className={`w-4 h-4 ${isSelected ? 'text-white' : 'text-slate-400'}`} />
                <span>{mode.label}</span>
                {mode.badge && (
                  <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase ${
                    mode.badge === 'IA' ? 'bg-amber-400/20 text-amber-300 border border-amber-400/40' : 'bg-white/20 text-white'
                  }`}>
                    {mode.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Two-Column Responsive Workspace */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Generator Controls (5 cols on lg) */}
          <div className="lg:col-span-5 space-y-6">
            {/* Active Mode Form */}
            {activeMode === 'dual-text' && (
              <DualTextControls params={dualTextParams} onChange={setDualTextParams} />
            )}
            {activeMode === 'stencil-3d' && (
              <StencilControls
                params={stencilParams}
                onChange={(updated) => setStencilParams((prev) => ({ ...prev, ...updated }))}
                onRegenerate={() => {}}
                isGenerating={isGenerating}
              />
            )}
            {activeMode === 'engineering-parts' && (
              <EngineeringPartsControls
                params={engineeringParams}
                onChange={setEngineeringParams}
              />
            )}
            {activeMode === 'keychain' && (
              <KeychainControls params={keychainParams} onChange={setKeychainParams} />
            )}
            {activeMode === 'desk-nameplate' && (
              <NameplateControls params={nameplateParams} onChange={setNameplateParams} />
            )}
            {activeMode === 'ai-prompt-model' && (
              <AIModelControls
                params={aiModelParams}
                blueprint={aiBlueprint}
                loading={isAiLoading}
                error={aiError}
                onGenerateAI={handleGenerateAI}
                onApplyPreset={handleApplyAIPreset}
                onChange={setAiModelParams}
              />
            )}
            {activeMode === 'lithophane' && (
              <LithophaneControls params={lithoParams} onChange={setLithoParams} />
            )}
            {activeMode === 'mechanical-gear' && (
              <GearControls params={gearParams} onChange={setGearParams} />
            )}
            {activeMode === 'parametric-vase' && (
              <VaseControls params={vaseParams} onChange={setVaseParams} />
            )}
            {activeMode === 'qr-code-keychain' && (
              <QrControls params={qrParams} onChange={setQrParams} />
            )}

            {/* Printing Tips & Instructions Box */}
            <div className="p-4 bg-slate-900/60 rounded-2xl border border-slate-800/80 space-y-2 text-xs text-slate-300">
              <div className="font-bold text-slate-200 flex items-center gap-1.5">
                <Info className="w-4 h-4 text-cyan-400" /> Dicas de Impressão 3D e Fatiamento:
              </div>
              <p className="leading-relaxed text-slate-400">
                {activeMode === 'dual-text' && (
                  <>
                    Cada letra é uma <strong>interseção anamórfica de ±45°</strong>. Ao olhar pela esquerda lê-se <strong>{dualTextParams.wordA}</strong> e pela direita lê-se <strong>{dualTextParams.wordB}</strong>. Imprima deitada diretamente na mesa sem suportes.
                  </>
                )}
                {activeMode === 'keychain' && (
                  <>
                    {keychainParams.type === 'flexi-articulated'
                      ? 'O modelo articulado é impresso de uma só vez (Print-in-Place). As letras giram livremente após a impressão.'
                      : 'O chaveiro possui base compacta e letras em alto relevo com orelha reforçada para argola.'}
                  </>
                )}
                {activeMode === 'desk-nameplate' && (
                  <>
                    A placa de mesa possui ângulo de leitura ergonômico ({nameplateParams.plateAngle}°) com letras sólidas em alto relevo destacadas.
                  </>
                )}
                {activeMode === 'lithophane' && (
                  <>
                    Para a litofania, utilize filamento PLA Branco com 100% de preenchimento (infill) e altura de camada de 0.12mm a 0.16mm.
                  </>
                )}
                {activeMode === 'mechanical-gear' && (
                  <>
                    Engrenagem com perfil de evolvente standard (Módulo {gearParams.module}mm, {gearParams.teeth} dentes) pronta para encaixe com eixos e motores.
                  </>
                )}
                {activeMode === 'ai-prompt-model' && (
                  <>
                    O modelo gerado por IA é composto por primitivas sólidas manifold já escaladas para volume padrão de impressão 3D (PLA / PETG).
                  </>
                )}
                {activeMode === 'parametric-vase' && (
                  <>
                    Pode ser impresso no "Modo Vaso / Spiralize Outer Contour" para paredes contínuas ultra rápidas ou no modo normal sólido.
                  </>
                )}
                {activeMode === 'qr-code-keychain' && (
                  <>
                    Imprima os primeiros milímetros da base em cor clara (Branco) e troque a cor nas camadas superiores (Preto) para contraste do leitor de celular.
                  </>
                )}
                {activeMode === 'stencil-3d' && (
                  <>
                    Estêncil 3D de precisão com <strong>1.4mm de espessura</strong> e borda rígida anti-empenamento. Ideal para polvilhar canela ou cacau em cappuccino, bolos ou pintura com spray. Imprima em PLA plano na mesa sem suportes.
                  </>
                )}
                {activeMode === 'engineering-parts' && (
                  <>
                    Peça técnica modelada parametricamente em milímetros reais. Chanfros de 45° e entalhes de acoplamento foram projetados para alta resistência ao cisalhamento e montagem suave sem folga excessiva. Recomendado imprimir em PETG, Nylon ou PLA+ com 4 perímetros e 40% a 100% de infill.
                  </>
                )}
              </p>
              <div className="flex items-center gap-2 pt-1 text-[11px] text-emerald-400 font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5" /> Compatível com Bambu Studio, Creality Print, Cura, PrusaSlicer e OrcaSlicer.
              </div>
            </div>
          </div>

          {/* Right Column: 3D Viewport, Slicing Preview & Metrics (7 cols on lg) */}
          <div className="lg:col-span-7 space-y-4 sticky top-20">
            {/* 3D Viewport Canvas */}
            <div className="relative h-[480px] w-full">
              <Viewport3D
                geometry={geometry}
                multiGeometries={multiGeos}
                multiColorMode={
                  (activeMode === 'dual-text' || activeMode === 'keychain' || activeMode === 'desk-nameplate') &&
                  multiColorPreview
                }
                materialPreset={materialPreset}
                wireframe={wireframe || (activeMode === 'engineering-parts' && engineeringParams.shadingMode === 'wireframe')}
                onMaterialChange={setMaterialPreset}
                onWireframeToggle={() => setWireframe(!wireframe)}
                onMultiColorToggle={
                  activeMode === 'dual-text' || activeMode === 'keychain' || activeMode === 'desk-nameplate'
                    ? () => setMultiColorPreview(!multiColorPreview)
                    : undefined
                }
                layerProgress={slicingProgress}
                wordA={dualTextParams.wordA}
                wordB={dualTextParams.wordB}
                isDualText={activeMode === 'dual-text'}
                viewAngle={dualTextParams.viewAngle}
                isStencil={activeMode === 'stencil-3d'}
                stencilParams={stencilParams}
                onStencilChange={(newP) => setStencilParams((prev) => ({ ...prev, ...newP }))}
              />
              {isGenerating && (
                <div className="absolute top-4 right-4 px-3 py-1 bg-indigo-600/90 backdrop-blur-md text-white text-xs font-semibold rounded-lg shadow-lg flex items-center gap-2 animate-pulse pointer-events-none">
                  <Cpu className="w-3.5 h-3.5 animate-spin" /> Recalculando Geometria 3D...
                </div>
              )}
            </div>

            {/* Slicing Layer Preview Simulator */}
            <SlicingPreviewSlider
              progress={slicingProgress}
              onChange={setSlicingProgress}
              heightMm={stats.dimensions.y || 45}
            />

            {/* 3D Printing Metrics & Statistics */}
            <PrintEstimator stats={stats} />

            {/* Download CTA Bar */}
            <div className="p-4 bg-gradient-to-r from-rose-950/40 via-indigo-950/40 to-slate-900 rounded-2xl border border-rose-900/30 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <h4 className="text-sm font-bold text-slate-100 flex items-center gap-1.5">
                  <Printer className="w-4 h-4 text-rose-400" /> Pronto para Impressão 3D (STL Sólido Manifold)
                </h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  Malha de alta precisão calibrada para bicos 0.4mm com 0.2mm de camada.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                {(activeMode === 'dual-text' || activeMode === 'keychain' || activeMode === 'desk-nameplate') && (
                  <button
                    id="btn-multi-part-bottom"
                    onClick={handleExportMultiPart}
                    disabled={isExporting || !geometry}
                    className="flex-1 sm:flex-initial px-4 py-3 bg-slate-800 hover:bg-slate-700 text-indigo-300 hover:text-white rounded-xl text-xs font-bold border border-indigo-500/40 transition-all flex items-center justify-center gap-1.5"
                    title="Baixar STLs separados por cor (Bambu AMS / Pintura)"
                  >
                    <FolderArchive className="w-4 h-4" /> Multi-Cor
                  </button>
                )}

                <button
                  id="btn-main-download-stl"
                  onClick={handleExportSTL}
                  disabled={isExporting || !geometry}
                  className="flex-1 sm:flex-initial px-6 py-3 bg-gradient-to-r from-rose-600 to-indigo-600 hover:from-rose-500 hover:to-indigo-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-rose-600/30 transition-all flex items-center justify-center gap-2 active:scale-95"
                >
                  <Download className="w-4 h-4" /> Baixar STL (.stl)
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
