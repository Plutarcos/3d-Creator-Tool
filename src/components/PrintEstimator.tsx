import React from 'react';
import { ModelStats } from '../types';
import { Scale, Clock, Triangle, AlertTriangle, CheckCircle2, SlidersHorizontal } from 'lucide-react';

interface PrintEstimatorProps {
  stats: ModelStats;
}

export const PrintEstimator: React.FC<PrintEstimatorProps> = ({ stats }) => {
  const hours = Math.floor(stats.estimatedPrintTimeMinutes / 60);
  const minutes = stats.estimatedPrintTimeMinutes % 60;
  const timeFormatted = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;

  return (
    <div className="p-4 bg-slate-900/90 rounded-2xl border border-slate-800 space-y-3 shadow-lg">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
          <SlidersHorizontal className="w-3.5 h-3.5 text-indigo-400" /> Métricas de Impressão 3D
        </h4>
        {stats.isPrintable ? (
          <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
            <CheckCircle2 className="w-3 h-3" /> 100% Imprimível
          </span>
        ) : (
          <span className="flex items-center gap-1 text-[11px] font-semibold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full">
            <AlertTriangle className="w-3 h-3" /> Atenção
          </span>
        )}
      </div>

      {/* Grid of Key Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {/* Dimensions */}
        <div className="p-2.5 bg-slate-950/80 rounded-xl border border-slate-800/80">
          <div className="text-[10px] text-slate-400 flex items-center gap-1 mb-1">
            <Scale className="w-3 h-3 text-indigo-400" /> Dimensões (X×Y×Z)
          </div>
          <div className="text-xs font-mono font-bold text-slate-100">
            {stats.dimensions.x} × {stats.dimensions.y} × {stats.dimensions.z} <span className="text-[10px] font-normal text-slate-400">mm</span>
          </div>
        </div>

        {/* PLA Weight */}
        <div className="p-2.5 bg-slate-950/80 rounded-xl border border-slate-800/80">
          <div className="text-[10px] text-slate-400 flex items-center gap-1 mb-1">
            <Scale className="w-3 h-3 text-emerald-400" /> Peso Est. (PLA 20%)
          </div>
          <div className="text-xs font-mono font-bold text-emerald-300">
            ~{stats.estimatedWeightGrams} <span className="text-[10px] font-normal text-slate-400">gramas</span>
          </div>
        </div>

        {/* Print Time */}
        <div className="p-2.5 bg-slate-950/80 rounded-xl border border-slate-800/80">
          <div className="text-[10px] text-slate-400 flex items-center gap-1 mb-1">
            <Clock className="w-3 h-3 text-amber-400" /> Tempo Estimado
          </div>
          <div className="text-xs font-mono font-bold text-amber-300">
            ~{timeFormatted}
          </div>
        </div>

        {/* Triangles */}
        <div className="p-2.5 bg-slate-950/80 rounded-xl border border-slate-800/80">
          <div className="text-[10px] text-slate-400 flex items-center gap-1 mb-1">
            <Triangle className="w-3 h-3 text-cyan-400" /> Triângulos / Malha
          </div>
          <div className="text-xs font-mono font-bold text-cyan-300">
            {stats.triangleCount.toLocaleString()}
          </div>
        </div>
      </div>

      {/* Warnings if any */}
      {stats.warnings.length > 0 && (
        <div className="p-2.5 bg-amber-500/10 border border-amber-500/30 rounded-xl text-xs text-amber-300 space-y-1">
          {stats.warnings.map((w, idx) => (
            <div key={idx} className="flex items-start gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-amber-400" />
              <span>{w}</span>
            </div>
          ))}
        </div>
      )}

      {/* Slicer Recommendations */}
      <div className="text-[11px] text-slate-400 bg-slate-950/60 p-2 rounded-xl border border-slate-800/50 flex flex-wrap gap-x-4 gap-y-1">
        <span>⚙️ <strong>Infill recomendado:</strong> 15-20% Grid/Gyroid</span>
        <span>📏 <strong>Altura de camada:</strong> 0.20mm (ou 0.12mm p/ detalhes)</span>
        <span>🛡️ <strong>Suportes:</strong> Não necessários na maioria dos ângulos</span>
      </div>
    </div>
  );
};
