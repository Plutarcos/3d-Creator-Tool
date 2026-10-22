import React, { useRef } from 'react';
import { LithophaneParams, LithophaneShape } from '../types';
import { SAMPLE_LITHOPHANE_IMAGES } from '../generators/lithophaneGenerator';
import { Image as ImageIcon, Upload, Sun, Moon, Sliders, Sparkles, Lightbulb, Eye } from 'lucide-react';

interface LithophaneControlsProps {
  params: LithophaneParams;
  onChange: (params: LithophaneParams) => void;
}

const SHAPES: { id: LithophaneShape; label: string; desc: string }[] = [
  { id: 'curved', label: 'Curvo Auto-Estável', desc: 'Arco elegante que fica em pé sozinho na mesa' },
  { id: 'flat', label: 'Plano com Cavalete', desc: 'Foto plana para moldura ou suporte pezinho' },
  { id: 'cylinder', label: 'Cilindro 360° (Luminária)', desc: 'Abajur cilíndrico completo para lâmpada/LED' },
  { id: 'heart', label: 'Coração Romântico', desc: 'Formato recortado de coração em relevo' },
];

export const LithophaneControls: React.FC<LithophaneControlsProps> = ({ params, onChange }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const update = (partial: Partial<LithophaneParams>) => {
    onChange({ ...params, ...partial });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          update({ imageUrl: event.target.result as string });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-6">
      {/* Upload Image & Preset Gallery */}
      <div className="p-4 bg-slate-900/80 rounded-2xl border border-slate-800 space-y-4">
        <label className="block text-sm font-bold text-slate-200 flex items-center justify-between">
          <span className="flex items-center gap-2">
            <ImageIcon className="w-4 h-4 text-indigo-400" /> Foto para Litofania 3D
          </span>
          <span className="text-xs text-indigo-400 font-semibold">Alta Resolução</span>
        </label>

        {/* Drag/Drop & Upload Button */}
        <div
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-slate-700 hover:border-indigo-500 rounded-xl p-5 text-center cursor-pointer bg-slate-950/60 hover:bg-slate-900/60 transition-colors"
        >
          <Upload className="w-7 h-7 mx-auto text-indigo-400 mb-2" />
          <div className="text-sm font-bold text-slate-200">Clique ou arraste sua foto aqui</div>
          <div className="text-xs text-slate-400 mt-1">PNG, JPG, WEBP — quanto maior o contraste, mais nítido o relevo!</div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            className="hidden"
          />
        </div>

        {/* Quick Sample Photos */}
        <div>
          <span className="text-xs font-semibold text-slate-400 block mb-2">Ou teste com fotos de demonstração:</span>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {SAMPLE_LITHOPHANE_IMAGES.map((p) => (
              <button
                key={p.id}
                onClick={() => update({ imageUrl: p.url })}
                className="p-1.5 bg-slate-950 border border-slate-800 hover:border-indigo-500 rounded-xl text-left transition-all flex items-center gap-2 group"
              >
                <img
                  src={p.url}
                  alt={p.name}
                  className="w-10 h-10 object-cover rounded-lg"
                  referrerPolicy="no-referrer"
                />
                <div className="overflow-hidden">
                  <span className="text-xs font-bold text-slate-200 group-hover:text-white truncate block">
                    {p.name}
                  </span>
                  <span className="text-[10px] text-slate-400 truncate block">{p.category}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Shape Selector */}
      <div className="p-4 bg-slate-900/80 rounded-2xl border border-slate-800 space-y-3">
        <label className="block text-sm font-bold text-slate-200 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-indigo-400" /> Formato da Litofania
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {SHAPES.map((st) => (
            <button
              key={st.id}
              onClick={() => update({ shape: st.id })}
              className={`p-2.5 rounded-xl border text-left transition-all ${
                params.shape === st.id
                  ? 'bg-indigo-600/20 border-indigo-500 text-white ring-1 ring-indigo-500'
                  : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
              }`}
            >
              <div className="text-xs font-bold">{st.label}</div>
              <div className="text-[11px] text-slate-400 mt-0.5">{st.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Dimensions & Curvature */}
      <div className="p-4 bg-slate-900/80 rounded-2xl border border-slate-800 space-y-4">
        <label className="block text-sm font-bold text-slate-200 flex items-center gap-2">
          <Sliders className="w-4 h-4 text-indigo-400" /> Dimensões & Espessura de Camadas
        </label>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <div className="flex justify-between text-xs font-medium text-slate-300 mb-1">
              <span>Largura:</span>
              <span className="text-indigo-400 font-mono">{params.width} mm</span>
            </div>
            <input
              type="range"
              min={50}
              max={200}
              step={5}
              value={params.width}
              onChange={(e) => update({ width: Number(e.target.value) })}
              className="w-full accent-indigo-500 cursor-pointer"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs font-medium text-slate-300 mb-1">
              <span>Altura:</span>
              <span className="text-indigo-400 font-mono">{params.height} mm</span>
            </div>
            <input
              type="range"
              min={50}
              max={200}
              step={5}
              value={params.height}
              onChange={(e) => update({ height: Number(e.target.value) })}
              className="w-full accent-indigo-500 cursor-pointer"
            />
          </div>

          {params.shape === 'curved' && (
            <div>
              <div className="flex justify-between text-xs font-medium text-slate-300 mb-1">
                <span>Ângulo de Curvatura (Arco):</span>
                <span className="text-indigo-400 font-mono">{params.curveAngle}°</span>
              </div>
              <input
                type="range"
                min={15}
                max={90}
                step={5}
                value={params.curveAngle}
                onChange={(e) => update({ curveAngle: Number(e.target.value) })}
                className="w-full accent-indigo-500 cursor-pointer"
              />
            </div>
          )}

          <div>
            <div className="flex justify-between text-xs font-medium text-slate-300 mb-1">
              <span>Espessura Mínima (Claros):</span>
              <span className="text-indigo-400 font-mono">{params.minThickness} mm</span>
            </div>
            <input
              type="range"
              min={0.6}
              max={1.4}
              step={0.1}
              value={params.minThickness}
              onChange={(e) => update({ minThickness: Number(e.target.value) })}
              className="w-full accent-indigo-500 cursor-pointer"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs font-medium text-slate-300 mb-1">
              <span>Espessura Máxima (Escuros):</span>
              <span className="text-indigo-400 font-mono">{params.maxThickness} mm</span>
            </div>
            <input
              type="range"
              min={2.0}
              max={4.5}
              step={0.2}
              value={params.maxThickness}
              onChange={(e) => update({ maxThickness: Number(e.target.value) })}
              className="w-full accent-indigo-500 cursor-pointer"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs font-medium text-slate-300 mb-1">
              <span>Largura da Moldura:</span>
              <span className="text-indigo-400 font-mono">{params.frameBorder} mm</span>
            </div>
            <input
              type="range"
              min={0}
              max={8}
              step={0.5}
              value={params.frameBorder}
              onChange={(e) => update({ frameBorder: Number(e.target.value) })}
              className="w-full accent-indigo-500 cursor-pointer"
            />
          </div>
        </div>

        {/* Image Calibration (Contrast, Brightness, Smoothing) */}
        <div className="pt-3 border-t border-slate-800 space-y-3">
          <div className="text-xs font-bold text-slate-300">Calibração de Relevo da Imagem:</div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <div className="flex justify-between text-xs text-slate-400 mb-1">
                <span>Contraste:</span>
                <span className="text-indigo-400 font-mono">{params.imageContrast}x</span>
              </div>
              <input
                type="range"
                min={0.8}
                max={2.0}
                step={0.1}
                value={params.imageContrast}
                onChange={(e) => update({ imageContrast: Number(e.target.value) })}
                className="w-full accent-indigo-500 cursor-pointer"
              />
            </div>
            <div>
              <div className="flex justify-between text-xs text-slate-400 mb-1">
                <span>Brilho:</span>
                <span className="text-indigo-400 font-mono">{params.imageBrightness}%</span>
              </div>
              <input
                type="range"
                min={-30}
                max={30}
                step={5}
                value={params.imageBrightness}
                onChange={(e) => update({ imageBrightness: Number(e.target.value) })}
                className="w-full accent-indigo-500 cursor-pointer"
              />
            </div>
            <div>
              <div className="flex justify-between text-xs text-slate-400 mb-1">
                <span>Filtro Suavização:</span>
                <span className="text-indigo-400 font-mono">{params.smoothing}</span>
              </div>
              <input
                type="range"
                min={0}
                max={3}
                step={1}
                value={params.smoothing || 0}
                onChange={(e) => update({ smoothing: Number(e.target.value) })}
                className="w-full accent-indigo-500 cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Toggles */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-slate-800">
          <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-200">
            <input
              type="checkbox"
              checked={params.standIncluded}
              onChange={(e) => update({ standIncluded: e.target.checked })}
              className="w-4 h-4 rounded text-indigo-600 bg-slate-950 border-slate-700"
            />
            Incluir Pezinho / Cavalete de Mesa
          </label>

          <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-200">
            <input
              type="checkbox"
              checked={params.hangHole}
              onChange={(e) => update({ hangHole: e.target.checked })}
              className="w-4 h-4 rounded text-indigo-600 bg-slate-950 border-slate-700"
            />
            Furo para Pendurar na Parede
          </label>

          <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-200">
            <input
              type="checkbox"
              checked={params.inverted}
              onChange={(e) => update({ inverted: e.target.checked })}
              className="w-4 h-4 rounded text-indigo-600 bg-slate-950 border-slate-700"
            />
            Inverter Relevo (Negativo / Alto Relevo)
          </label>
        </div>
      </div>
    </div>
  );
};
