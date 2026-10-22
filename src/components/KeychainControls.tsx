import React from 'react';
import {
  KeychainParams,
  KeychainType,
  FontChoice,
  KeychainBaseStyle,
  TailCharmType,
  FlexiSegmentStyle,
} from '../types';
import { KeyRound, Sparkles, Type, Sliders, Layers, QrCode, Heart, MoveHorizontal, CheckCircle2 } from 'lucide-react';

interface KeychainControlsProps {
  params: KeychainParams;
  onChange: (params: KeychainParams) => void;
}

const KEYCHAIN_TYPES: { id: KeychainType; label: string; desc: string; icon: any }[] = [
  {
    id: 'flexi-articulated',
    label: 'Nome Maleável (Articulado)',
    desc: 'Letras separadas com junta de pino/garfo (Print-in-Place)',
    icon: Sparkles,
  },
  {
    id: 'fixed-name',
    label: 'Nome Fixo (Placa Sólida)',
    desc: 'Base inteiriça com letras em alto relevo 3D',
    icon: KeyRound,
  },
  {
    id: 'qr-code',
    label: 'Chaveiro QR Code',
    desc: 'Link, Pix, Wi-Fi ou Contato',
    icon: QrCode,
  },
];

const FONTS: { id: FontChoice; label: string; desc: string }[] = [
  { id: 'Bungee', label: 'Bungee', desc: 'Display Pesado (Melhor para 3D)' },
  { id: 'Fredoka', label: 'Fredoka', desc: 'Arredondado Amigável' },
  { id: 'Montserrat', label: 'Montserrat', desc: 'Moderno Geométrico' },
  { id: 'Oswald', label: 'Oswald', desc: 'Condensado Impactante' },
  { id: 'Black Ops One', label: 'Black Ops One', desc: 'Estilo Militar Stencil' },
  { id: 'Pacifico', label: 'Pacifico', desc: 'Cursiva Fluida' },
  { id: 'Orbitron', label: 'Orbitron', desc: 'Tech Gamer' },
  { id: 'Bangers', label: 'Bangers', desc: 'Estilo Quadrinhos' },
  { id: 'Cinzel', label: 'Cinzel', desc: 'Romano Elegante' },
  { id: 'Plus Jakarta Sans', label: 'Jakarta Sans', desc: 'Minimalista Clean' },
];

const FLEXI_SEGMENT_STYLES: { id: FlexiSegmentStyle; label: string; desc: string }[] = [
  { id: 'pure-letters', label: 'Apenas as Letras (Sem Placa)', desc: 'O modelo 3D é a própria letra articulada' },
  { id: 'capsule-links', label: 'Cápsula Arredondada', desc: 'Letras apoiadas em plaquinhas ovais' },
  { id: 'hexagon-links', label: 'Gomos Hexagonais', desc: 'Plaquinhas geométricas tech' },
  { id: 'bone-links', label: 'Ossinhos (Pet)', desc: 'Plaquinhas em formato de osso' },
];

const BASE_STYLES: { id: KeychainBaseStyle; label: string }[] = [
  { id: 'pill', label: 'Cápsula Arredondada' },
  { id: 'outline', label: 'Retangular Chanfrado' },
  { id: 'hexagon', label: 'Hexagonal' },
  { id: 'bone', label: 'Osso (Pet Tag)' },
];

const TAIL_CHARMS: { id: TailCharmType; label: string }[] = [
  { id: 'heart', label: 'Coração ❤️' },
  { id: 'star', label: 'Estrela ⭐' },
  { id: 'bone', label: 'Osso 🦴' },
  { id: 'paw', label: 'Patinha 🐾' },
  { id: 'skull', label: 'Caveira 💀' },
  { id: 'none', label: 'Nenhum' },
];

export const KeychainControls: React.FC<KeychainControlsProps> = ({ params, onChange }) => {
  const update = (partial: Partial<KeychainParams>) => {
    onChange({ ...params, ...partial });
  };

  return (
    <div className="space-y-6">
      {/* Keychain Type Mode */}
      <div className="p-4 bg-slate-900/80 rounded-2xl border border-slate-800 space-y-3">
        <label className="block text-sm font-bold text-slate-200 flex items-center gap-2">
          <KeyRound className="w-4 h-4 text-indigo-400" /> Tipo de Chaveiro
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {KEYCHAIN_TYPES.map((t) => {
            const Icon = t.icon;
            const isSelected = params.type === t.id;
            return (
              <button
                key={t.id}
                onClick={() => update({ type: t.id })}
                className={`p-3 rounded-xl border text-left transition-all ${
                  isSelected
                    ? 'bg-indigo-600/20 border-indigo-500 text-white ring-1 ring-indigo-500 shadow-md shadow-indigo-600/20'
                    : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Icon className={`w-4 h-4 ${isSelected ? 'text-indigo-400' : 'text-slate-400'}`} />
                  <span className="text-xs font-bold">{t.label}</span>
                </div>
                <div className="text-[11px] text-slate-400 leading-tight">{t.desc}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Inputs for Name & Subtitle or QR */}
      {params.type !== 'qr-code' ? (
        <div className="p-4 bg-slate-900/80 rounded-2xl border border-slate-800 space-y-4">
          <label className="block text-sm font-bold text-slate-200 flex items-center gap-2">
            <Type className="w-4 h-4 text-indigo-400" /> Texto do Chaveiro
          </label>

          <div>
            <div className="flex justify-between text-xs font-medium text-slate-300 mb-1">
              <span>Nome / Palavra Principal:</span>
              <span className="text-slate-400 text-[11px]">{params.text.length} letras</span>
            </div>
            <input
              type="text"
              value={params.text}
              onChange={(e) => update({ text: e.target.value })}
              placeholder="Ex: GABRIEL"
              maxLength={12}
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 font-extrabold tracking-wider text-base focus:ring-2 focus:ring-indigo-500 uppercase"
            />
            {params.type === 'flexi-articulated' && (
              <p className="text-[11px] text-emerald-400 mt-1.5 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                Cada letra é impressa como um elo individual separado com pino articulado!
              </p>
            )}
          </div>

          {params.type === 'fixed-name' && (
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Subtítulo / Telefone (Opcional):</label>
              <input
                type="text"
                value={params.subtitle}
                onChange={(e) => update({ subtitle: e.target.value })}
                placeholder="Ex: (11) 98765-4321 ou PET TAG"
                maxLength={20}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 font-medium text-sm focus:ring-2 focus:ring-indigo-500 uppercase"
              />
            </div>
          )}
        </div>
      ) : (
        <div className="p-4 bg-slate-900/80 rounded-2xl border border-slate-800 space-y-4">
          <label className="block text-sm font-bold text-slate-200 flex items-center gap-2">
            <QrCode className="w-4 h-4 text-indigo-400" /> Conteúdo do QR Code
          </label>
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">URL, Chave PIX, Wi-Fi ou Mensagem:</label>
            <input
              type="text"
              value={params.qrContent}
              onChange={(e) => update({ qrContent: e.target.value })}
              placeholder="https://seusite.com ou Chave Pix"
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 font-medium text-sm focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>
      )}

      {/* Font Family Selector (For Name Keychains) */}
      {params.type !== 'qr-code' && (
        <div className="p-4 bg-slate-900/80 rounded-2xl border border-slate-800 space-y-3">
          <label className="block text-sm font-bold text-slate-200 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-400" /> Escolha a Fonte das Letras
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-44 overflow-y-auto pr-1">
            {FONTS.map((font) => (
              <button
                key={font.id}
                onClick={() => update({ font: font.id })}
                className={`p-2.5 rounded-xl border text-left transition-all ${
                  params.font === font.id
                    ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-sm ring-1 ring-indigo-500'
                    : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                }`}
              >
                <div className="text-xs font-bold">{font.label}</div>
                <div className="text-[11px] text-slate-400">{font.desc}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Flexi Articulated Specific Settings */}
      {params.type === 'flexi-articulated' && (
        <div className="p-4 bg-slate-900/80 rounded-2xl border border-slate-800 space-y-4">
          <label className="block text-sm font-bold text-slate-200 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-400" /> Parâmetros dos Elos Articulados
          </label>

          {/* Segment Shape Style */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5">Formato dos Elos das Letras:</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {FLEXI_SEGMENT_STYLES.map((fs) => (
                <button
                  key={fs.id}
                  onClick={() => update({ flexiSegmentStyle: fs.id })}
                  className={`p-2.5 rounded-xl text-left border transition-all ${
                    (params.flexiSegmentStyle || 'pure-letters') === fs.id
                      ? 'bg-indigo-600/25 border-indigo-500 text-white ring-1 ring-indigo-500 shadow-sm shadow-indigo-600/20'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                  }`}
                >
                  <div className="text-xs font-bold">{fs.label}</div>
                  <div className="text-[10px] text-slate-400">{fs.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Tail Charm */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5">Pingente na Última Letra:</label>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
              {TAIL_CHARMS.map((tc) => (
                <button
                  key={tc.id}
                  onClick={() => update({ tailCharm: tc.id })}
                  className={`py-1.5 px-1.5 rounded-lg text-[11px] font-bold border transition-all text-center truncate ${
                    (params.tailCharm || 'heart') === tc.id
                      ? 'bg-indigo-600 border-indigo-400 text-white'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {tc.label}
                </button>
              ))}
            </div>
          </div>

          {/* Joint Clearance & Looseness (Print-in-Place Anti-Fusion Controls) */}
          <div className="p-3.5 bg-slate-950/70 rounded-xl border border-indigo-500/30 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" /> Folga da Articulação (Frouxa / Solta):
              </label>
              <span className={`px-2 py-0.5 rounded-full text-xs font-mono font-bold border ${
                (params.flexiJointClearance || 0.85) < 0.60
                  ? 'bg-amber-950/40 text-amber-300 border-amber-700/50'
                  : (params.flexiJointClearance || 0.85) <= 0.95
                  ? 'bg-emerald-950/40 text-emerald-300 border-emerald-700/50'
                  : 'bg-cyan-950/40 text-cyan-300 border-cyan-700/50'
              }`}>
                {(params.flexiJointClearance || 0.85).toFixed(2)} mm
              </span>
            </div>

            {/* Quick Tolerance Presets */}
            <div>
              <span className="text-[11px] text-slate-400 block mb-1.5 font-medium">Ajustes Rápidos de Folga:</span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                {[
                  { val: 0.50, label: 'Firme', tag: '0.50mm' },
                  { val: 0.70, label: 'Padrão', tag: '0.70mm' },
                  { val: 0.85, label: 'Solto ⭐', tag: '0.85mm', rec: true },
                  { val: 1.10, label: 'Super Frouxo', tag: '1.10mm' },
                ].map((preset) => {
                  const isCurrent = Math.abs((params.flexiJointClearance || 0.85) - preset.val) < 0.03;
                  return (
                    <button
                      key={preset.val}
                      type="button"
                      onClick={() => update({ flexiJointClearance: preset.val })}
                      className={`p-2 rounded-lg text-left border transition-all ${
                        isCurrent
                          ? preset.rec
                            ? 'bg-emerald-600/30 border-emerald-400 text-white ring-1 ring-emerald-400 shadow-sm shadow-emerald-500/20'
                            : 'bg-indigo-600/30 border-indigo-400 text-white ring-1 ring-indigo-400 shadow-sm'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                      }`}
                    >
                      <div className="text-xs font-bold leading-tight">{preset.label}</div>
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5">{preset.tag}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Continuous Clearance Slider */}
            <div>
              <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                <span>Ajuste Fino da Folga (0.40 a 1.30 mm):</span>
                <span className="text-slate-300 font-medium">
                  {(params.flexiJointClearance || 0.85) < 0.60
                    ? 'Apertado (Risco de fundir)'
                    : (params.flexiJointClearance || 0.85) <= 0.95
                    ? 'Folga Macia (Recomendado)'
                    : 'Folga Máxima (Anti-Fusão)'}
                </span>
              </div>
              <input
                type="range"
                min={0.40}
                max={1.30}
                step={0.05}
                value={params.flexiJointClearance || 0.85}
                onChange={(e) => update({ flexiJointClearance: Number(e.target.value) })}
                className="w-full accent-emerald-500 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500 px-0.5 mt-0.5">
                <span>0.40 mm (Apertado)</span>
                <span className="text-emerald-400 font-bold">0.85 mm (Ideal FDM)</span>
                <span>1.30 mm (Ultra Frouxo)</span>
              </div>
            </div>

            {/* Segment Gap Slider */}
            <div className="pt-2 border-t border-slate-800/80">
              <div className="flex justify-between text-xs font-medium text-slate-300 mb-1">
                <span>Espaçamento entre Letras (Distância das Paredes):</span>
                <span className="text-indigo-400 font-mono font-bold">
                  {(params.flexiSegmentGap || 5.6).toFixed(1)} mm
                </span>
              </div>
              <input
                type="range"
                min={4.5}
                max={8.5}
                step={0.5}
                value={params.flexiSegmentGap || 5.6}
                onChange={(e) => update({ flexiSegmentGap: Number(e.target.value) })}
                className="w-full accent-indigo-500 cursor-pointer"
              />
              <div className="text-[11px] text-slate-400 mt-1">
                Espaço extra entre as letras para que as laterais não encostem nem travem quando as articulações giram.
              </div>
            </div>
          </div>

          {/* Interactive Live Articulation Flex Preview */}
          <div className="pt-2 border-t border-slate-800 space-y-2">
            <div className="flex justify-between text-xs font-medium text-slate-300 mb-1">
              <span className="flex items-center gap-1.5 font-bold text-slate-200">
                <MoveHorizontal className="w-4 h-4 text-rose-400" /> Movimento Articulado em Tempo Real:
              </span>
              <span className="text-rose-400 font-mono font-bold">
                {(params.previewFlexAngle || 0) === 0 ? '0° (Reto / Mesa 3D)' : `${params.previewFlexAngle}° (Flexionado)`}
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={45}
              step={1}
              value={params.previewFlexAngle || 0}
              onChange={(e) => update({ previewFlexAngle: Number(e.target.value) })}
              className="w-full accent-rose-500 cursor-pointer"
            />
            <div className="grid grid-cols-3 gap-1.5 pt-1">
              <button
                type="button"
                onClick={() => update({ previewFlexAngle: 0 })}
                className={`py-2 px-2 rounded-lg text-xs font-bold border transition-all text-center ${
                  (params.previewFlexAngle || 0) === 0
                    ? 'bg-emerald-600/30 border-emerald-500 text-emerald-300 ring-1 ring-emerald-500'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                0° Reto (Mesa 3D)
              </button>
              <button
                type="button"
                onClick={() => update({ previewFlexAngle: 20 })}
                className={`py-2 px-2 rounded-lg text-xs font-bold border transition-all text-center ${
                  (params.previewFlexAngle || 0) === 20
                    ? 'bg-rose-600/30 border-rose-500 text-white ring-1 ring-rose-500'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                20° Curva Suave
              </button>
              <button
                type="button"
                onClick={() => update({ previewFlexAngle: 35 })}
                className={`py-2 px-2 rounded-lg text-xs font-bold border transition-all text-center ${
                  (params.previewFlexAngle || 0) === 35
                    ? 'bg-rose-600/30 border-rose-500 text-white ring-1 ring-rose-500'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                35° Serpente Flexi
              </button>
            </div>

            {/* Anti-Fusion 3D Printing Guide */}
            <div className="p-3 bg-slate-950/80 rounded-xl border border-emerald-500/40 mt-3 space-y-2">
              <div className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                Guia Anti-Fusão para Impressão 3D Perfeita:
              </div>
              <ul className="text-[11px] text-slate-300 space-y-1.5 leading-relaxed pl-1">
                <li className="flex items-start gap-1.5">
                  <span className="text-emerald-400 font-bold shrink-0">•</span>
                  <span><strong>Altura de Camada:</strong> imprima com 0.16mm ou 0.20mm (não use 0.28mm para evitar degraus no pino).</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="text-emerald-400 font-bold shrink-0">•</span>
                  <span><strong>Sem Suportes (Supports: OFF):</strong> o mecanismo possui chanfros autoportantes de 45°. Se ativar suporte, ele vai travar a junta!</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="text-emerald-400 font-bold shrink-0">•</span>
                  <span><strong>Primeiro Uso:</strong> espere a peça esfriar na mesa. Segure duas letras e faça uma leve torção manual (um suave estalo soltará qualquer micro-teia e o chaveiro ficará 100% livre e solto!).</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="text-emerald-400 font-bold shrink-0">•</span>
                  <span><strong>Posição da Costura (Z-Seam):</strong> coloque como "Aleatória" ou "Traseira" no fatiador para não formar relevo no diâmetro do pino.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Fixed Name Base Style */}
      {params.type === 'fixed-name' && (
        <div className="p-4 bg-slate-900/80 rounded-2xl border border-slate-800 space-y-3">
          <label className="block text-sm font-bold text-slate-200 flex items-center gap-2">
            <Layers className="w-4 h-4 text-indigo-400" /> Formato da Base do Chaveiro
          </label>
          <div className="grid grid-cols-2 gap-2">
            {BASE_STYLES.map((bs) => (
              <button
                key={bs.id}
                onClick={() => update({ baseStyle: bs.id })}
                className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all text-left truncate ${
                  params.baseStyle === bs.id
                    ? 'bg-indigo-600/20 border-indigo-500 text-white ring-1 ring-indigo-500'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                {bs.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Dimensions & Hole Configuration */}
      <div className="p-4 bg-slate-900/80 rounded-2xl border border-slate-800 space-y-4">
        <label className="block text-sm font-bold text-slate-200 flex items-center gap-2">
          <Sliders className="w-4 h-4 text-indigo-400" /> Dimensões & Argola do Chaveiro
        </label>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <div className="flex justify-between text-xs font-medium text-slate-300 mb-1">
              <span>Altura das Letras:</span>
              <span className="text-indigo-400 font-mono font-bold">{params.fontSize} mm</span>
            </div>
            <input
              type="range"
              min={18}
              max={34}
              step={2}
              value={params.fontSize}
              onChange={(e) => update({ fontSize: Number(e.target.value) })}
              className="w-full accent-indigo-500 cursor-pointer"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs font-medium text-slate-300 mb-1">
              <span>Espessura da Base/Elos:</span>
              <span className="text-indigo-400 font-mono font-bold">{params.baseThickness} mm</span>
            </div>
            <input
              type="range"
              min={3.2}
              max={5.6}
              step={0.2}
              value={params.baseThickness}
              onChange={(e) => update({ baseThickness: Number(e.target.value) })}
              className="w-full accent-indigo-500 cursor-pointer"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs font-medium text-slate-300 mb-1">
              <span>Diâmetro do Furo da Argola:</span>
              <span className="text-indigo-400 font-mono font-bold">Ø {params.holeDiameter} mm</span>
            </div>
            <input
              type="range"
              min={3.0}
              max={6.0}
              step={0.5}
              value={params.holeDiameter}
              onChange={(e) => update({ holeDiameter: Number(e.target.value) })}
              className="w-full accent-indigo-500 cursor-pointer"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs font-medium text-slate-300 mb-1">
              <span>Posição da Argola:</span>
              <span className="text-indigo-400 font-bold uppercase">{params.holePosition}</span>
            </div>
            <div className="flex gap-1.5">
              {(['left', 'right', 'top'] as const).map((pos) => (
                <button
                  key={pos}
                  onClick={() => update({ holePosition: pos })}
                  className={`flex-1 py-1 rounded-lg text-xs font-bold border transition-all ${
                    params.holePosition === pos
                      ? 'bg-indigo-600 border-indigo-400 text-white'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {pos === 'left' ? 'Esquerda' : pos === 'right' ? 'Direita' : 'Topo'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {params.type === 'fixed-name' && (
          <div className="pt-2 border-t border-slate-800">
            <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-200">
              <input
                type="checkbox"
                checked={params.reinforcedRing}
                onChange={(e) => update({ reinforcedRing: e.target.checked })}
                className="w-4 h-4 rounded text-indigo-600 bg-slate-950 border-slate-700"
              />
              Orelha Externa Reforçada para Argola
            </label>
          </div>
        )}
      </div>
    </div>
  );
};
