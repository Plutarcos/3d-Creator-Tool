import React, { useState } from 'react';
import { AIModelParams, AIModelBlueprint } from '../types';
import { AI_PRESET_TEMPLATES } from '../generators/aiModelGenerator';
import { Sparkles, Wand2, RefreshCw, Cpu, Layers, Box, CheckCircle2, AlertCircle, Compass, Palette } from 'lucide-react';

interface AIModelControlsProps {
  params: AIModelParams;
  blueprint: AIModelBlueprint | null;
  loading: boolean;
  error?: string | null;
  onGenerateAI: (prompt: string) => Promise<void>;
  onApplyPreset: (presetId: string) => void;
  onChange: (params: AIModelParams) => void;
}

const CATEGORIES: { id: AIModelParams['category']; label: string }[] = [
  { id: 'gadget', label: 'Gadget / Suporte' },
  { id: 'functional', label: 'Funcional / Organizador' },
  { id: 'decorative', label: 'Decorativo / Troféu' },
  { id: 'home', label: 'Casa / Utilitário' },
  { id: 'mechanical', label: 'Mecânico / Ferramenta' },
];

const STYLES: { id: AIModelParams['style']; label: string }[] = [
  { id: 'modern', label: 'Moderno' },
  { id: 'minimalist', label: 'Minimalista' },
  { id: 'geometric', label: 'Geométrico' },
  { id: 'industrial', label: 'Industrial' },
  { id: 'organic', label: 'Curvilíneo' },
];

const QUICK_PROMPT_CHIPS = [
  'Suporte de celular para mesa com canal de cabo',
  'Organizador de pilhas AA em formato cilíndrico',
  'Gancho duplo para fone de ouvido para prender na mesa',
  'Pote hexagonal com tampa rosqueável',
  'Mini torre de dados para jogos RPG com rampa interna',
  'Suporte articulado para controle de videogame',
];

export const AIModelControls: React.FC<AIModelControlsProps> = ({
  params,
  blueprint,
  loading,
  error,
  onGenerateAI,
  onApplyPreset,
  onChange,
}) => {
  const [inputPrompt, setInputPrompt] = useState(params.prompt || 'Suporte de mesa para celular com ângulo ergonômico e guia para cabo');

  const handleGenerate = () => {
    if (!inputPrompt.trim()) return;
    onChange({ ...params, prompt: inputPrompt });
    onGenerateAI(inputPrompt);
  };

  const handleSelectPreset = (preset: typeof AI_PRESET_TEMPLATES[0]) => {
    setInputPrompt(preset.prompt);
    onChange({ ...params, prompt: preset.prompt, activePresetId: preset.id });
    onApplyPreset(preset.id);
  };

  return (
    <div className="space-y-6">
      {/* AI Prompt Input Card */}
      <div className="p-4 bg-gradient-to-br from-indigo-950/90 via-slate-900 to-slate-950 rounded-2xl border border-indigo-500/40 space-y-4 shadow-xl shadow-indigo-950/30">
        <div className="flex items-center justify-between">
          <label className="text-sm font-bold text-white flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-400 animate-pulse" /> Descreva o Modelo 3D Desejado (IA)
          </label>
          <span className="text-[11px] bg-indigo-500/20 text-indigo-300 font-bold px-2 py-0.5 rounded-full border border-indigo-500/40 flex items-center gap-1">
            <Cpu className="w-3 h-3" /> Gemini 3.7 CAD
          </span>
        </div>

        <div>
          <textarea
            value={inputPrompt}
            onChange={(e) => setInputPrompt(e.target.value)}
            placeholder="Ex: Suporte articulado para celular com base pesada e canal de cabo, troféu geométrico com base hexagonal, organizador de cabos..."
            rows={3}
            className="w-full px-3.5 py-2.5 bg-slate-950/90 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-500 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none leading-relaxed"
          />
        </div>

        {/* Quick prompt ideas */}
        <div className="space-y-1.5">
          <span className="text-[11px] text-slate-400 flex items-center gap-1">
            <Compass className="w-3 h-3 text-indigo-400" /> Sugestões rápidas de prompt:
          </span>
          <div className="flex flex-wrap gap-1.5">
            {QUICK_PROMPT_CHIPS.map((chip, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setInputPrompt(chip);
                  onChange({ ...params, prompt: chip });
                }}
                className="text-[10px] px-2 py-1 bg-slate-900/80 hover:bg-indigo-900/40 text-slate-300 hover:text-indigo-200 border border-slate-800 rounded-lg transition-colors text-left"
              >
                {chip}
              </button>
            ))}
          </div>
        </div>

        {/* Category & Style Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-800/80">
          <div>
            <label className="text-[11px] font-semibold text-slate-300 mb-1.5 flex items-center gap-1">
              <Box className="w-3 h-3 text-indigo-400" /> Categoria
            </label>
            <select
              value={params.category}
              onChange={(e) => onChange({ ...params, category: e.target.value as AIModelParams['category'] })}
              className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:ring-1 focus:ring-indigo-500"
            >
              {CATEGORIES.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[11px] font-semibold text-slate-300 mb-1.5 flex items-center gap-1">
              <Palette className="w-3 h-3 text-indigo-400" /> Estilo Geométrico
            </label>
            <select
              value={params.style}
              onChange={(e) => onChange({ ...params, style: e.target.value as AIModelParams['style'] })}
              className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:ring-1 focus:ring-indigo-500"
            >
              {STYLES.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {error && (
          <div className="p-2.5 bg-amber-950/40 border border-amber-500/40 rounded-xl text-amber-300 text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
            <span>{error}</span>
          </div>
        )}

        <button
          onClick={handleGenerate}
          disabled={loading || !inputPrompt.trim()}
          className={`w-full py-3 px-4 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-lg ${
            loading
              ? 'bg-indigo-600/60 text-white/80 cursor-wait'
              : 'bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white shadow-indigo-600/30 active:scale-[0.98]'
          }`}
        >
          {loading ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin text-white" />
              <span>Gerando Geometria 3D com Gemini...</span>
            </>
          ) : (
            <>
              <Wand2 className="w-4 h-4" />
              <span>Gerar Objeto 3D com Gemini IA</span>
            </>
          )}
        </button>
      </div>

      {/* 1-Click Quick Preset Inspiration */}
      <div className="p-4 bg-slate-900/80 rounded-2xl border border-slate-800 space-y-3">
        <label className="block text-sm font-bold text-slate-200 flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Box className="w-4 h-4 text-indigo-400" /> Modelos Prontos para Testar
          </span>
          <span className="text-xs text-slate-400">1-Clique</span>
        </label>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {AI_PRESET_TEMPLATES.map((preset) => {
            const isSelected = params.activePresetId === preset.id;
            return (
              <button
                key={preset.id}
                onClick={() => handleSelectPreset(preset)}
                className={`p-3 rounded-xl border text-left transition-all ${
                  isSelected
                    ? 'bg-indigo-600/20 border-indigo-500 text-white ring-1 ring-indigo-500'
                    : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-900/80'
                }`}
              >
                <div className="text-xs font-bold text-slate-100 flex items-center justify-between mb-1">
                  <span>{preset.title}</span>
                  <span className="text-[10px] uppercase font-semibold text-indigo-400 bg-indigo-950/60 px-1.5 py-0.5 rounded border border-indigo-800/40">
                    {preset.category}
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                  {preset.description}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Scale & Dimensions Calibration */}
      <div className="p-4 bg-slate-900/80 rounded-2xl border border-slate-800 space-y-4">
        <label className="block text-sm font-bold text-slate-200 flex items-center gap-2">
          <Layers className="w-4 h-4 text-indigo-400" /> Escala & Recomendações de Impressão 3D
        </label>

        <div>
          <div className="flex justify-between text-xs font-medium text-slate-300 mb-1">
            <span>Fator de Escala Global:</span>
            <span className="text-indigo-400 font-mono font-bold">{(params.scale || 1.0).toFixed(1)}x</span>
          </div>
          <input
            type="range"
            min={0.5}
            max={2.0}
            step={0.1}
            value={params.scale || 1.0}
            onChange={(e) => onChange({ ...params, scale: Number(e.target.value) })}
            className="w-full accent-indigo-500 cursor-pointer"
          />
        </div>

        {blueprint && (
          <div className="p-3.5 bg-slate-950 rounded-xl border border-indigo-900/50 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="text-xs font-bold text-indigo-300 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> {blueprint.title || 'Modelo Gerado por IA'}
              </div>
              <span className="text-[10px] bg-emerald-950/70 text-emerald-300 border border-emerald-800/50 px-2 py-0.5 rounded-full font-bold">
                {blueprint.components?.length || 0} partes CAD
              </span>
            </div>

            <p className="text-[11px] text-slate-300 leading-relaxed">{blueprint.description}</p>

            {blueprint.dimensions && (
              <div className="text-[11px] text-slate-400 bg-slate-900/90 p-2 rounded-lg border border-slate-800/80 flex items-center justify-between">
                <span className="text-slate-400">Dimensões Calculadas:</span>
                <span className="text-indigo-300 font-mono font-semibold">
                  {blueprint.dimensions.width || '--'}mm (L) × {blueprint.dimensions.depth || '--'}mm (P) × {blueprint.dimensions.height || '--'}mm (A)
                </span>
              </div>
            )}

            {blueprint.recommendedSettings && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-900 text-[10px]">
                <div>
                  <span className="text-slate-500 block">Preenchimento:</span>
                  <span className="font-bold text-slate-200">{blueprint.recommendedSettings.infill || '15-20%'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Altura de Camada:</span>
                  <span className="font-bold text-slate-200">{blueprint.recommendedSettings.layerHeight || '0.20mm'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Suportes:</span>
                  <span className="font-bold text-slate-200">{blueprint.recommendedSettings.supports || 'Não'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Filamento:</span>
                  <span className="font-bold text-slate-200">{blueprint.recommendedSettings.filament || 'PLA / PETG'}</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
