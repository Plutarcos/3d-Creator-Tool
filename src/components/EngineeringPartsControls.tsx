import React, { useState } from 'react';
import {
  Wrench,
  Cog,
  CircleDot,
  Maximize2,
  Box,
  Layers,
  Sparkles,
  CheckCircle2,
  Sliders,
  ShieldCheck,
  Disc,
  Hammer,
  HelpCircle,
  FolderArchive,
  Info,
  Plus,
  Trash2,
  Eye,
  EyeOff,
  Copy,
  RotateCw,
  Scissors,
  Grid,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import {
  EngineeringPartsParams,
  EngineeringCategory,
  SleeveTopProfile,
  BoreType,
  NotchShape,
  ToothMode,
  ShadingMode,
  CadOperation,
  CadOpType,
} from '../types';
import {
  ENGINEERING_PRESETS,
  DEFAULT_CAD_OPERATIONS,
} from '../generators/engineeringPartsGenerator';

interface EngineeringPartsControlsProps {
  params: EngineeringPartsParams;
  onChange: (params: EngineeringPartsParams) => void;
}

export const EngineeringPartsControls: React.FC<EngineeringPartsControlsProps> = ({
  params,
  onChange,
}) => {
  const [activeTab, setActiveTab] = useState<'photo-designer' | 'free-cad' | 'presets'>(
    params.modelingMode === 'free-cad' ? 'free-cad' : 'photo-designer'
  );
  const [expandedOpId, setExpandedOpId] = useState<string | null>(null);

  const update = (partial: Partial<EngineeringPartsParams>) => {
    onChange({ ...params, ...partial });
  };

  const applyPreset = (presetParams: Partial<EngineeringPartsParams>) => {
    onChange({ ...params, ...presetParams, modelingMode: 'parametric' });
    setActiveTab('photo-designer');
  };

  // Switch between Parametric and Free CAD Studio
  const handleSwitchMode = (mode: 'parametric' | 'free-cad') => {
    update({ modelingMode: mode });
    setActiveTab(mode === 'free-cad' ? 'free-cad' : 'photo-designer');
  };

  // CAD Operations Management
  const handleToggleOp = (id: string) => {
    const next = (params.cadOperations || []).map((op) =>
      op.id === id ? { ...op, enabled: !op.enabled } : op
    );
    update({ cadOperations: next });
  };

  const handleDeleteOp = (id: string) => {
    const next = (params.cadOperations || []).filter((op) => op.id !== id);
    update({ cadOperations: next });
  };

  const handleDuplicateOp = (op: CadOperation) => {
    const newOp: CadOperation = {
      ...op,
      id: `op-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      name: `${op.name} (Cópia)`,
      params: { ...op.params },
    };
    update({ cadOperations: [...(params.cadOperations || []), newOp] });
  };

  const handleUpdateOpParams = (id: string, newParams: Record<string, any>) => {
    const next = (params.cadOperations || []).map((op) =>
      op.id === id ? { ...op, params: { ...op.params, ...newParams } } : op
    );
    update({ cadOperations: next });
  };

  const handleAddOp = (type: CadOpType, defaultName: string) => {
    const newOp: CadOperation = {
      id: `op-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      name: defaultName,
      enabled: true,
      type,
      params: {
        diameter: 14.0,
        topDiameter: 14.0,
        height: 10.0,
        sides: 72,
        posX: 0,
        posY: 0,
        posZ: 0,
        sizeX: 12.0,
        sizeY: 12.0,
        sizeZ: 10.0,
        toothCount: 2,
        toothWidth: 4.5,
        toothDepth: 5.0,
        boreDiameter: 8.0,
        boreDepth: 18.0,
        isThrough: true,
        chamferSize: 2.0,
      },
    };
    update({ cadOperations: [...(params.cadOperations || []), newOp] });
    setExpandedOpId(newOp.id);
  };

  const handleResetToPhotoPartCAD = () => {
    update({
      modelingMode: 'free-cad',
      cadOperations: JSON.parse(JSON.stringify(DEFAULT_CAD_OPERATIONS)),
    });
    setActiveTab('free-cad');
  };

  return (
    <div className="space-y-6">
      {/* Photo Reference Header Banner */}
      <div className="p-4 bg-gradient-to-br from-cyan-950/70 via-slate-900 to-indigo-950/70 rounded-2xl border border-cyan-500/40 shadow-xl">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-500/50 flex items-center justify-center text-cyan-400 shrink-0 shadow-inner">
              <Wrench className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm font-bold text-white tracking-wide">
                  Modelagem 3D Técnica & CAD Completo
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 border border-cyan-400/40 text-[10px] font-bold text-cyan-300">
                  Totalmente Personalizável
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                Recrie a peça da foto com precisão de dentes, chanfros e faces, ou use o Estúdio CAD livre para adicionar, extrudar e subtrair formas.
              </p>
            </div>
          </div>
        </div>

        {/* Studio Navigation Tabs */}
        <div className="mt-4 grid grid-cols-2 gap-2 p-1 bg-slate-950/80 rounded-xl border border-slate-800">
          <button
            type="button"
            onClick={() => handleSwitchMode('parametric')}
            className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold transition-all ${
              params.modelingMode === 'parametric'
                ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Disc className="w-4 h-4" />
            <span>Peça da Foto & Dimensões</span>
          </button>
          <button
            type="button"
            onClick={() => handleSwitchMode('free-cad')}
            className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold transition-all ${
              params.modelingMode === 'free-cad'
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Box className="w-4 h-4" />
            <span>Estúdio CAD (Adicionar/Subtrair)</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODE 1: PARAMETRIC & EXACT PHOTO PIECE CUSTOMIZER                        */}
      {/* ========================================================================= */}
      {params.modelingMode === 'parametric' && (
        <div className="space-y-5">
          {/* 1-Click Instant Presets Carousel */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Presets Prontos em 1 Clique
              </label>
              <span className="text-[10px] text-slate-500">Clique para carregar e personalizar</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
              {ENGINEERING_PRESETS.map((p) => {
                const isPhotoPart = p.id === 'photo-part';
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => applyPreset(p.params)}
                    className={`p-2.5 rounded-xl border text-left transition-all relative overflow-hidden group ${
                      isPhotoPart
                        ? 'bg-gradient-to-r from-cyan-950/70 to-slate-900 border-cyan-500/60 shadow-lg shadow-cyan-950/50 ring-1 ring-cyan-500/40'
                        : 'bg-slate-900/80 hover:bg-slate-850 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <span className={`text-xs font-bold ${isPhotoPart ? 'text-cyan-300' : 'text-slate-200'}`}>
                        {p.name}
                      </span>
                      {p.badge && (
                        <span
                          className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded-md uppercase tracking-wider ${
                            isPhotoPart
                              ? 'bg-amber-400/20 text-amber-300 border border-amber-400/40'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {p.badge}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400 line-clamp-1 leading-relaxed">
                      {p.description}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Category Selector Tabs */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-indigo-400" /> Categoria Mecânica
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 p-1 bg-slate-900/90 rounded-2xl border border-slate-800">
              {[
                { id: 'slotted-sleeve' as EngineeringCategory, label: 'Peça da Foto (Luva)', icon: Disc },
                { id: 'chamfered-bushing' as EngineeringCategory, label: 'Buchas Chanfradas', icon: CircleDot },
                { id: 'gears-pulleys' as EngineeringCategory, label: 'Engrenagens & Polias', icon: Cog },
                { id: 'tools-knobs' as EngineeringCategory, label: 'Ferramentas & Manípulos', icon: Hammer },
                { id: 'brackets-mounts' as EngineeringCategory, label: 'Cantoneiras & Suportes', icon: Box },
                { id: 'shafts-couplers' as EngineeringCategory, label: 'Eixos & Acopladores', icon: Sliders },
              ].map((cat) => {
                const Icon = cat.icon;
                const isSelected = params.category === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => update({ category: cat.id })}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all text-left ${
                      isSelected
                        ? 'bg-gradient-to-r from-cyan-600 to-indigo-600 text-white shadow-md'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                    }`}
                  >
                    <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-white' : 'text-slate-400'}`} />
                    <span className="truncate">{cat.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 1. SLOTTED SLEEVE / PEÇA DA FOTO (FULL CONTROL) */}
          {params.category === 'slotted-sleeve' && (
            <div className="space-y-4">
              {/* Box 1: Dentes & Ranhuras (Exact feature of the photo!) */}
              <div className="p-4 bg-gradient-to-br from-cyan-950/40 via-slate-900 to-slate-900 rounded-2xl border border-cyan-500/50 shadow-lg space-y-4">
                <div className="flex items-center justify-between border-b border-cyan-500/20 pb-2.5">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-cyan-400" />
                    <h4 className="text-xs font-bold uppercase tracking-wider text-cyan-200">
                      Dentes & Entalhes de Trava (Foto)
                    </h4>
                  </div>
                  <span className="text-[10px] text-amber-300 bg-amber-400/10 px-2 py-0.5 rounded-full border border-amber-400/20 font-mono">
                    {params.notchCount} {params.toothMode === 'protrusions' ? 'dente(s) saliente(s)' : 'entalhe(s)'}
                  </span>
                </div>

                {/* Tooth Mode: Slots vs Protruding Teeth */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-slate-300">
                    Comportamento dos Dentes
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => update({ toothMode: 'slots' })}
                      className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all text-left flex items-center gap-2 ${
                        params.toothMode === 'slots'
                          ? 'bg-cyan-600/30 border-cyan-500 text-white shadow-sm'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <Scissors className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                      <div>
                        <div>Entalhes Cortados (Foto)</div>
                        <div className="text-[10px] font-normal text-slate-400">Ranhuras rebaixadas na borda</div>
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => update({ toothMode: 'protrusions' })}
                      className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all text-left flex items-center gap-2 ${
                        params.toothMode === 'protrusions'
                          ? 'bg-cyan-600/30 border-cyan-500 text-white shadow-sm'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <Layers className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                      <div>
                        <div>Dentes Salientes</div>
                        <div className="text-[10px] font-normal text-slate-400">Garras frontais (Dog Clutch)</div>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Tooth Count & Quick Shortcuts */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-[11px] text-slate-300">
                    <span className="font-semibold">Quantidade de Dentes / Entalhes:</span>
                    <span className="font-mono text-cyan-400 font-bold text-xs">{params.notchCount} un.</span>
                  </div>
                  <div className="grid grid-cols-6 gap-1.5">
                    {[1, 2, 3, 4, 6, 8].map((n) => (
                      <button
                        key={n}
                        type="button"
                        onClick={() => update({ notchCount: n })}
                        className={`py-1.5 rounded-lg text-xs font-bold border transition-all ${
                          params.notchCount === n
                            ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-md'
                            : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                        }`}
                      >
                        {n} {n === 2 ? '⭐' : ''}
                      </button>
                    ))}
                  </div>
                  <input
                    type="range"
                    min={1}
                    max={24}
                    step={1}
                    value={params.notchCount}
                    onChange={(e) => update({ notchCount: parseInt(e.target.value, 10) || 1 })}
                    className="w-full accent-cyan-500 cursor-pointer"
                  />
                </div>

                {/* Tooth Dimensions: Width & Depth */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                      Largura do Dente (mm)
                    </label>
                    <input
                      type="number"
                      min={0.5}
                      max={params.outerDiameter * 1.5}
                      step={0.1}
                      value={params.notchWidth}
                      onChange={(e) => update({ notchWidth: parseFloat(e.target.value) || 4.5 })}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono text-xs focus:ring-2 focus:ring-cyan-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                      Altura / Profundidade (mm)
                    </label>
                    <input
                      type="number"
                      min={0.5}
                      max={params.totalHeight - 1}
                      step={0.5}
                      value={params.notchDepth}
                      onChange={(e) => update({ notchDepth: parseFloat(e.target.value) || 5.5 })}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono text-xs focus:ring-2 focus:ring-cyan-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                      Rotação / Offset (graus)
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={360}
                      step={5}
                      value={params.notchAngleOffset || 0}
                      onChange={(e) => update({ notchAngleOffset: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono text-xs focus:ring-2 focus:ring-cyan-500"
                    />
                  </div>
                </div>
              </div>

              {/* Box 2: Dimensões Cilíndricas, Lados e Conicidade de Faces */}
              <div className="p-4 bg-slate-900/90 rounded-2xl border border-slate-800 space-y-4 shadow-lg">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                  <div className="flex items-center gap-2">
                    <Maximize2 className="w-4 h-4 text-indigo-400" />
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                      Dimensões Gerais & Faces do Corpo
                    </h4>
                  </div>
                  <span className="text-[10px] text-cyan-400 font-mono bg-cyan-950/60 px-2 py-0.5 rounded-full border border-cyan-800">
                    Ø{params.outerDiameter} x {params.totalHeight} mm
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                      Ø Base Externo (mm)
                    </label>
                    <input
                      type="number"
                      min={2}
                      max={150}
                      step={0.5}
                      value={params.outerDiameter}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value) || 14;
                        update({
                          outerDiameter: val,
                          topDiameter: params.topDiameter === params.outerDiameter ? val : params.topDiameter,
                        });
                      }}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono text-xs focus:ring-2 focus:ring-cyan-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                      Ø Topo Externo (mm)
                    </label>
                    <input
                      type="number"
                      min={2}
                      max={150}
                      step={0.5}
                      value={params.topDiameter ?? params.outerDiameter}
                      onChange={(e) => update({ topDiameter: parseFloat(e.target.value) || 14 })}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono text-xs focus:ring-2 focus:ring-cyan-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                      Altura Total (mm)
                    </label>
                    <input
                      type="number"
                      min={3}
                      max={300}
                      step={0.5}
                      value={params.totalHeight}
                      onChange={(e) => update({ totalHeight: parseFloat(e.target.value) || 22 })}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono text-xs focus:ring-2 focus:ring-cyan-500"
                    />
                  </div>
                </div>

                {/* Faces & Lados (Number of sides / Polygons) */}
                <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 space-y-2">
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                      <Grid className="w-3.5 h-3.5 text-indigo-400" />
                      Faces & Lados do Corpo (Resolução da Malha):
                    </span>
                    <span className="font-mono text-cyan-400 font-bold">
                      {params.bodySides || 72} faces {params.bodySides === 6 ? '(Sextavado)' : params.bodySides === 8 ? '(Octogonal)' : params.bodySides >= 64 ? '(Cilíndrico Suave)' : ''}
                    </span>
                  </div>

                  <div className="grid grid-cols-6 gap-1.5">
                    {[
                      { s: 3, label: '3 (Tri)' },
                      { s: 4, label: '4 (Quad)' },
                      { s: 6, label: '6 (Hex)' },
                      { s: 8, label: '8 (Oct)' },
                      { s: 12, label: '12 Lados' },
                      { s: 72, label: '72 (Redondo)' },
                    ].map((item) => (
                      <button
                        key={item.s}
                        type="button"
                        onClick={() => update({ bodySides: item.s })}
                        className={`py-1 px-1.5 rounded-lg text-[10px] font-bold border transition-all text-center ${
                          (params.bodySides || 72) === item.s
                            ? 'bg-indigo-600 border-indigo-400 text-white'
                            : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>

                  <input
                    type="range"
                    min={3}
                    max={128}
                    step={1}
                    value={params.bodySides || 72}
                    onChange={(e) => update({ bodySides: parseInt(e.target.value, 10) || 72 })}
                    className="w-full accent-indigo-500 cursor-pointer"
                  />
                </div>
              </div>

              {/* Box 3: Furo Central (Passante, Cego ou Escalonado) */}
              <div className="p-4 bg-slate-900/90 rounded-2xl border border-slate-800 space-y-3.5 shadow-lg">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                  <div className="flex items-center gap-2">
                    <CircleDot className="w-4 h-4 text-emerald-400" />
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                      Furo Central Interno (Passante / Cego)
                    </h4>
                  </div>
                  <span className="text-[10px] text-emerald-400 font-mono bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-800">
                    Ø{params.innerDiameter} mm
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                      Ø Furo Central Principal (mm)
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={params.outerDiameter - 0.8}
                      step={0.5}
                      value={params.innerDiameter}
                      onChange={(e) => update({ innerDiameter: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono text-xs focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                      Tipo de Furo
                    </label>
                    <div className="grid grid-cols-2 gap-1.5">
                      <button
                        type="button"
                        onClick={() => update({ boreType: 'through' })}
                        className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all text-center ${
                          params.boreType === 'through'
                            ? 'bg-emerald-600/30 border-emerald-500 text-emerald-200'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        Passante
                      </button>
                      <button
                        type="button"
                        onClick={() => update({ boreType: 'blind' })}
                        className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all text-center ${
                          params.boreType === 'blind'
                            ? 'bg-emerald-600/30 border-emerald-500 text-emerald-200'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        Furo Cego
                      </button>
                    </div>
                  </div>
                </div>

                {params.boreType === 'blind' && (
                  <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 space-y-2">
                    <div className="flex justify-between text-[11px] text-slate-400">
                      <span>Profundidade do Furo Cego:</span>
                      <span className="text-emerald-400 font-mono">{params.blindBoreDepth} mm</span>
                    </div>
                    <input
                      type="range"
                      min={2}
                      max={params.totalHeight - 1}
                      step={0.5}
                      value={params.blindBoreDepth}
                      onChange={(e) => update({ blindBoreDepth: parseFloat(e.target.value) || 10 })}
                      className="w-full accent-emerald-500 cursor-pointer"
                    />
                  </div>
                )}
              </div>

              {/* Box 4: Topo Chanfrado / Arredondado (Foto) */}
              <div className="p-4 bg-slate-900/90 rounded-2xl border border-slate-800 space-y-3.5 shadow-lg">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-cyan-400" />
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                      Perfil do Topo (Chanfro Macio / Fillet da Foto)
                    </h4>
                  </div>
                  <span className="text-[10px] text-cyan-400 font-mono">
                    {params.topProfile}
                  </span>
                </div>

                <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5">
                  {[
                    { id: 'chamfered' as SleeveTopProfile, label: 'Chanfrado' },
                    { id: 'rounded' as SleeveTopProfile, label: 'Arredondado ⭐' },
                    { id: 'flat' as SleeveTopProfile, label: 'Plano 90°' },
                    { id: 'conical' as SleeveTopProfile, label: 'Cônico' },
                    { id: 'stepped' as SleeveTopProfile, label: 'Degrau' },
                  ].map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => update({ topProfile: p.id })}
                      className={`py-1.5 px-2 rounded-xl text-[11px] font-semibold border text-center transition-all ${
                        params.topProfile === p.id
                          ? 'bg-cyan-600/30 border-cyan-500 text-white shadow-sm'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <div className="flex justify-between text-[11px] text-slate-300 mb-1">
                      <span>Tamanho do Chanfro Superior:</span>
                      <span className="text-cyan-400 font-mono font-bold">{params.topChamferSize} mm</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={Math.max(1, (params.outerDiameter - params.innerDiameter) / 2)}
                      step={0.1}
                      value={params.topChamferSize}
                      onChange={(e) => update({ topChamferSize: parseFloat(e.target.value) || 0 })}
                      className="w-full accent-cyan-500 cursor-pointer"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-[11px] text-slate-300 mb-1">
                      <span>Chanfro da Borda Inferior:</span>
                      <span className="text-cyan-400 font-mono font-bold">{params.bottomChamferSize} mm</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={3.0}
                      step={0.1}
                      value={params.bottomChamferSize}
                      onChange={(e) => update({ bottomChamferSize: parseFloat(e.target.value) || 0 })}
                      className="w-full accent-cyan-500 cursor-pointer"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 2. CHAMFERED BUSHINGS */}
          {params.category === 'chamfered-bushing' && (
            <div className="p-4 bg-slate-900/90 rounded-2xl border border-slate-800 space-y-4 shadow-lg">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200 flex items-center gap-2">
                <CircleDot className="w-4 h-4 text-emerald-400" />
                Buchas & Espaçadores Chanfrados
              </h4>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'straight', label: 'Bucha Reta' },
                  { id: 'flanged', label: 'Com Flange' },
                  { id: 'hex-spacer', label: 'Sextavada (Standoff)' },
                ].map((bt) => (
                  <button
                    key={bt.id}
                    type="button"
                    onClick={() => update({ bushingType: bt.id as any })}
                    className={`py-2 px-2 rounded-xl text-xs font-semibold border text-center transition-all ${
                      params.bushingType === bt.id
                        ? 'bg-emerald-600/30 border-emerald-500 text-emerald-200'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {bt.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODE 2: FREE CAD STUDIO (ADD, EXTRUDE, SUBTRACT & MODIFY FACES)          */}
      {/* ========================================================================= */}
      {params.modelingMode === 'free-cad' && (
        <div className="space-y-5">
          {/* Quick CAD Action Bar */}
          <div className="p-4 bg-gradient-to-br from-indigo-950/60 via-slate-900 to-purple-950/60 rounded-2xl border border-indigo-500/40 shadow-xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Box className="w-4 h-4 text-indigo-400" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-white">
                  Árvore de Modelagem 3D (CAD CSG)
                </h4>
              </div>
              <button
                type="button"
                onClick={handleResetToPhotoPartCAD}
                className="px-2.5 py-1 bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-400/40 text-indigo-300 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-all"
              >
                <Sparkles className="w-3 h-3 text-amber-400" />
                Carregar Peça da Foto no CAD
              </button>
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              Adicione formas e extrusões (+), ou subtraia e corte furos e dentes (-). Modifique parâmetros, faces e vértices em tempo real.
            </p>

            {/* Quick Add / Subtract Buttons */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 pt-1">
              <button
                type="button"
                onClick={() => handleAddOp('add-cylinder', '+ Cilindro / Extrusão')}
                className="py-1.5 px-2 bg-slate-950 hover:bg-slate-900 border border-indigo-500/30 hover:border-indigo-400 text-indigo-300 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all"
              >
                <Plus className="w-3.5 h-3.5 text-indigo-400" /> + Cilindro
              </button>
              <button
                type="button"
                onClick={() => handleAddOp('add-box', '+ Bloco / Caixa')}
                className="py-1.5 px-2 bg-slate-950 hover:bg-slate-900 border border-indigo-500/30 hover:border-indigo-400 text-indigo-300 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all"
              >
                <Plus className="w-3.5 h-3.5 text-indigo-400" /> + Bloco
              </button>
              <button
                type="button"
                onClick={() => handleAddOp('subtract-bore', '- Subtrair Furo')}
                className="py-1.5 px-2 bg-slate-950 hover:bg-slate-900 border border-rose-500/30 hover:border-rose-400 text-rose-300 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all"
              >
                <Scissors className="w-3.5 h-3.5 text-rose-400" /> - Furo
              </button>
              <button
                type="button"
                onClick={() => handleAddOp('subtract-notches', '- Subtrair Dentes')}
                className="py-1.5 px-2 bg-slate-950 hover:bg-slate-900 border border-rose-500/30 hover:border-rose-400 text-rose-300 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all"
              >
                <Scissors className="w-3.5 h-3.5 text-rose-400" /> - Dentes
              </button>
            </div>
          </div>

          {/* Operations List / Modifier Stack */}
          <div className="space-y-2.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
              <span>Operações Ativas ({params.cadOperations?.length || 0})</span>
              <span className="text-[10px] text-slate-500">Ordem de execução top-down</span>
            </label>

            {(params.cadOperations || []).map((op, idx) => {
              const isExpanded = expandedOpId === op.id;
              const isSubtractive = op.type.startsWith('subtract-');

              return (
                <div
                  key={op.id}
                  className={`rounded-2xl border transition-all ${
                    op.enabled
                      ? isSubtractive
                        ? 'bg-slate-900/90 border-rose-500/40 shadow-sm'
                        : 'bg-slate-900/90 border-indigo-500/40 shadow-sm'
                      : 'bg-slate-950/60 border-slate-800 opacity-60'
                  }`}
                >
                  {/* Operation Header */}
                  <div className="p-3 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleToggleOp(op.id)}
                        className={`p-1.5 rounded-lg border transition-all ${
                          op.enabled
                            ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40'
                            : 'bg-slate-800 text-slate-500 border-slate-700'
                        }`}
                        title={op.enabled ? 'Desativar operação' : 'Ativar operação'}
                      >
                        {op.enabled ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                      </button>

                      <span className="text-xs font-bold text-slate-200">
                        {op.name}
                      </span>

                      <span
                        className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md uppercase tracking-wider ${
                          isSubtractive
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                            : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40'
                        }`}
                      >
                        {isSubtractive ? 'Subtração / Corte' : 'Adição / Extrusão'}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleDuplicateOp(op)}
                        className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-all"
                        title="Duplicar operação"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteOp(op.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition-all"
                        title="Excluir operação"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setExpandedOpId(isExpanded ? null : op.id)}
                        className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-all"
                      >
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Operation Details (Expanded) */}
                  {isExpanded && (
                    <div className="p-3.5 pt-0 border-t border-slate-800/80 mt-1 space-y-3">
                      {/* Name editor */}
                      <div>
                        <label className="block text-[10px] font-semibold text-slate-400 mb-1">
                          Nome do Passo CAD
                        </label>
                        <input
                          type="text"
                          value={op.name}
                          onChange={(e) => {
                            const next = (params.cadOperations || []).map((o) =>
                              o.id === op.id ? { ...o, name: e.target.value } : o
                            );
                            update({ cadOperations: next });
                          }}
                          className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-white text-xs font-mono"
                        />
                      </div>

                      {/* Add Cylinder / Extrusion Params */}
                      {op.type === 'add-cylinder' && (
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                          <div>
                            <label className="block text-[10px] text-slate-400 mb-0.5">Ø Base (mm)</label>
                            <input
                              type="number"
                              value={op.params.diameter || 14}
                              onChange={(e) =>
                                handleUpdateOpParams(op.id, { diameter: parseFloat(e.target.value) || 14 })
                              }
                              className="w-full px-2 py-1 bg-slate-950 border border-slate-700 rounded-lg text-white font-mono text-xs"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] text-slate-400 mb-0.5">Ø Topo (mm)</label>
                            <input
                              type="number"
                              value={op.params.topDiameter ?? op.params.diameter ?? 14}
                              onChange={(e) =>
                                handleUpdateOpParams(op.id, { topDiameter: parseFloat(e.target.value) || 14 })
                              }
                              className="w-full px-2 py-1 bg-slate-950 border border-slate-700 rounded-lg text-white font-mono text-xs"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] text-slate-400 mb-0.5">Altura Z (mm)</label>
                            <input
                              type="number"
                              value={op.params.height || 22}
                              onChange={(e) =>
                                handleUpdateOpParams(op.id, { height: parseFloat(e.target.value) || 22 })
                              }
                              className="w-full px-2 py-1 bg-slate-950 border border-slate-700 rounded-lg text-white font-mono text-xs"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] text-slate-400 mb-0.5">Lados/Faces</label>
                            <input
                              type="number"
                              min={3}
                              max={128}
                              value={op.params.sides || 72}
                              onChange={(e) =>
                                handleUpdateOpParams(op.id, { sides: parseInt(e.target.value, 10) || 72 })
                              }
                              className="w-full px-2 py-1 bg-slate-950 border border-slate-700 rounded-lg text-white font-mono text-xs"
                            />
                          </div>
                        </div>
                      )}

                      {/* Subtract Notches / Teeth Params */}
                      {op.type === 'subtract-notches' && (
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                          <div>
                            <label className="block text-[10px] text-slate-400 mb-0.5">Qtd Dentes</label>
                            <input
                              type="number"
                              min={1}
                              max={32}
                              value={op.params.toothCount || 2}
                              onChange={(e) =>
                                handleUpdateOpParams(op.id, { toothCount: parseInt(e.target.value, 10) || 2 })
                              }
                              className="w-full px-2 py-1 bg-slate-950 border border-slate-700 rounded-lg text-white font-mono text-xs"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] text-slate-400 mb-0.5">Largura (mm)</label>
                            <input
                              type="number"
                              step={0.1}
                              value={op.params.toothWidth || 4.5}
                              onChange={(e) =>
                                handleUpdateOpParams(op.id, { toothWidth: parseFloat(e.target.value) || 4.5 })
                              }
                              className="w-full px-2 py-1 bg-slate-950 border border-slate-700 rounded-lg text-white font-mono text-xs"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] text-slate-400 mb-0.5">Profundidade (mm)</label>
                            <input
                              type="number"
                              step={0.5}
                              value={op.params.toothDepth || 5.5}
                              onChange={(e) =>
                                handleUpdateOpParams(op.id, { toothDepth: parseFloat(e.target.value) || 5.5 })
                              }
                              className="w-full px-2 py-1 bg-slate-950 border border-slate-700 rounded-lg text-white font-mono text-xs"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] text-slate-400 mb-0.5">Offset Ângulo (°)</label>
                            <input
                              type="number"
                              value={op.params.angleOffset || 0}
                              onChange={(e) =>
                                handleUpdateOpParams(op.id, { angleOffset: parseFloat(e.target.value) || 0 })
                              }
                              className="w-full px-2 py-1 bg-slate-950 border border-slate-700 rounded-lg text-white font-mono text-xs"
                            />
                          </div>
                        </div>
                      )}

                      {/* Subtract Bore Params */}
                      {op.type === 'subtract-bore' && (
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-[10px] text-slate-400 mb-0.5">Ø Furo (mm)</label>
                            <input
                              type="number"
                              step={0.5}
                              value={op.params.boreDiameter || 8.0}
                              onChange={(e) =>
                                handleUpdateOpParams(op.id, { boreDiameter: parseFloat(e.target.value) || 8.0 })
                              }
                              className="w-full px-2 py-1 bg-slate-950 border border-slate-700 rounded-lg text-white font-mono text-xs"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] text-slate-400 mb-0.5">Profundidade (mm)</label>
                            <input
                              type="number"
                              step={0.5}
                              value={op.params.boreDepth || 22.0}
                              onChange={(e) =>
                                handleUpdateOpParams(op.id, { boreDepth: parseFloat(e.target.value) || 22.0 })
                              }
                              className="w-full px-2 py-1 bg-slate-950 border border-slate-700 rounded-lg text-white font-mono text-xs"
                            />
                          </div>
                        </div>
                      )}

                      {/* Subtract Chamfer Params */}
                      {op.type === 'subtract-chamfer' && (
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-[10px] text-slate-400 mb-0.5">Tamanho do Chanfro (mm)</label>
                            <input
                              type="number"
                              step={0.2}
                              value={op.params.chamferSize || 2.2}
                              onChange={(e) =>
                                handleUpdateOpParams(op.id, { chamferSize: parseFloat(e.target.value) || 2.2 })
                              }
                              className="w-full px-2 py-1 bg-slate-950 border border-slate-700 rounded-lg text-white font-mono text-xs"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] text-slate-400 mb-0.5">Ângulo (°)</label>
                            <input
                              type="number"
                              value={op.params.chamferAngle || 45}
                              onChange={(e) =>
                                handleUpdateOpParams(op.id, { chamferAngle: parseFloat(e.target.value) || 45 })
                              }
                              className="w-full px-2 py-1 bg-slate-950 border border-slate-700 rounded-lg text-white font-mono text-xs"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* GLOBAL VIEW & SHADING CONTROLS (FACES, VÉRTICES & ESCALA)                */}
      {/* ========================================================================= */}
      <div className="p-4 bg-slate-900/90 rounded-2xl border border-slate-800 space-y-3.5 shadow-lg">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-cyan-400" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">
              Inspeção de Malha (Faces & Vértices)
            </h4>
          </div>
          <span className="text-[10px] text-cyan-400 font-mono">
            {params.shadingMode}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => update({ shadingMode: 'smooth' })}
            className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all text-center ${
              params.shadingMode === 'smooth'
                ? 'bg-cyan-600/30 border-cyan-500 text-cyan-200 shadow-sm'
                : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            Sombreado Suave (Smooth)
          </button>
          <button
            type="button"
            onClick={() => update({ shadingMode: 'flat' })}
            className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all text-center ${
              params.shadingMode === 'flat'
                ? 'bg-cyan-600/30 border-cyan-500 text-cyan-200 shadow-sm'
                : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            Faces Planas (Flat Facets)
          </button>
        </div>

        {/* XYZ Independent Scale */}
        <div className="space-y-1.5 pt-1">
          <div className="flex justify-between text-[11px] text-slate-400">
            <span>Escala Global Independente (X, Y, Z):</span>
            <span className="font-mono text-cyan-400">
              {params.scaleX.toFixed(2)}x, {params.scaleY.toFixed(2)}x, {params.scaleZ.toFixed(2)}x
            </span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <span className="block text-[10px] text-slate-500 mb-0.5">Eixo X</span>
              <input
                type="number"
                step={0.1}
                min={0.1}
                max={5.0}
                value={params.scaleX}
                onChange={(e) => update({ scaleX: parseFloat(e.target.value) || 1.0 })}
                className="w-full px-2 py-1 bg-slate-950 border border-slate-700 rounded-lg text-white font-mono text-xs"
              />
            </div>
            <div>
              <span className="block text-[10px] text-slate-500 mb-0.5">Eixo Y</span>
              <input
                type="number"
                step={0.1}
                min={0.1}
                max={5.0}
                value={params.scaleY}
                onChange={(e) => update({ scaleY: parseFloat(e.target.value) || 1.0 })}
                className="w-full px-2 py-1 bg-slate-950 border border-slate-700 rounded-lg text-white font-mono text-xs"
              />
            </div>
            <div>
              <span className="block text-[10px] text-slate-500 mb-0.5">Eixo Z</span>
              <input
                type="number"
                step={0.1}
                min={0.1}
                max={5.0}
                value={params.scaleZ}
                onChange={(e) => update({ scaleZ: parseFloat(e.target.value) || 1.0 })}
                className="w-full px-2 py-1 bg-slate-950 border border-slate-700 rounded-lg text-white font-mono text-xs"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
