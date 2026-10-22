import React from 'react';
import {
  DualTextParams,
  FontChoice,
  BaseType,
  DualTextLayoutStyle,
  EndDecoration,
  FillStrategy,
  LetterSculptStyle,
} from '../types';
import {
  Sparkles,
  Layers,
  Type,
  ShieldAlert,
  ArrowRightLeft,
  Heart,
  Star,
  Compass,
  Sliders,
  Palette,
  LayoutGrid,
  Wand2,
  Gem,
  Waves,
  CircleDot,
  Flame,
} from 'lucide-react';

interface DualTextControlsProps {
  params: DualTextParams;
  onChange: (params: DualTextParams) => void;
}

const FONTS: { id: FontChoice; label: string; desc: string }[] = [
  { id: 'Bungee', label: 'Bungee Block', desc: 'Display Pesado & Robusto para 3D (Recomendado)' },
  { id: 'Montserrat', label: 'Montserrat Bold', desc: 'Geométrico Moderno e Imponente' },
  { id: 'Oswald', label: 'Oswald Heavy', desc: 'Condensado para Nomes Longos' },
  { id: 'Alfa Slab One', label: 'Alfa Slab One', desc: 'Serifada Grossa com excelente volume' },
  { id: 'Fredoka', label: 'Fredoka Rounded', desc: 'Bordas Arredondadas & Fofas' },
  { id: 'Black Ops One', label: 'Black Ops Stencil', desc: 'Estilo Militar com recortes' },
  { id: 'Pacifico', label: 'Pacifico Cursive', desc: 'Caligrafia Artística e Fluida' },
  { id: 'Orbitron', label: 'Orbitron Sci-Fi', desc: 'Tech Gamer Futurista' },
  { id: 'Bangers', label: 'Bangers Comic', desc: 'Estilo Quadrinhos & Pop Art' },
  { id: 'Righteous', label: 'Righteous Retro', desc: 'Design Vintage & Elegante' },
  { id: 'Cinzel', label: 'Cinzel Roman', desc: 'Clássica Romana para Decoração' },
  { id: 'Plus Jakarta Sans', label: 'Jakarta Sans', desc: 'Minimalista & Clean' },
];

const PRESETS = [
  { name: 'MICHAEL & JESSICA', wordA: 'MICHAEL', wordB: 'JESSICA', font: 'Bungee' as FontChoice, decor: 'hearts' as EndDecoration, baseText: '' },
  { name: 'AMOR & PAZ', wordA: 'AMOR', wordB: 'PAZ', font: 'Bungee' as FontChoice, decor: 'hearts' as EndDecoration, baseText: '' },
  { name: 'GABRIEL & LARISSA', wordA: 'GABRIEL', wordB: 'LARISSA', font: 'Montserrat' as FontChoice, decor: 'hearts' as EndDecoration, baseText: '' },
  { name: 'LUCAS & MARI', wordA: 'LUCAS', wordB: 'MARI', font: 'Fredoka' as FontChoice, decor: 'hearts' as EndDecoration, baseText: '' },
  { name: 'LOVE & HOPE', wordA: 'LOVE', wordB: 'HOPE', font: 'Alfa Slab One' as FontChoice, decor: 'hearts' as EndDecoration, baseText: '' },
  { name: 'MÃE & PAI', wordA: 'MAE', wordB: 'PAI', font: 'Pacifico' as FontChoice, decor: 'hearts' as EndDecoration, baseText: '' },
  { name: 'HERO & DAD', wordA: 'HERO', wordB: 'DAD', font: 'Black Ops One' as FontChoice, decor: 'stars' as EndDecoration, baseText: '' },
  { name: 'BRUNO & CAMILA', wordA: 'BRUNO', wordB: 'CAMILA', font: 'Righteous' as FontChoice, decor: 'hearts' as EndDecoration, baseText: '' },
];

export const DualTextControls: React.FC<DualTextControlsProps> = ({ params, onChange }) => {
  const update = (partial: Partial<DualTextParams>) => {
    onChange({ ...params, ...partial });
  };

  const swapWords = () => {
    onChange({
      ...params,
      wordA: params.wordB,
      wordB: params.wordA,
    });
  };

  return (
    <div className="space-y-5">
      {/* Layout Style Switcher (Linear Display vs Monolith) */}
      <div className="p-3.5 bg-slate-900/90 rounded-2xl border border-indigo-500/30 shadow-lg">
        <label className="block text-xs font-bold uppercase tracking-wider text-indigo-400 mb-2 flex items-center gap-1.5">
          <LayoutGrid className="w-3.5 h-3.5" /> Modo de Construção da Ilusão
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <button
            id="btn-mode-linear"
            onClick={() => update({ layoutStyle: 'linear-display', baseType: 'pill', endDecoration: 'hearts' })}
            className={`p-3 rounded-xl border text-left transition-all ${
              params.layoutStyle === 'linear-display'
                ? 'bg-gradient-to-br from-indigo-900/50 to-rose-900/30 border-indigo-500 text-white ring-1 ring-indigo-500 shadow-md'
                : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
            }`}
          >
            <div className="font-bold text-sm text-slate-100 flex items-center gap-1.5">
              <Heart className="w-4 h-4 text-rose-400 fill-rose-500/30" />
              Escultura Linear (Estilo Casal)
            </div>
            <div className="text-[11px] text-slate-300 mt-1 leading-snug">
              Letras alinhadas em base cápsula, com corações 3D nas pontas e leitura perfeita a ±45°.
            </div>
          </button>

          <button
            id="btn-mode-monolith"
            onClick={() => update({ layoutStyle: 'monolith', baseType: 'solid', endDecoration: 'none' })}
            className={`p-3 rounded-xl border text-left transition-all ${
              params.layoutStyle === 'monolith'
                ? 'bg-gradient-to-br from-indigo-900/50 to-purple-900/30 border-indigo-500 text-white ring-1 ring-indigo-500 shadow-md'
                : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
            }`}
          >
            <div className="font-bold text-sm text-slate-100 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-400" />
              Bloco Monolítico (90° Cruzado)
            </div>
            <div className="text-[11px] text-slate-300 mt-1 leading-snug">
              Bloco compacto de 90° onde as duas palavras inteiras se cruzam no mesmo volume.
            </div>
          </button>
        </div>
      </div>

      {/* Quick Presets */}
      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
          Modelos e Casais Prontos
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {PRESETS.map((p) => (
            <button
              key={p.name}
              id={`preset-${p.wordA}-${p.wordB}`}
              onClick={() =>
                onChange({
                  ...params,
                  wordA: p.wordA,
                  wordB: p.wordB,
                  font: p.font,
                  endDecoration: p.decor,
                  baseText: p.baseText,
                  layoutStyle: 'linear-display',
                })
              }
              className={`px-3 py-2 text-left rounded-xl border text-xs font-medium transition-all ${
                params.wordA === p.wordA && params.wordB === p.wordB
                  ? 'bg-indigo-600/20 border-indigo-500 text-indigo-200 shadow-sm'
                  : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:bg-slate-850 hover:border-slate-700'
              }`}
            >
              <div className="font-bold text-slate-100 truncate">{p.name}</div>
              <div className="text-[10px] text-slate-400 mt-0.5">{p.font}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Dual Words Input */}
      <div className="p-4 bg-slate-900/80 rounded-2xl border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-400" /> Nomes / Palavras da Ilusão
          </h3>
          <button
            id="btn-swap-words"
            onClick={swapWords}
            title="Inverter Nome A e Nome B"
            className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-indigo-300 rounded-lg text-xs font-medium transition-colors"
          >
            <ArrowRightLeft className="w-3.5 h-3.5" /> Inverter
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Word A */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center justify-between">
              <span>Nome 1 (Ângulo Esquerdo / Frente)</span>
              <span className="text-[10px] text-indigo-400 font-mono">{params.wordA.length} letras</span>
            </label>
            <input
              id="input-word-a"
              type="text"
              value={params.wordA}
              onChange={(e) => update({ wordA: e.target.value.toUpperCase() })}
              placeholder="Ex: MICHAEL"
              maxLength={14}
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 font-bold text-base focus:ring-2 focus:ring-indigo-500 focus:border-transparent uppercase tracking-wider"
            />
            <p className="text-[11px] text-slate-400 mt-1">Visível ao olhar pelo ângulo esquerdo (+45°)</p>
          </div>

          {/* Word B */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center justify-between">
              <span>Nome 2 (Ângulo Direito / Lado)</span>
              <span className="text-[10px] text-indigo-400 font-mono">{params.wordB.length} letras</span>
            </label>
            <input
              id="input-word-b"
              type="text"
              value={params.wordB}
              onChange={(e) => update({ wordB: e.target.value.toUpperCase() })}
              placeholder="Ex: JESSICA"
              maxLength={14}
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 font-bold text-base focus:ring-2 focus:ring-indigo-500 focus:border-transparent uppercase tracking-wider"
            />
            <p className="text-[11px] text-slate-400 mt-1">Visível ao olhar pelo ângulo direito (-45°)</p>
          </div>
        </div>

        {/* Different Lengths Fill Strategy Dropdown */}
        {params.layoutStyle === 'linear-display' && (
          <div className="p-3.5 bg-indigo-950/40 border border-indigo-800/60 rounded-xl space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 text-indigo-200 font-medium">
                <Sparkles className="w-4 h-4 text-indigo-400 shrink-0" />
                <span>Preencher Letras Extras / Diferença de Tamanho:</span>
              </div>
              {params.wordA.length !== params.wordB.length ? (
                <span className="text-[10px] px-2 py-0.5 bg-indigo-500/20 text-indigo-300 rounded-full font-mono font-semibold">
                  {Math.abs(params.wordA.length - params.wordB.length)} espaço(s) a mais
                </span>
              ) : (
                <span className="text-[10px] text-slate-400">Tamanhos iguais</span>
              )}
            </div>

            <div className="space-y-1.5">
              <select
                id="select-fill-strategy"
                value={params.fillStrategy}
                onChange={(e) => update({ fillStrategy: e.target.value as FillStrategy })}
                className="w-full px-3 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 font-semibold text-xs focus:ring-2 focus:ring-indigo-500 focus:border-transparent cursor-pointer"
              >
                <option value="pad-heart-solid">❤️ Coração 3D Completo (Maciço e Volumétrico)</option>
                <option value="pad-heart">💖 Coração na Ilusão Dupla (Ângulo Duplo 45°)</option>
                <option value="pad-star-solid">⭐ Estrela 3D Completa (Maciça)</option>
                <option value="pad-star">🌟 Estrela na Ilusão Dupla</option>
                <option value="pad-infinity">♾️ Símbolo do Infinito 3D</option>
                <option value="pad-flower">🌸 Flor 3D Decorativa</option>
                <option value="pad-dot">⚪ Esfera / Ponto Minimalista</option>
                <option value="pad-repeat">🔤 Repetir Última Letra da Palavra Menor</option>
                <option value="pad-space">🚫 Sem Preenchimento (Espaço Vazio)</option>
              </select>

              <p className="text-[11px] text-slate-400 leading-relaxed">
                {params.fillStrategy === 'pad-heart-solid' && '❤️ Gera uma escultura de coração volumétrica 100% inteira e maciça onde faltar letra.'}
                {params.fillStrategy === 'pad-heart' && '💖 Intersecta a letra ativa e o coração na ilusão óptica de 45°.'}
                {params.fillStrategy === 'pad-star-solid' && '⭐ Insere uma estrela 3D sólida com relevo lapidado para preencher a diferença.'}
                {params.fillStrategy === 'pad-star' && '🌟 Projeta a estrela na intersecção dupla de 45°.'}
                {params.fillStrategy === 'pad-infinity' && '♾️ Adiciona um laço 3D do infinito para complementar a escultura.'}
                {params.fillStrategy === 'pad-flower' && '🌸 Adiciona uma flor 3D com pétalas e relevo delicado.'}
                {params.fillStrategy === 'pad-dot' && '⚪ Adiciona um ponto/pérola cilíndrico discreto.'}
                {params.fillStrategy === 'pad-repeat' && '🔤 Repete a última letra da palavra menor até igualar os comprimentos.'}
                {params.fillStrategy === 'pad-space' && '🚫 Deixa os espaços excedentes vazios sem adicionar bloco.'}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Font Selector */}
      <div className="p-4 bg-slate-900/80 rounded-2xl border border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-sm font-bold text-slate-200 flex items-center gap-2">
            <Type className="w-4 h-4 text-indigo-400" /> Tipografia & Família da Fonte
          </label>
          <span className="text-[11px] font-medium text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-full border border-indigo-500/20">
            {params.font}
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-52 overflow-y-auto pr-1">
          {FONTS.map((f) => (
            <button
              key={f.id}
              id={`btn-font-${f.id.replace(/\s+/g, '-')}`}
              onClick={() => update({ font: f.id })}
              className={`p-2.5 text-left rounded-xl border transition-all ${
                params.font === f.id
                  ? 'bg-indigo-600/20 border-indigo-500 text-white ring-1 ring-indigo-500'
                  : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
              }`}
            >
              <div
                className="text-sm font-bold truncate text-slate-100"
                style={{ fontFamily: `"${f.id}", sans-serif` }}
              >
                {f.label}
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5 truncate">{f.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* 3D Letter Sculpting & Stylization (Anti-Voxel / Smooth Geometry) */}
      <div className="p-4 bg-slate-900/80 rounded-2xl border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <label className="text-sm font-bold text-slate-200 flex items-center gap-2">
            <Wand2 className="w-4 h-4 text-emerald-400" /> Estilização & Escultura 3D das Letras
          </label>
          <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
            Anti-Quadriculado
          </span>
        </div>

        {/* Sculpt Style Options */}
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-2">
            Estilo de Geometria da Malha
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              {
                id: 'smooth' as LetterSculptStyle,
                label: 'Suave Curvo',
                sub: 'Orgânico & Fluido',
                icon: <Waves className="w-4 h-4 text-cyan-400" />,
              },
              {
                id: 'chamfer' as LetterSculptStyle,
                label: 'Chanfrado',
                sub: 'Lapidado & Alto Brilho',
                icon: <Gem className="w-4 h-4 text-purple-400" />,
              },
              {
                id: 'rounded' as LetterSculptStyle,
                label: 'Arredondado',
                sub: 'Macio & Sem Quinas',
                icon: <CircleDot className="w-4 h-4 text-amber-400" />,
              },
              {
                id: 'sharp' as LetterSculptStyle,
                label: 'Geométrico',
                sub: 'Arestas Vivas',
                icon: <Flame className="w-4 h-4 text-rose-400" />,
              },
            ].map((st) => (
              <button
                key={st.id}
                id={`btn-sculpt-${st.id}`}
                onClick={() => update({ sculptStyle: st.id })}
                className={`p-2.5 rounded-xl border text-left flex flex-col justify-between transition-all ${
                  (params.sculptStyle || 'smooth') === st.id
                    ? 'bg-emerald-600/20 border-emerald-500 text-white ring-1 ring-emerald-500'
                    : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  {st.icon}
                  {(params.sculptStyle || 'smooth') === st.id && (
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  )}
                </div>
                <div className="text-xs font-bold">{st.label}</div>
                <div className="text-[10px] text-slate-400 truncate">{st.sub}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Thickness / Boldness and Resolution Sliders */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
          <div>
            <div className="flex justify-between text-xs font-medium text-slate-300 mb-1">
              <span>Espessura / Encorpamento do Traço:</span>
              <span className="text-emerald-400 font-mono font-semibold">
                +{params.strokeBoldness ?? 2} px
              </span>
            </div>
            <input
              id="slider-stroke-boldness"
              type="range"
              min={0}
              max={6}
              step={1}
              value={params.strokeBoldness ?? 2}
              onChange={(e) => update({ strokeBoldness: Number(e.target.value) })}
              className="w-full accent-emerald-500 cursor-pointer"
            />
            <p className="text-[10px] text-slate-400 mt-1">
              Reforça hastes finas para tornar a peça hiper-resistente na impressão 3D
            </p>
          </div>

          <div>
            <div className="flex justify-between text-xs font-medium text-slate-300 mb-1">
              <span>Resolução & Suavidade da Malha:</span>
              <span className="text-emerald-400 font-mono font-semibold">
                {params.resolution || 48} camadas
              </span>
            </div>
            <input
              id="slider-resolution"
              type="range"
              min={32}
              max={80}
              step={4}
              value={params.resolution || 48}
              onChange={(e) => update({ resolution: Number(e.target.value) })}
              className="w-full accent-emerald-500 cursor-pointer"
            />
            <p className="text-[10px] text-slate-400 mt-1">
              Controla o nível de detalhe do perfil curvo e qualidade de fatiamento
            </p>
          </div>
        </div>
      </div>

      {/* End Decorations & Base Text (for Linear Display) */}
      {params.layoutStyle === 'linear-display' && (
        <div className="p-4 bg-slate-900/80 rounded-2xl border border-slate-800 space-y-4">
          <label className="block text-sm font-bold text-slate-200 flex items-center gap-2">
            <Heart className="w-4 h-4 text-rose-400" /> Detalhes & Decorações da Escultura
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* End Decorations */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Elementos nas Extremidades (Pontas)
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { id: 'hearts' as EndDecoration, label: 'Corações', icon: '❤️' },
                  { id: 'stars' as EndDecoration, label: 'Estrelas', icon: '⭐' },
                  { id: 'none' as EndDecoration, label: 'Nenhum', icon: '—' },
                ].map((d) => (
                  <button
                    key={d.id}
                    id={`btn-decor-${d.id}`}
                    onClick={() => update({ endDecoration: d.id })}
                    className={`p-2 rounded-xl border text-xs font-semibold flex flex-col items-center gap-1 transition-all ${
                      params.endDecoration === d.id
                        ? 'bg-rose-600 text-white border-rose-500'
                        : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <span className="text-sm">{d.icon}</span>
                    <span className="text-[10px]">{d.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Inscribed Base Text */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center justify-between">
                <span>Inscrição em Relevo na Base</span>
                <span className="text-[10px] text-slate-400">Opcional</span>
              </label>
              <input
                id="input-base-text"
                type="text"
                value={params.baseText}
                onChange={(e) => update({ baseText: e.target.value.toUpperCase() })}
                placeholder="Ex: FOREVER, ALWAYS, 12.05.2024"
                maxLength={20}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 text-xs font-semibold focus:ring-2 focus:ring-indigo-500 uppercase tracking-wider"
              />
              <p className="text-[10px] text-slate-400 mt-1">Letras brancas em relevo na base frontal</p>
            </div>
          </div>
        </div>
      )}

      {/* Base Type & Geometry Adjustments */}
      <div className="p-4 bg-slate-900/80 rounded-2xl border border-slate-800 space-y-4">
        <label className="block text-sm font-bold text-slate-200 flex items-center gap-2">
          <Layers className="w-4 h-4 text-indigo-400" /> Formato da Base & Dimensões
        </label>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {[
            { id: 'pill' as BaseType, label: 'Base Cápsula (Foto)', icon: '💊' },
            { id: 'chamfer' as BaseType, label: 'Pedestal Chanfrado', icon: '📐' },
            { id: 'solid' as BaseType, label: 'Retangular Sólida', icon: '■' },
            { id: 'none' as BaseType, label: 'Sem Base (Letras Soltas)', icon: '—' },
          ].map((b) => (
            <button
              key={b.id}
              id={`btn-base-${b.id}`}
              onClick={() => update({ baseType: b.id })}
              className={`p-2.5 rounded-xl border text-xs font-semibold flex flex-col items-center gap-1 transition-all ${
                params.baseType === b.id
                  ? 'bg-indigo-600 text-white border-indigo-500'
                  : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
              }`}
            >
              <span className="text-base">{b.icon}</span>
              <span className="text-center text-[11px]">{b.label}</span>
            </button>
          ))}
        </div>

        {/* Sliders */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
          <div>
            <div className="flex justify-between text-xs font-medium text-slate-300 mb-1">
              <span>Altura das Letras (e Corações):</span>
              <span className="text-indigo-400 font-mono font-semibold">{params.height} mm</span>
            </div>
            <input
              id="slider-height"
              type="range"
              min={25}
              max={90}
              step={5}
              value={params.height}
              onChange={(e) => update({ height: Number(e.target.value) })}
              className="w-full accent-indigo-500 cursor-pointer"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs font-medium text-slate-300 mb-1">
              <span>Espaçamento entre Letras:</span>
              <span className="text-indigo-400 font-mono font-semibold">{params.letterSpacing || 28} mm</span>
            </div>
            <input
              id="slider-letter-spacing"
              type="range"
              min={20}
              max={50}
              step={1}
              value={params.letterSpacing || 28}
              onChange={(e) => update({ letterSpacing: Number(e.target.value) })}
              className="w-full accent-indigo-500 cursor-pointer"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs font-medium text-slate-300 mb-1">
              <span>Espessura da Base:</span>
              <span className="text-indigo-400 font-mono font-semibold">{params.baseHeight} mm</span>
            </div>
            <input
              id="slider-base-height"
              type="range"
              min={2}
              max={12}
              step={1}
              value={params.baseHeight}
              onChange={(e) => update({ baseHeight: Number(e.target.value) })}
              className="w-full accent-indigo-500 cursor-pointer"
            />
          </div>
        </div>

        {/* Floating Parts Auto-Connector */}
        <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-200">Auto-conectar partes aéreas</div>
            <div className="text-[11px] text-slate-400">Garante que pingos do "i" e letras isoladas fiquem presas ao chão</div>
          </div>
          <input
            id="toggle-autoconnect"
            type="checkbox"
            checked={params.autoConnectFloatingParts}
            onChange={(e) => update({ autoConnectFloatingParts: e.target.checked })}
            className="w-4 h-4 rounded text-indigo-600 bg-slate-950 border-slate-700 focus:ring-indigo-500 cursor-pointer"
          />
        </div>
      </div>
    </div>
  );
};
