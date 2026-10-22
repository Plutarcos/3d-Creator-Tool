import React from 'react';
import { GearParams, GearType, ShaftType, SpokeStyle } from '../types';
import { Settings, Cog, Disc, Sliders, ShieldCheck } from 'lucide-react';

interface GearControlsProps {
  params: GearParams;
  onChange: (params: GearParams) => void;
}

const GEAR_TYPES: { id: GearType; label: string; desc: string }[] = [
  { id: 'spur', label: 'Dentes Retos (Spur)', desc: 'Padrão clássico de alta resistência' },
  { id: 'helical', label: 'Helicoidal (Helical)', desc: 'Mais silencioso e suave, dentes inclinados' },
  { id: 'herringbone', label: 'Espinha de Peixe (Herringbone)', desc: 'Hélice dupla auto-centrante sem empuxo axial' },
  { id: 'internal', label: 'Interna / Planetária', desc: 'Anel dentado interno para redutores planetários' },
  { id: 'bevel', label: 'Cônica (Bevel)', desc: 'Para transmissão em ângulo de 90°' },
];

const SHAFT_TYPES: { id: ShaftType; label: string }[] = [
  { id: 'round', label: 'Furo Cilíndrico' },
  { id: 'd-shaft', label: 'Eixo D (D-Cut Motor)' },
  { id: 'hex', label: 'Sextavado (Hex)' },
];

const SPOKE_STYLES: { id: SpokeStyle; label: string }[] = [
  { id: 'solid', label: 'Maciço (Sem Raios)' },
  { id: 'straight', label: 'Raios Setoriais' },
  { id: 'circular-cutouts', label: 'Furos Circulares de Alívio' },
];

export const GearControls: React.FC<GearControlsProps> = ({ params, onChange }) => {
  const update = (partial: Partial<GearParams>) => {
    onChange({ ...params, ...partial });
  };

  // Metric standard gear calculations
  const z = params.teeth || 20;
  const m = params.module || 2.5;
  const pitchDiameter = z * m;
  const outerDiameter = (z + 2) * m;
  const rootDiameter = Math.max(0, (z - 2.5) * m);

  return (
    <div className="space-y-6">
      {/* Calculated Mechanical Specs Card */}
      <div className="p-4 bg-gradient-to-r from-indigo-950/60 to-slate-900/90 rounded-2xl border border-indigo-500/30 grid grid-cols-3 gap-2 text-center">
        <div>
          <div className="text-[11px] text-indigo-300 font-medium">Diâmetro Primitivo:</div>
          <div className="text-sm font-bold text-white font-mono">{pitchDiameter.toFixed(1)} mm</div>
        </div>
        <div>
          <div className="text-[11px] text-indigo-300 font-medium">Diâmetro Externo:</div>
          <div className="text-sm font-bold text-white font-mono">{outerDiameter.toFixed(1)} mm</div>
        </div>
        <div>
          <div className="text-[11px] text-indigo-300 font-medium">Diâmetro da Raiz:</div>
          <div className="text-sm font-bold text-white font-mono">{rootDiameter.toFixed(1)} mm</div>
        </div>
      </div>

      {/* Gear Type Selector */}
      <div className="p-4 bg-slate-900/80 rounded-2xl border border-slate-800 space-y-3">
        <label className="block text-sm font-bold text-slate-200 flex items-center gap-2">
          <Cog className="w-4 h-4 text-indigo-400" /> Tipo de Engrenagem
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {GEAR_TYPES.map((gt) => (
            <button
              key={gt.id}
              onClick={() => update({ gearType: gt.id })}
              className={`p-2.5 rounded-xl border text-left transition-all ${
                params.gearType === gt.id
                  ? 'bg-indigo-600/20 border-indigo-500 text-white ring-1 ring-indigo-500'
                  : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
              }`}
            >
              <div className="text-xs font-bold">{gt.label}</div>
              <div className="text-[11px] text-slate-400 mt-0.5">{gt.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Core Tooth Profile Parameters */}
      <div className="p-4 bg-slate-900/80 rounded-2xl border border-slate-800 space-y-4">
        <label className="block text-sm font-bold text-slate-200 flex items-center gap-2">
          <Sliders className="w-4 h-4 text-indigo-400" /> Parâmetros dos Dentes (Evolvente)
        </label>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <div className="flex justify-between text-xs font-medium text-slate-300 mb-1">
              <span>Número de Dentes (Z):</span>
              <span className="text-indigo-400 font-mono font-bold">{params.teeth}</span>
            </div>
            <input
              type="range"
              min={8}
              max={80}
              step={1}
              value={params.teeth}
              onChange={(e) => update({ teeth: Number(e.target.value) })}
              className="w-full accent-indigo-500 cursor-pointer"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs font-medium text-slate-300 mb-1">
              <span>Módulo (Passo do Dente):</span>
              <span className="text-indigo-400 font-mono font-bold">{params.module} mm</span>
            </div>
            <input
              type="range"
              min={1.0}
              max={6.0}
              step={0.5}
              value={params.module}
              onChange={(e) => update({ module: Number(e.target.value) })}
              className="w-full accent-indigo-500 cursor-pointer"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs font-medium text-slate-300 mb-1">
              <span>Espessura / Face Width:</span>
              <span className="text-indigo-400 font-mono">{params.thickness} mm</span>
            </div>
            <input
              type="range"
              min={3}
              max={35}
              step={1}
              value={params.thickness}
              onChange={(e) => update({ thickness: Number(e.target.value) })}
              className="w-full accent-indigo-500 cursor-pointer"
            />
          </div>

          {(params.gearType === 'helical' || params.gearType === 'herringbone') && (
            <div>
              <div className="flex justify-between text-xs font-medium text-slate-300 mb-1">
                <span>Ângulo de Hélice (Torção):</span>
                <span className="text-indigo-400 font-mono">{params.helixAngle || 20}°</span>
              </div>
              <input
                type="range"
                min={5}
                max={40}
                step={2}
                value={params.helixAngle || 20}
                onChange={(e) => update({ helixAngle: Number(e.target.value) })}
                className="w-full accent-indigo-500 cursor-pointer"
              />
            </div>
          )}

          <div>
            <div className="flex justify-between text-xs font-medium text-slate-300 mb-1">
              <span>Ângulo de Pressão:</span>
              <span className="text-indigo-400 font-mono">{params.pressureAngle || 20}°</span>
            </div>
            <div className="flex gap-2">
              {[14.5, 20, 25].map((ang) => (
                <button
                  key={ang}
                  onClick={() => update({ pressureAngle: ang })}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                    (params.pressureAngle || 20) === ang
                      ? 'bg-indigo-600 border-indigo-400 text-white'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {ang}°
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Shaft Bore & Hub Mounting */}
      <div className="p-4 bg-slate-900/80 rounded-2xl border border-slate-800 space-y-4">
        <label className="block text-sm font-bold text-slate-200 flex items-center gap-2">
          <Disc className="w-4 h-4 text-indigo-400" /> Eixo Central, Rasgo de Chaveta & Cubo
        </label>

        {/* Shaft Type */}
        <div>
          <label className="block text-xs font-semibold text-slate-400 mb-1.5">Perfil do Eixo:</label>
          <div className="grid grid-cols-3 gap-2">
            {SHAFT_TYPES.map((st) => (
              <button
                key={st.id}
                onClick={() => update({ shaftType: st.id })}
                className={`py-1.5 px-2 rounded-lg text-xs font-bold border transition-all truncate ${
                  (params.shaftType || 'round') === st.id
                    ? 'bg-indigo-600 border-indigo-400 text-white'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                {st.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <div className="flex justify-between text-xs font-medium text-slate-300 mb-1">
              <span>Diâmetro do Eixo / Furo:</span>
              <span className="text-indigo-400 font-mono">Ø {params.boreDiameter} mm</span>
            </div>
            <input
              type="range"
              min={2}
              max={30}
              step={0.5}
              value={params.boreDiameter}
              onChange={(e) => update({ boreDiameter: Number(e.target.value) })}
              className="w-full accent-indigo-500 cursor-pointer"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs font-medium text-slate-300 mb-1">
              <span>Ressalto do Cubo (Hub):</span>
              <span className="text-indigo-400 font-mono">+{params.hubHeight || 0} mm</span>
            </div>
            <input
              type="range"
              min={0}
              max={15}
              step={1}
              value={params.hubHeight || 0}
              onChange={(e) => update({ hubHeight: Number(e.target.value), hubDiameter: (params.boreDiameter || 5) * 2 + 4 })}
              className="w-full accent-indigo-500 cursor-pointer"
            />
          </div>
        </div>

        {/* Keyway checkbox */}
        {params.shaftType === 'round' && (
          <div className="pt-2 border-t border-slate-800">
            <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-200">
              <input
                type="checkbox"
                checked={params.hasKeyway}
                onChange={(e) => update({ hasKeyway: e.target.checked })}
                className="w-4 h-4 rounded text-indigo-600 bg-slate-950 border-slate-700"
              />
              Adicionar Rasgo de Chaveta (Keyway Slot)
            </label>
          </div>
        )}
      </div>

      {/* Lightening Spokes (Alívio de peso) */}
      <div className="p-4 bg-slate-900/80 rounded-2xl border border-slate-800 space-y-4">
        <label className="block text-sm font-bold text-slate-200 flex items-center gap-2">
          <Settings className="w-4 h-4 text-indigo-400" /> Raios & Alívio de Peso
        </label>

        <div>
          <label className="block text-xs font-semibold text-slate-400 mb-1.5">Estilo de Alívio:</label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {SPOKE_STYLES.map((sp) => (
              <button
                key={sp.id}
                onClick={() => update({ spokeStyle: sp.id, spokes: sp.id === 'solid' ? 0 : (params.spokes || 4) })}
                className={`py-1.5 px-2 rounded-lg text-xs font-bold border transition-all truncate ${
                  (params.spokeStyle || 'solid') === sp.id
                    ? 'bg-indigo-600 border-indigo-400 text-white'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                {sp.label}
              </button>
            ))}
          </div>
        </div>

        {params.spokeStyle !== 'solid' && (
          <div>
            <div className="flex justify-between text-xs font-medium text-slate-300 mb-1">
              <span>Quantidade de Raios / Furos:</span>
              <span className="text-indigo-400 font-mono">{params.spokes || 4}</span>
            </div>
            <input
              type="range"
              min={3}
              max={6}
              step={1}
              value={params.spokes || 4}
              onChange={(e) => update({ spokes: Number(e.target.value) })}
              className="w-full accent-indigo-500 cursor-pointer"
            />
          </div>
        )}
      </div>
    </div>
  );
};
