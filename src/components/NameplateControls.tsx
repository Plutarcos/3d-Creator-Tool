import React from 'react';
import { NameplateParams, FontChoice, NameplateStyle } from '../types';
import { Type, Sliders, Palette, Sparkles, Layers } from 'lucide-react';

interface NameplateControlsProps {
  params: NameplateParams;
  onChange: (params: NameplateParams) => void;
}

const FONTS: { id: FontChoice; label: string; desc: string }[] = [
  { id: 'Bungee', label: 'Bungee', desc: 'Display Pesado & Robusto (Ideal 3D)' },
  { id: 'Montserrat', label: 'Montserrat', desc: 'Geométrico Moderno' },
  { id: 'Oswald', label: 'Oswald', desc: 'Condensado Impactante' },
  { id: 'Alfa Slab One', label: 'Alfa Slab One', desc: 'Slab Serif Clássico' },
  { id: 'Cinzel', label: 'Cinzel', desc: 'Romano / Elegante' },
  { id: 'Black Ops One', label: 'Black Ops One', desc: 'Militar / Stencil' },
  { id: 'Fredoka', label: 'Fredoka', desc: 'Arredondado Amigável' },
  { id: 'Pacifico', label: 'Pacifico', desc: 'Caligrafia / Cursiva' },
  { id: 'Orbitron', label: 'Orbitron', desc: 'Tech Futurista' },
  { id: 'Righteous', label: 'Righteous', desc: 'Retro Vintage' },
  { id: 'Plus Jakarta Sans', label: 'Jakarta Sans', desc: 'Executivo Clean' },
];

const STYLES: { id: NameplateStyle; label: string; desc: string }[] = [
  { id: 'triangular-wedge', label: 'Prisma Triangular', desc: 'Clássico de mesa com base integrada pesada' },
  { id: 'curved-stand', label: 'Curvado Ergonômico', desc: 'Design moderno com suporte traseiro fluido' },
  { id: 'flat-slide-in', label: 'Placa com Base Encaixe', desc: 'Placa destacável para troca fácil' },
];

export const NameplateControls: React.FC<NameplateControlsProps> = ({ params, onChange }) => {
  const update = (partial: Partial<NameplateParams>) => {
    onChange({ ...params, ...partial });
  };

  return (
    <div className="space-y-6">
      {/* Text Inputs */}
      <div className="p-4 bg-slate-900/80 rounded-2xl border border-slate-800 space-y-4">
        <label className="block text-sm font-bold text-slate-200 flex items-center gap-2">
          <Type className="w-4 h-4 text-indigo-400" /> Textos em Relevo 3D
        </label>

        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1">Título Principal / Nome:</label>
          <input
            type="text"
            value={params.title}
            onChange={(e) => update({ title: e.target.value })}
            placeholder="Ex: DR. GABRIEL SOUZA"
            className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 font-bold text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent uppercase"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1">Subtítulo / Especialidade ou Cargo:</label>
          <input
            type="text"
            value={params.subtitle}
            onChange={(e) => update({ subtitle: e.target.value })}
            placeholder="Ex: ENGENHARIA MECÂNICA"
            className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 font-medium text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent uppercase"
          />
        </div>
      </div>

      {/* Font Family Selector */}
      <div className="p-4 bg-slate-900/80 rounded-2xl border border-slate-800 space-y-3">
        <label className="block text-sm font-bold text-slate-200 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-indigo-400" /> Estilo de Fonte das Letras
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
          {FONTS.map((font) => (
            <button
              key={font.id}
              onClick={() => update({ font: font.id })}
              className={`p-2.5 rounded-xl border text-left transition-all ${
                params.font === font.id
                  ? 'bg-indigo-600/20 border-indigo-500 text-white'
                  : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
              }`}
            >
              <div className="text-sm font-bold truncate">{font.label}</div>
              <div className="text-xs text-slate-400 truncate">{font.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Plate Format & Design */}
      <div className="p-4 bg-slate-900/80 rounded-2xl border border-slate-800 space-y-4">
        <label className="block text-sm font-bold text-slate-200 flex items-center gap-2">
          <Layers className="w-4 h-4 text-indigo-400" /> Formato da Placa & Base
        </label>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {STYLES.map((st) => (
            <button
              key={st.id}
              onClick={() => update({ style: st.id })}
              className={`p-2.5 rounded-xl border text-left transition-all ${
                params.style === st.id
                  ? 'bg-indigo-600/20 border-indigo-500 text-white ring-1 ring-indigo-500'
                  : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
              }`}
            >
              <div className="text-xs font-bold">{st.label}</div>
              <div className="text-[11px] text-slate-400 mt-0.5 line-clamp-2">{st.desc}</div>
            </button>
          ))}
        </div>

        {/* Sliders */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <div>
            <div className="flex justify-between text-xs font-medium text-slate-300 mb-1">
              <span>Comprimento:</span>
              <span className="text-indigo-400 font-mono">{params.plateWidth} mm</span>
            </div>
            <input
              type="range"
              min={90}
              max={220}
              step={5}
              value={params.plateWidth}
              onChange={(e) => update({ plateWidth: Number(e.target.value) })}
              className="w-full accent-indigo-500 cursor-pointer"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs font-medium text-slate-300 mb-1">
              <span>Altura da Placa:</span>
              <span className="text-indigo-400 font-mono">{params.plateHeight} mm</span>
            </div>
            <input
              type="range"
              min={30}
              max={65}
              step={2}
              value={params.plateHeight}
              onChange={(e) => update({ plateHeight: Number(e.target.value) })}
              className="w-full accent-indigo-500 cursor-pointer"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs font-medium text-slate-300 mb-1">
              <span>Ângulo de Visão:</span>
              <span className="text-indigo-400 font-mono">{params.plateAngle}°</span>
            </div>
            <input
              type="range"
              min={45}
              max={80}
              step={5}
              value={params.plateAngle}
              onChange={(e) => update({ plateAngle: Number(e.target.value) })}
              className="w-full accent-indigo-500 cursor-pointer"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs font-medium text-slate-300 mb-1">
              <span>Relevo 3D das Letras:</span>
              <span className="text-indigo-400 font-mono">{params.textExtrusion} mm</span>
            </div>
            <input
              type="range"
              min={1.2}
              max={4.5}
              step={0.2}
              value={params.textExtrusion}
              onChange={(e) => update({ textExtrusion: Number(e.target.value) })}
              className="w-full accent-indigo-500 cursor-pointer"
            />
          </div>
        </div>

        {/* Toggles */}
        <div className="pt-2 border-t border-slate-800 space-y-2">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={params.hasBorder}
              onChange={(e) => update({ hasBorder: e.target.checked })}
              className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 bg-slate-950 border-slate-700"
            />
            <span className="text-xs font-medium text-slate-300">Moldura decorativa com borda chanfrada</span>
          </label>
        </div>
      </div>
    </div>
  );
};
