import React, { useRef, useState } from 'react';
import {
  Image as ImageIcon,
  Type,
  Maximize2,
  Sliders,
  Sparkles,
  Upload,
  RotateCcw,
  Coffee,
  Check,
  HelpCircle,
  Layers,
  Stamp,
  Circle,
  Square,
  Heart,
  Hexagon,
  Anchor,
  Minimize2,
  Move,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  RotateCw,
  Crosshair,
  SlidersHorizontal,
} from 'lucide-react';
import { StencilParams, FontChoice, StencilShape, StencilTextPosition, StencilHandlePosition, StencilMode } from '../types';
import { STENCIL_PRESETS } from '../generators/stencilGenerator';

interface StencilControlsProps {
  params: StencilParams;
  onChange: (updated: Partial<StencilParams>) => void;
  onRegenerate: () => void;
  isGenerating?: boolean;
}

const FONT_OPTIONS: { id: FontChoice; label: string; stencilReady?: boolean }[] = [
  { id: 'Black Ops One', label: 'Black Ops One (Stencil Nativo c/ Pontes)', stencilReady: true },
  { id: 'Bungee', label: 'Bungee (Robusto & Moderno)' },
  { id: 'Alfa Slab One', label: 'Alfa Slab One (Slab Pesado)' },
  { id: 'Fredoka', label: 'Fredoka (Arredondado & Suave)' },
  { id: 'Space Grotesk', label: 'Space Grotesk (Técnico / Limpo)' },
  { id: 'Cinzel', label: 'Cinzel (Clássico / Elegante)' },
  { id: 'Plus Jakarta Sans', label: 'Plus Jakarta Sans (Geométrico)' },
  { id: 'Montserrat', label: 'Montserrat (Moderno)' },
  { id: 'Oswald', label: 'Oswald (Condensado Alto)' },
  { id: 'Righteous', label: 'Righteous (Retro Futurista)' },
  { id: 'Orbitron', label: 'Orbitron (Sci-Fi)' },
  { id: 'Bangers', label: 'Bangers (Quadrinhos / Comic)' },
];

const SHAPES: { id: StencilShape; label: string; icon: React.FC<{ className?: string }> }[] = [
  { id: 'circle', label: 'Circular (Café / Copo)', icon: Circle },
  { id: 'rounded-rect', label: 'Retângulo Curvo', icon: Square },
  { id: 'rectangle', label: 'Retangular', icon: Square },
  { id: 'heart', label: 'Coração', icon: Heart },
  { id: 'hexagon', label: 'Hexágono', icon: Hexagon },
  { id: 'oval', label: 'Oval', icon: Circle },
];

export const StencilControls: React.FC<StencilControlsProps> = ({
  params,
  onChange,
  onRegenerate,
  isGenerating = false,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedElement, setSelectedElement] = useState<'image' | 'text'>('image');
  const padRef = useRef<HTMLDivElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        onChange({
          imageUrl: dataUrl,
          imagePresetId: 'custom-image',
        });
      }
    };
    reader.readAsDataURL(file);
  };

  const handlePadPointer = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!padRef.current) return;
    const rect = padRef.current.getBoundingClientRect();
    const relX = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const relY = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));

    // Convert to mm (-params.width/2 to +params.width/2)
    const mmX = Math.round((relX - 0.5) * (params.width * 0.8));
    const mmY = Math.round((relY - 0.5) * (params.height * 0.8));

    if (selectedElement === 'image') {
      onChange({ imageOffsetX: mmX, imageOffsetY: mmY });
    } else {
      onChange({ textOffsetX: mmX, textOffsetY: mmY });
    }
  };

  const nudge = (dx: number, dy: number) => {
    if (selectedElement === 'image') {
      onChange({
        imageOffsetX: Math.max(-45, Math.min(45, (params.imageOffsetX || 0) + dx)),
        imageOffsetY: Math.max(-45, Math.min(45, (params.imageOffsetY || 0) + dy)),
      });
    } else {
      onChange({
        textOffsetX: Math.max(-45, Math.min(45, (params.textOffsetX || 0) + dx)),
        textOffsetY: Math.max(-45, Math.min(45, (params.textOffsetY || 0) + dy)),
      });
    }
  };

  return (
    <div className="space-y-6 text-sm text-slate-300">
      {/* Top Banner / Mode indicator */}
      <div className="p-3.5 rounded-xl bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-indigo-500/15 border border-amber-500/30">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-amber-500/20 text-amber-400">
            <Stamp className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold text-white text-base">Gerador de Estêncil 3D</h3>
            <p className="text-xs text-slate-300">
              Crie moldes e gabaritos vazados ou carimbos para pintura, confeitaria (latte art/bolos), café e artesanato.
            </p>
          </div>
        </div>
      </div>

      {/* 0. Posicionamento Livre & Diagramação Visual (Layout Pad) */}
      <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-white font-medium">
            <Move className="w-4 h-4 text-emerald-400" />
            <span>Posicionamento dos Elementos no Estêncil</span>
          </div>
          <div className="flex items-center gap-1 bg-slate-800 p-0.5 rounded-lg border border-slate-700">
            <button
              type="button"
              onClick={() => setSelectedElement('image')}
              className={`px-2.5 py-1 rounded text-xs font-medium transition flex items-center gap-1.5 ${
                selectedElement === 'image'
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <ImageIcon className="w-3.5 h-3.5" />
              <span>Imagem</span>
            </button>
            <button
              type="button"
              onClick={() => setSelectedElement('text')}
              className={`px-2.5 py-1 rounded text-xs font-medium transition flex items-center gap-1.5 ${
                selectedElement === 'text'
                  ? 'bg-sky-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Type className="w-3.5 h-3.5" />
              <span>Texto</span>
            </button>
          </div>
        </div>

        {/* Interactive 2D Visual Pad */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
          {/* Mini 2D Canvas Pad */}
          <div className="sm:col-span-7 flex flex-col items-center">
            <div
              ref={padRef}
              onPointerDown={handlePadPointer}
              className={`relative w-full aspect-square max-w-[220px] bg-slate-950/80 border-2 rounded-2xl cursor-crosshair overflow-hidden shadow-inner flex items-center justify-center select-none ${
                selectedElement === 'image' ? 'border-amber-500/50 ring-1 ring-amber-500/20' : 'border-sky-500/50 ring-1 ring-sky-500/20'
              }`}
              title="Clique para posicionar o elemento selecionado"
            >
              {/* Subtle Grid Lines & Center Crosshair */}
              <div className="absolute inset-0 pointer-events-none opacity-20 bg-[linear-gradient(to_right,#888_1px,transparent_1px),linear-gradient(to_bottom,#888_1px,transparent_1px)] bg-[size:20px_20px]" />
              <div className="absolute w-full h-px bg-slate-700/60 pointer-events-none" />
              <div className="absolute h-full w-px bg-slate-700/60 pointer-events-none" />

              {/* Stencil Plate Outline Preview */}
              <div
                className={`absolute pointer-events-none border border-dashed border-slate-600/80 ${
                  params.shape === 'circle' || params.shape === 'oval' ? 'rounded-full' : 'rounded-xl'
                }`}
                style={{ width: '80%', height: '80%' }}
              />

              {/* Image Element Position Badge */}
              <div
                className={`absolute transition-all duration-150 pointer-events-none ${
                  selectedElement === 'image'
                    ? 'ring-2 ring-amber-400 z-20 scale-110 shadow-lg'
                    : 'opacity-75 z-10'
                }`}
                style={{
                  left: `${50 + ((params.imageOffsetX || 0) / (params.width * 0.8)) * 100}%`,
                  top: `${50 + ((params.imageOffsetY || 0) / (params.height * 0.8)) * 100}%`,
                  transform: `translate(-50%, -50%) rotate(${params.imageRotation || 0}deg)`,
                }}
              >
                <div className="px-2 py-1 rounded bg-amber-500/90 text-slate-950 text-[10px] font-bold flex items-center gap-1 shadow">
                  <ImageIcon className="w-3 h-3" />
                  <span>IMG</span>
                </div>
              </div>

              {/* Text Element Position Badge */}
              {Boolean(params.text && params.text.trim().length > 0) && (
                <div
                  className={`absolute transition-all duration-150 pointer-events-none ${
                    selectedElement === 'text'
                      ? 'ring-2 ring-sky-400 z-20 scale-110 shadow-lg'
                      : 'opacity-75 z-10'
                  }`}
                  style={{
                    left: `${50 + ((params.textOffsetX || 0) / (params.width * 0.8)) * 100}%`,
                    top: `${50 + ((params.textOffsetY || 0) / (params.height * 0.8)) * 100}%`,
                    transform: `translate(-50%, -50%) rotate(${params.textRotation || 0}deg)`,
                  }}
                >
                  <div className="px-2 py-1 rounded bg-sky-500/90 text-slate-950 text-[10px] font-bold flex items-center gap-1 shadow">
                    <Type className="w-3 h-3" />
                    <span>TXT</span>
                  </div>
                </div>
              )}
            </div>
            <span className="text-[10px] text-slate-500 mt-1">Toque no gabarito para mover</span>
          </div>

          {/* Direct Directional Nudge Pad & Quick Actions */}
          <div className="sm:col-span-5 flex flex-col justify-center space-y-2.5">
            <div className="text-xs text-slate-400 text-center font-medium">
              Ajuste Fino ({selectedElement === 'image' ? 'Imagem' : 'Texto'})
            </div>

            {/* 4-way arrow controls */}
            <div className="flex flex-col items-center gap-1">
              <button
                type="button"
                onClick={() => nudge(0, -3)}
                className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 active:bg-slate-600 border border-slate-700 text-slate-200 flex items-center justify-center transition"
                title="Mover para Cima (-3mm)"
              >
                <ArrowUp className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => nudge(-3, 0)}
                  className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 active:bg-slate-600 border border-slate-700 text-slate-200 flex items-center justify-center transition"
                  title="Mover para Esquerda (-3mm)"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (selectedElement === 'image') {
                      onChange({ imageOffsetX: 0, imageOffsetY: 0 });
                    } else {
                      onChange({ textOffsetX: 0, textOffsetY: 0 });
                    }
                  }}
                  className="w-8 h-8 rounded-lg bg-slate-800/80 hover:bg-slate-700 active:bg-slate-600 border border-slate-700 text-amber-400 flex items-center justify-center transition"
                  title="Centralizar no Meio (0, 0)"
                >
                  <Crosshair className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => nudge(3, 0)}
                  className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 active:bg-slate-600 border border-slate-700 text-slate-200 flex items-center justify-center transition"
                  title="Mover para Direita (+3mm)"
                >
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>

              <button
                type="button"
                onClick={() => nudge(0, 3)}
                className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 active:bg-slate-600 border border-slate-700 text-slate-200 flex items-center justify-center transition"
                title="Mover para Baixo (+3mm)"
              >
                <ArrowDown className="w-4 h-4" />
              </button>
            </div>

            {/* Quick action buttons */}
            <div className="grid grid-cols-2 gap-1.5 pt-1">
              <button
                type="button"
                onClick={() => {
                  if (selectedElement === 'image') {
                    onChange({ imageRotation: (((params.imageRotation || 0) + 45) % 360) });
                  } else {
                    onChange({ textRotation: (((params.textRotation || 0) + 45) % 360) });
                  }
                }}
                className="py-1 px-2 rounded-lg bg-slate-800 hover:bg-slate-750 border border-slate-700 text-[11px] text-slate-300 flex items-center justify-center gap-1 transition"
              >
                <RotateCw className="w-3 h-3" />
                <span>Girar 45°</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (selectedElement === 'image') {
                    onChange({ imageOffsetX: 0, imageOffsetY: 0, imageRotation: 0 });
                  } else {
                    onChange({ textOffsetX: 0, textOffsetY: 0, textRotation: 0 });
                  }
                }}
                className="py-1 px-2 rounded-lg bg-slate-800 hover:bg-slate-750 border border-slate-700 text-[11px] text-slate-300 flex items-center justify-center gap-1 transition"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Resetar</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 1. Imagem e Silhueta */}
      <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-white font-medium">
            <ImageIcon className="w-4 h-4 text-amber-400" />
            <span>Imagem / Silhueta do Estêncil</span>
          </div>
          <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
            {params.imagePresetId === 'custom-image' ? 'Imagem Própria' : 'Silhueta Pronta'}
          </span>
        </div>

        {/* Preset Selector */}
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1.5">
            Biblioteca de Silhuetas Prontas
          </label>
          <select
            value={params.imagePresetId}
            onChange={(e) => onChange({ imagePresetId: e.target.value })}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
          >
            {STENCIL_PRESETS.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.category})
              </option>
            ))}
          </select>
        </div>

        {/* Upload Button & Dropzone */}
        <div>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept="image/png,image/jpeg,image/svg+xml,image/webp"
            className="hidden"
          />

          <div
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-colors ${
              params.imageUrl && params.imagePresetId === 'custom-image'
                ? 'border-amber-500/50 bg-amber-500/5'
                : 'border-slate-700 hover:border-amber-500/60 bg-slate-800/50'
            }`}
          >
            {params.imageUrl && params.imagePresetId === 'custom-image' ? (
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <img
                    src={params.imageUrl}
                    alt="Preview"
                    className="w-12 h-12 rounded object-contain bg-white/10 p-1 border border-white/20"
                  />
                  <div className="text-left">
                    <p className="text-xs font-semibold text-amber-300">Sua Imagem Carregada</p>
                    <p className="text-[11px] text-slate-400">Clique para substituir por outro arquivo PNG/JPG</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onChange({ imageUrl: '', imagePresetId: 'coffee' });
                  }}
                  className="px-2.5 py-1 text-xs text-rose-400 hover:bg-rose-500/10 rounded-lg transition"
                >
                  Remover
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center gap-1.5 py-1">
                <Upload className="w-5 h-5 text-amber-400" />
                <p className="text-xs font-medium text-white">Carregar Imagem PNG ou JPG</p>
                <p className="text-[11px] text-slate-400">
                  Preferência: PNG transparente com desenho preto/escuro
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Image Controls: Invert & Threshold */}
        <div className="grid grid-cols-2 gap-3 pt-1">
          <div>
            <label className="block text-xs text-slate-400 mb-1">Interpretação do Recorte</label>
            <button
              type="button"
              onClick={() => onChange({ invertImage: !params.invertImage })}
              className={`w-full py-1.5 px-2.5 rounded-lg border text-xs font-medium transition flex items-center justify-center gap-1.5 ${
                params.invertImage
                  ? 'bg-amber-500/20 border-amber-500/50 text-amber-300'
                  : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-750'
              }`}
            >
              <span>{params.invertImage ? 'Preto é o Furo (Vazado)' : 'Branco é o Furo (Invertido)'}</span>
            </button>
          </div>

          <div>
            <div className="flex justify-between text-xs text-slate-400 mb-1">
              <span>Sensibilidade (Limiar)</span>
              <span className="text-white font-mono">{params.threshold}</span>
            </div>
            <input
              type="range"
              min="10"
              max="245"
              step="5"
              value={params.threshold}
              onChange={(e) => onChange({ threshold: parseInt(e.target.value, 10) })}
              className="w-full accent-amber-500"
            />
          </div>
        </div>

        {/* Scale, Offsets & Rotation */}
        <div className="space-y-2.5 pt-1">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div>
              <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                <span>Tamanho</span>
                <span className="text-white font-mono">{Math.round(params.imageScale * 100)}%</span>
              </div>
              <input
                type="range"
                min="0.3"
                max="1.6"
                step="0.05"
                value={params.imageScale}
                onChange={(e) => onChange({ imageScale: parseFloat(e.target.value) })}
                className="w-full accent-amber-500"
              />
            </div>

            <div>
              <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                <span>Posição X</span>
                <span className="text-white font-mono">{(params.imageOffsetX || 0) > 0 ? `+${params.imageOffsetX}mm` : `${params.imageOffsetX || 0}mm`}</span>
              </div>
              <input
                type="range"
                min="-45"
                max="45"
                step="1"
                value={params.imageOffsetX || 0}
                onChange={(e) => onChange({ imageOffsetX: parseInt(e.target.value, 10) })}
                className="w-full accent-amber-500"
              />
            </div>

            <div>
              <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                <span>Posição Y</span>
                <span className="text-white font-mono">{(params.imageOffsetY || 0) > 0 ? `+${params.imageOffsetY}mm` : `${params.imageOffsetY || 0}mm`}</span>
              </div>
              <input
                type="range"
                min="-45"
                max="45"
                step="1"
                value={params.imageOffsetY || 0}
                onChange={(e) => onChange({ imageOffsetY: parseInt(e.target.value, 10) })}
                className="w-full accent-amber-500"
              />
            </div>

            <div>
              <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                <span>Rotação</span>
                <span className="text-white font-mono">{params.imageRotation || 0}°</span>
              </div>
              <input
                type="range"
                min="-180"
                max="180"
                step="5"
                value={params.imageRotation || 0}
                onChange={(e) => onChange({ imageRotation: parseInt(e.target.value, 10) })}
                className="w-full accent-amber-500"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-0.5">
            <button
              type="button"
              onClick={() => onChange({ imageOffsetX: 0, imageOffsetY: 0 })}
              className="text-[11px] text-amber-400 hover:text-amber-300 hover:underline flex items-center gap-1"
            >
              <Crosshair className="w-3 h-3" />
              <span>Centralizar Imagem (0, 0)</span>
            </button>
            <span className="text-slate-600">|</span>
            <button
              type="button"
              onClick={() => onChange({ imageRotation: 0 })}
              className="text-[11px] text-slate-400 hover:text-slate-300 hover:underline flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" />
              <span>0°</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Texto & Frases Personalizadas */}
      <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-white font-medium">
            <Type className="w-4 h-4 text-sky-400" />
            <span>Texto & Frases Personalizadas</span>
          </div>
          <span className="text-[11px] px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/30">
            Tipografia 3D
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Frase Principal</label>
            <input
              type="text"
              placeholder="Ex: CAFÉ, AMOR, FELIZ DIA"
              value={params.text}
              onChange={(e) => onChange({ text: e.target.value })}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 uppercase"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Subtítulo / Data (Opcional)</label>
            <input
              type="text"
              placeholder="Ex: ESPECIAL, 2026, ARTESANAL"
              value={params.subtitle}
              onChange={(e) => onChange({ subtitle: e.target.value })}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 uppercase"
            />
          </div>
        </div>

        {/* Font Selection */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-xs font-medium text-slate-400">Fonte Tipográfica</label>
            <span className="text-[10px] text-sky-400/90 font-medium">Posicionamento 100% Livre</span>
          </div>
          <select
            value={params.font}
            onChange={(e) => onChange({ font: e.target.value as FontChoice })}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
          >
            {FONT_OPTIONS.map((f) => (
              <option key={f.id} value={f.id}>
                {f.label}
              </option>
            ))}
          </select>
        </div>

        {/* Text Size, Offsets & Rotation */}
        <div className="space-y-2.5 pt-1">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div>
                <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                  <span>Tamanho Fonte</span>
                  <span className="text-white font-mono">{params.fontSize || 14}mm</span>
                </div>
                <input
                  type="range"
                  min="8"
                  max="32"
                  step="1"
                  value={params.fontSize || 14}
                  onChange={(e) => onChange({ fontSize: parseInt(e.target.value, 10) })}
                  className="w-full accent-sky-500"
                />
              </div>

              <div>
                <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                  <span>Posição X</span>
                  <span className="text-white font-mono">{(params.textOffsetX || 0) > 0 ? `+${params.textOffsetX}mm` : `${params.textOffsetX || 0}mm`}</span>
                </div>
                <input
                  type="range"
                  min="-45"
                  max="45"
                  step="1"
                  value={params.textOffsetX || 0}
                  onChange={(e) => onChange({ textOffsetX: parseInt(e.target.value, 10) })}
                  className="w-full accent-sky-500"
                />
              </div>

              <div>
                <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                  <span>Posição Y</span>
                  <span className="text-white font-mono">{(params.textOffsetY || 0) > 0 ? `+${params.textOffsetY}mm` : `${params.textOffsetY || 0}mm`}</span>
                </div>
                <input
                  type="range"
                  min="-45"
                  max="45"
                  step="1"
                  value={params.textOffsetY || 0}
                  onChange={(e) => onChange({ textOffsetY: parseInt(e.target.value, 10) })}
                  className="w-full accent-sky-500"
                />
              </div>

              <div>
                <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                  <span>Rotação</span>
                  <span className="text-white font-mono">{params.textRotation || 0}°</span>
                </div>
                <input
                  type="range"
                  min="-180"
                  max="180"
                  step="5"
                  value={params.textRotation || 0}
                  onChange={(e) => onChange({ textRotation: parseInt(e.target.value, 10) })}
                  className="w-full accent-sky-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-0.5">
              <button
                type="button"
                onClick={() => onChange({ textOffsetX: 0, textOffsetY: 0 })}
                className="text-[11px] text-sky-400 hover:text-sky-300 hover:underline flex items-center gap-1"
              >
                <Crosshair className="w-3 h-3" />
                <span>Centralizar Texto (0, 0)</span>
              </button>
              <span className="text-slate-600">|</span>
              <button
                type="button"
                onClick={() => onChange({ textRotation: 0 })}
                className="text-[11px] text-slate-400 hover:text-slate-300 hover:underline flex items-center gap-1"
              >
                <RotateCcw className="w-3 h-3" />
                <span>0°</span>
              </button>
            </div>
          </div>

        {/* Stencil Bridge Feature */}
        <div className="p-3 rounded-lg bg-slate-800/60 border border-slate-700/60 space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="stencilBridges"
                checked={params.stencilBridges}
                onChange={(e) => onChange({ stencilBridges: e.target.checked })}
                className="w-4 h-4 rounded text-sky-500 bg-slate-900 border-slate-700 focus:ring-sky-400"
              />
              <label htmlFor="stencilBridges" className="text-xs font-medium text-white cursor-pointer select-none">
                Pontes Anti-Queda de Ilhas de Letras (Stencil Bridges)
              </label>
            </div>
            <span className="text-[10px] text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700">
              O, A, B, D, P, R
            </span>
          </div>
          <p className="text-[11px] text-slate-400 pl-6">
            Gera pontes conectando o miolo fechado das letras à placa, impedindo que o interior caia no estêncil vazado.
          </p>
          {params.stencilBridges && (
            <div className="pl-6 pt-1 flex items-center justify-between gap-3 text-xs">
              <span className="text-slate-400">Largura da Ponte:</span>
              <div className="flex items-center gap-2 flex-1 max-w-[160px]">
                <input
                  type="range"
                  min="0.8"
                  max="2.4"
                  step="0.2"
                  value={params.bridgeWidth}
                  onChange={(e) => onChange({ bridgeWidth: parseFloat(e.target.value) })}
                  className="w-full accent-sky-500"
                />
                <span className="font-mono text-white text-xs">{params.bridgeWidth}mm</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 3. Formato e Dimensões da Placa */}
      <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-white font-medium">
            <Maximize2 className="w-4 h-4 text-emerald-400" />
            <span>Formato da Placa & Tamanho Físico</span>
          </div>
          <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
            {params.width} x {params.height} mm
          </span>
        </div>

        {/* Shape Grid Buttons */}
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-2">Geometria da Placa</label>
          <div className="grid grid-cols-3 gap-2">
            {SHAPES.map((s) => {
              const Icon = s.icon;
              const isSelected = params.shape === s.id;
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => onChange({ shape: s.id })}
                  className={`flex items-center gap-2 p-2 rounded-lg border text-xs font-medium transition ${
                    isSelected
                      ? 'bg-emerald-500/20 border-emerald-500/50 text-white'
                      : 'bg-slate-800/80 border-slate-700/80 text-slate-300 hover:bg-slate-750'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-emerald-400' : 'text-slate-400'}`} />
                  <span className="truncate">{s.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Dimension sliders */}
        <div className="grid grid-cols-2 gap-3 pt-1">
          <div>
            <div className="flex justify-between text-xs text-slate-400 mb-1">
              <span>Largura (X)</span>
              <span className="text-white font-mono">{params.width} mm</span>
            </div>
            <input
              type="range"
              min="50"
              max="200"
              step="5"
              value={params.width}
              onChange={(e) => {
                const val = parseInt(e.target.value, 10);
                if (params.shape === 'circle') {
                  onChange({ width: val, height: val });
                } else {
                  onChange({ width: val });
                }
              }}
              className="w-full accent-emerald-500"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs text-slate-400 mb-1">
              <span>Altura (Y)</span>
              <span className="text-white font-mono">{params.height} mm</span>
            </div>
            <input
              type="range"
              min="50"
              max="200"
              step="5"
              value={params.height}
              onChange={(e) => {
                const val = parseInt(e.target.value, 10);
                if (params.shape === 'circle') {
                  onChange({ width: val, height: val });
                } else {
                  onChange({ height: val });
                }
              }}
              className="w-full accent-emerald-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <div className="flex justify-between text-xs text-slate-400 mb-1">
              <span>Espessura da Placa</span>
              <span className="text-white font-mono">{params.thickness} mm</span>
            </div>
            <input
              type="range"
              min="0.8"
              max="3.0"
              step="0.2"
              value={params.thickness}
              onChange={(e) => onChange({ thickness: parseFloat(e.target.value) })}
              className="w-full accent-emerald-500"
            />
            <p className="text-[10px] text-slate-400 mt-0.5">1.2 a 1.6 mm é a faixa perfeita para flexibilidade</p>
          </div>

          <div>
            <div className="flex justify-between text-xs text-slate-400 mb-1">
              <span>Margem de Borda</span>
              <span className="text-white font-mono">{params.borderMargin} mm</span>
            </div>
            <input
              type="range"
              min="4"
              max="20"
              step="1"
              value={params.borderMargin}
              onChange={(e) => onChange({ borderMargin: parseInt(e.target.value, 10) })}
              className="w-full accent-emerald-500"
            />
          </div>
        </div>
      </div>

      {/* 4. Alça de Apoio (Handle) & Furo de Pendurar */}
      <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-white font-medium">
            <Anchor className="w-4 h-4 text-purple-400" />
            <span>Alça de Apoio & Furo para Pendurar</span>
          </div>
          <span className="text-[11px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
            Ergonomia
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Posição da Alça</label>
            <select
              value={params.handlePosition}
              onChange={(e) => onChange({ handlePosition: e.target.value as StencilHandlePosition })}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="right">Lateral Direita (Padrão Barista)</option>
              <option value="left">Lateral Esquerda</option>
              <option value="top">Superior (Topo)</option>
              <option value="none">Sem Alça (Placa Pura)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Furo para Gancho</label>
            <button
              type="button"
              onClick={() => onChange({ hasHangingHole: !params.hasHangingHole })}
              className={`w-full py-2 px-3 rounded-lg border text-xs font-medium transition flex items-center justify-center gap-1.5 ${
                params.hasHangingHole
                  ? 'bg-purple-500/20 border-purple-500/50 text-purple-300'
                  : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-750'
              }`}
            >
              <Check className={`w-3.5 h-3.5 ${params.hasHangingHole ? 'opacity-100' : 'opacity-0'}`} />
              <span>{params.hasHangingHole ? 'Furo Ativado (Pendurar)' : 'Sem Furo'}</span>
            </button>
          </div>
        </div>

        {params.handlePosition !== 'none' && (
          <div className="grid grid-cols-2 gap-3 pt-1">
            <div>
              <div className="flex justify-between text-xs text-slate-400 mb-1">
                <span>Comprimento da Alça</span>
                <span className="text-white font-mono">{params.handleLength} mm</span>
              </div>
              <input
                type="range"
                min="14"
                max="45"
                step="1"
                value={params.handleLength}
                onChange={(e) => onChange({ handleLength: parseInt(e.target.value, 10) })}
                className="w-full accent-purple-500"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs text-slate-400 mb-1">
                <span>Largura da Pegada</span>
                <span className="text-white font-mono">{params.handleWidth} mm</span>
              </div>
              <input
                type="range"
                min="12"
                max="32"
                step="1"
                value={params.handleWidth}
                onChange={(e) => onChange({ handleWidth: parseInt(e.target.value, 10) })}
                className="w-full accent-purple-500"
              />
            </div>
          </div>
        )}
      </div>

      {/* 5. Estrutura & Modo de Impressão */}
      <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-white font-medium">
            <Layers className="w-4 h-4 text-pink-400" />
            <span>Estrutura & Modo de Impressão</span>
          </div>
          <span className={`text-[11px] px-2 py-0.5 rounded-full border ${
            params.stencilMode === 'cutout'
              ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
              : 'bg-pink-500/20 text-pink-300 border-pink-500/30'
          }`}>
            {params.stencilMode === 'cutout' ? '✂️ Recorte Vazado (Furo)' : '🏷️ Alto-Relevo (Carimbo)'}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Modo Funcional</label>
            <select
              value={params.stencilMode}
              onChange={(e) => onChange({ stencilMode: e.target.value as StencilMode })}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-pink-500"
            >
              <option value="cutout">✂️ Estêncil Vazado (Furo Passante para Tinta/Café)</option>
              <option value="embossed">🏷️ Carimbo Alto-Relevo (Pressão / Massa / Argila)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Aro Externo Anti-Empenamento</label>
            <button
              type="button"
              onClick={() => onChange({ hasBorderRim: !params.hasBorderRim })}
              className={`w-full py-2 px-3 rounded-lg border text-xs font-medium transition flex items-center justify-center gap-1.5 ${
                params.hasBorderRim
                  ? 'bg-pink-500/20 border-pink-500/50 text-pink-300'
                  : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-750'
              }`}
            >
              <Check className={`w-3.5 h-3.5 ${params.hasBorderRim ? 'opacity-100' : 'opacity-0'}`} />
              <span>{params.hasBorderRim ? 'Borda Rígida Ativa' : 'Borda Plana'}</span>
            </button>
          </div>
        </div>

        {params.stencilMode === 'embossed' && (
          <div className="p-3 rounded-lg bg-pink-500/10 border border-pink-500/20">
            <div className="flex justify-between text-xs text-pink-300 mb-1">
              <span>Altura do Relevo Saliente</span>
              <span className="font-mono font-bold text-white">{params.reliefHeight || 2.0} mm</span>
            </div>
            <input
              type="range"
              min="0.8"
              max="5.0"
              step="0.2"
              value={params.reliefHeight || 2.0}
              onChange={(e) => onChange({ reliefHeight: parseFloat(e.target.value) })}
              className="w-full accent-pink-500"
            />
          </div>
        )}

        {params.stencilMode === 'cutout' && (
          <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-200/90 flex items-center gap-2">
            <span className="text-base">✂️</span>
            <span>
              <strong>Modo Vazado Ativo:</strong> Todo o desenho e o texto são esculpidos como <strong>aberturas passantes (vazadas)</strong> na placa sólida para passagem direta de tinta, caneta, aerógrafo ou canela/cacau.
            </span>
          </div>
        )}

        {params.hasBorderRim && (
          <div className="pt-1">
            <div className="flex justify-between text-xs text-slate-400 mb-1">
              <span>Espessura da Borda de Reforço</span>
              <span className="text-white font-mono">{params.borderRimThickness} mm</span>
            </div>
            <input
              type="range"
              min={params.thickness + 0.4}
              max="5.0"
              step="0.2"
              value={params.borderRimThickness}
              onChange={(e) => onChange({ borderRimThickness: parseFloat(e.target.value) })}
              className="w-full accent-pink-500"
            />
          </div>
        )}
      </div>
    </div>
  );
};
