import React from 'react';
import { QrParams } from '../types';
import { QrCode, Key, Sliders } from 'lucide-react';

interface QrControlsProps {
  params: QrParams;
  onChange: (params: QrParams) => void;
}

const QR_PRESETS = [
  { name: 'Instagram', text: 'https://instagram.com' },
  { name: 'WiFi Conexão', text: 'WIFI:S:MinhaRede;T:WPA;P:Senha123;;' },
  { name: 'PIX Pagamento', text: '00020126360014BR.GOV.BCB.PIX...' },
  { name: 'Website Maker', text: 'https://makerworld.com' },
];

export const QrControls: React.FC<QrControlsProps> = ({ params, onChange }) => {
  const update = (partial: Partial<QrParams>) => {
    onChange({ ...params, ...partial });
  };

  return (
    <div className="space-y-6">
      {/* Quick Presets */}
      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
          Exemplos e Atalhos
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {QR_PRESETS.map((p) => (
            <button
              key={p.name}
              onClick={() => update({ content: p.text })}
              className="p-2.5 bg-slate-900 border border-slate-800 hover:border-indigo-500 rounded-xl text-left transition-all"
            >
              <div className="text-xs font-bold text-slate-200">{p.name}</div>
            </button>
          ))}
        </div>
      </div>

      {/* QR Input */}
      <div className="p-4 bg-slate-900/80 rounded-2xl border border-slate-800 space-y-4">
        <label className="block text-sm font-bold text-slate-200 flex items-center gap-2">
          <QrCode className="w-4 h-4 text-indigo-400" /> Conteúdo do QR Code
        </label>

        <input
          type="text"
          value={params.content}
          onChange={(e) => update({ content: e.target.value })}
          placeholder="https://exemplo.com ou texto"
          className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 font-medium text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
        />

        {/* Sliders */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <div>
            <div className="flex justify-between text-xs font-medium text-slate-300 mb-1">
              <span>Tamanho da Placa:</span>
              <span className="text-indigo-400 font-mono">{params.size} x {params.size} mm</span>
            </div>
            <input
              type="range"
              min={35}
              max={100}
              step={5}
              value={params.size}
              onChange={(e) => update({ size: Number(e.target.value) })}
              className="w-full accent-indigo-500 cursor-pointer"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs font-medium text-slate-300 mb-1">
              <span>Altura dos Pixels (Relevo):</span>
              <span className="text-indigo-400 font-mono">{params.raisedThickness} mm</span>
            </div>
            <input
              type="range"
              min={0.8}
              max={3.0}
              step={0.2}
              value={params.raisedThickness}
              onChange={(e) => update({ raisedThickness: Number(e.target.value) })}
              className="w-full accent-indigo-500 cursor-pointer"
            />
          </div>
        </div>

        {/* Toggles */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-800">
          <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-200">
            <input
              type="checkbox"
              checked={params.hasKeychainHole}
              onChange={(e) => update({ hasKeychainHole: e.target.checked })}
              className="w-4 h-4 rounded text-indigo-600 bg-slate-950 border-slate-700"
            />
            Adicionar Argola para Chaveiro
          </label>

          <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-200">
            <input
              type="checkbox"
              checked={params.hasBorder}
              onChange={(e) => update({ hasBorder: e.target.checked })}
              className="w-4 h-4 rounded text-indigo-600 bg-slate-950 border-slate-700"
            />
            Borda Elevada ao Redor
          </label>
        </div>
      </div>
    </div>
  );
};
