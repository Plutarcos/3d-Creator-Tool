import React from 'react';
import { VaseParams } from '../types';
import { Sliders, Sparkles } from 'lucide-react';

interface VaseControlsProps {
  params: VaseParams;
  onChange: (params: VaseParams) => void;
}

const VASE_PRESETS: { name: string; params: Partial<VaseParams> }[] = [
  {
    name: 'Espiral Torcido',
    params: { height: 110, bottomRadius: 28, topRadius: 36, middleBulge: 1.35, sides: 6, twistAngle: 120, waves: 0, wallThickness: 2.4, solidMode: false },
  },
  {
    name: 'Vaso Ondulado (Wave)',
    params: { height: 100, bottomRadius: 25, topRadius: 30, middleBulge: 1.1, sides: 32, twistAngle: 45, waves: 8, waveAmplitude: 3.5, wallThickness: 2.2, solidMode: false },
  },
  {
    name: 'Porta-Canetas Hexagonal',
    params: { height: 90, bottomRadius: 35, topRadius: 35, middleBulge: 1.0, sides: 6, twistAngle: 30, waves: 0, wallThickness: 3.0, solidMode: false },
  },
  {
    name: 'Vaso Origami Cônico',
    params: { height: 120, bottomRadius: 20, topRadius: 42, middleBulge: 0.9, sides: 8, twistAngle: 90, waves: 0, wallThickness: 2.0, solidMode: false },
  },
];

export const VaseControls: React.FC<VaseControlsProps> = ({ params, onChange }) => {
  const update = (partial: Partial<VaseParams>) => {
    onChange({ ...params, ...partial });
  };

  return (
    <div className="space-y-6">
      {/* Presets */}
      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
          Modelos e Formas Prontas
        </label>
        <div className="grid grid-cols-2 gap-2">
          {VASE_PRESETS.map((p) => (
            <button
              key={p.name}
              onClick={() => onChange({ ...params, ...p.params })}
              className="p-3 bg-slate-900 border border-slate-800 hover:border-indigo-500 rounded-xl text-left transition-all"
            >
              <div className="text-xs font-bold text-slate-200">{p.name}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Geometry Sliders */}
      <div className="p-4 bg-slate-900/80 rounded-2xl border border-slate-800 space-y-4">
        <label className="block text-sm font-bold text-slate-200 flex items-center gap-2">
          <Sliders className="w-4 h-4 text-indigo-400" /> Parâmetros do Vaso / Porta-Trecos
        </label>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <div className="flex justify-between text-xs font-medium text-slate-300 mb-1">
              <span>Altura:</span>
              <span className="text-indigo-400 font-mono">{params.height} mm</span>
            </div>
            <input
              type="range"
              min={40}
              max={180}
              step={5}
              value={params.height}
              onChange={(e) => update({ height: Number(e.target.value) })}
              className="w-full accent-indigo-500 cursor-pointer"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs font-medium text-slate-300 mb-1">
              <span>Número de Lados (Facetas):</span>
              <span className="text-indigo-400 font-mono">{params.sides} lados</span>
            </div>
            <input
              type="range"
              min={3}
              max={36}
              step={1}
              value={params.sides}
              onChange={(e) => update({ sides: Number(e.target.value) })}
              className="w-full accent-indigo-500 cursor-pointer"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs font-medium text-slate-300 mb-1">
              <span>Ângulo de Torção (Twist):</span>
              <span className="text-indigo-400 font-mono">{params.twistAngle}°</span>
            </div>
            <input
              type="range"
              min={0}
              max={360}
              step={10}
              value={params.twistAngle}
              onChange={(e) => update({ twistAngle: Number(e.target.value) })}
              className="w-full accent-indigo-500 cursor-pointer"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs font-medium text-slate-300 mb-1">
              <span>Curvatura Central (Bojo):</span>
              <span className="text-indigo-400 font-mono">{params.middleBulge.toFixed(2)}x</span>
            </div>
            <input
              type="range"
              min={0.6}
              max={1.8}
              step={0.05}
              value={params.middleBulge}
              onChange={(e) => update({ middleBulge: Number(e.target.value) })}
              className="w-full accent-indigo-500 cursor-pointer"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs font-medium text-slate-300 mb-1">
              <span>Raio da Base / Topo:</span>
              <span className="text-indigo-400 font-mono">{params.bottomRadius} / {params.topRadius} mm</span>
            </div>
            <input
              type="range"
              min={15}
              max={60}
              step={2}
              value={params.bottomRadius}
              onChange={(e) => update({ bottomRadius: Number(e.target.value) })}
              className="w-full accent-indigo-500 cursor-pointer"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs font-medium text-slate-300 mb-1">
              <span>Ondulações (Costelas):</span>
              <span className="text-indigo-400 font-mono">{params.waves} ondas</span>
            </div>
            <input
              type="range"
              min={0}
              max={12}
              step={1}
              value={params.waves}
              onChange={(e) => update({ waves: Number(e.target.value) })}
              className="w-full accent-indigo-500 cursor-pointer"
            />
          </div>
        </div>

        {/* Vase mode checkbox */}
        <div className="pt-2 border-t border-slate-800">
          <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-200">
            <input
              type="checkbox"
              checked={params.solidMode}
              onChange={(e) => update({ solidMode: e.target.checked })}
              className="w-4 h-4 rounded text-indigo-600 bg-slate-950 border-slate-700"
            />
            Modo Sólido (Para impressão no "Modo Vaso / Spiralize Outer Contour" do fatiador)
          </label>
        </div>
      </div>
    </div>
  );
};
