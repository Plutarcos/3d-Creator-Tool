import React from 'react';
import { Layers, Play, Pause, RotateCcw } from 'lucide-react';

interface SlicingPreviewSliderProps {
  progress: number;
  onChange: (progress: number) => void;
  heightMm: number;
}

export const SlicingPreviewSlider: React.FC<SlicingPreviewSliderProps> = ({
  progress,
  onChange,
  heightMm,
}) => {
  const [isPlaying, setIsPlaying] = React.useState(false);
  const currentHeight = (progress * heightMm).toFixed(1);
  const estimatedLayer = Math.round(progress * (heightMm / 0.2));
  const totalLayers = Math.round(heightMm / 0.2);

  React.useEffect(() => {
    let animId: number;
    if (isPlaying) {
      const step = () => {
        onChange((prev) => {
          if (prev >= 1) {
            setIsPlaying(false);
            return 1;
          }
          return Math.min(1, prev + 0.008);
        });
        animId = requestAnimationFrame(step);
      };
      animId = requestAnimationFrame(step);
    }
    return () => cancelAnimationFrame(animId);
  }, [isPlaying, onChange]);

  return (
    <div className="p-3 bg-slate-900/90 rounded-2xl border border-slate-800 space-y-2 shadow-lg">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
          <Layers className="w-3.5 h-3.5 text-indigo-400" /> Simulação de Camadas (Fatiador 3D)
        </span>
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono text-indigo-300">
            Camada {estimatedLayer} / {totalLayers} ({currentHeight} mm)
          </span>
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="p-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition-colors text-xs flex items-center gap-1"
            title={isPlaying ? 'Pausar Simulação' : 'Reproduzir Impressão'}
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5 text-amber-400" /> : <Play className="w-3.5 h-3.5 text-emerald-400" />}
          </button>
          <button
            onClick={() => {
              setIsPlaying(false);
              onChange(1.0);
            }}
            className="p-1 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 rounded-lg transition-colors"
            title="Resetar para Modelo Completo"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <span className="text-[10px] font-mono text-slate-500">Base</span>
        <input
          type="range"
          min={0.05}
          max={1.0}
          step={0.01}
          value={progress}
          onChange={(e) => {
            setIsPlaying(false);
            onChange(Number(e.target.value));
          }}
          className="w-full accent-indigo-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
        />
        <span className="text-[10px] font-mono text-slate-500">100%</span>
      </div>
    </div>
  );
};
