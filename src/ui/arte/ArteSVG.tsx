// Ilustración generada por código: degradado del tipo, trama de serigrafía, silueta anónima y emblema.
// Si existe una ilustración en src/assets/ilustraciones/<id>.png (preparada en src/assets/web), se usa esa.
import { memo, useState } from 'react';
import type { Carta } from '../../motor/tipos';
import { TIPO_INFO } from '../../datos/partidos';
import { ICONO_POR_DEFECTO, ICONOS } from './iconos';

const ARCHIVOS = import.meta.glob('../../assets/web/ilustraciones/*.webp', { eager: true, query: '?url', import: 'default' }) as Record<string, string>;
const IMAGEN: Record<string, string> = {};
for (const [ruta, url] of Object.entries(ARCHIVOS)) {
  const m = ruta.match(/([A-Z]-\d+)\.webp$/);
  if (m) IMAGEN[m[1]] = url;
}

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}

const COLOR_CLASE: Record<string, [string, string, string]> = {
  tertuliano: ['#2b2140', '#6a4fb0', '#c9b6ff'],
  asesor: ['#1d2b2b', '#2f7f7a', '#9fe3d8'],
  recurso: ['#262626', '#5a6178', '#d7dbe6'],
  herramienta: ['#2a2318', '#7d6a3e', '#f1d9a0'],
  escenario: ['#13233d', '#2f5d8e', '#a9cff5'],
  maniobra: ['#2a1620', '#7a2e4d', '#f2a7c4'],
};

const SILUETAS = [
  // busto de frente
  '<circle cx="0" cy="-34" r="16"/><path d="M-34 30c0-26 14-44 34-44s34 18 34 44z"/>',
  // brazo alzado (mitin)
  '<circle cx="-4" cy="-34" r="15"/><path d="M-36 30c0-24 12-42 32-42 8 0 14 2 18 6l14-30 8 4-14 36c4 8 6 16 6 26z"/>',
  // de perfil
  '<path d="M-8-50c14 0 22 10 22 22 0 4-1 7-3 10l6 6-6 2c0 6-4 9-10 9v4c22 4 30 16 30 27h-66c0-13 10-24 22-27v-6c-8-4-12-12-12-21 0-14 6-26 17-26z"/>',
  // señalando
  '<circle cx="-6" cy="-34" r="15"/><path d="M-38 30c0-24 12-42 32-42 10 0 18 4 24 10l26-6 2 8-26 8c2 6 4 14 4 22z"/>',
  // tras un atril
  '<circle cx="0" cy="-40" r="14"/><path d="M-26 10c0-20 10-34 26-34s26 14 26 34z"/><path d="M-30 4h60l-8 26h-44z"/>',
  // de espaldas mirando al público
  '<circle cx="0" cy="-36" r="15"/><path d="M-32 30c0-24 12-44 32-44s32 20 32 44z"/><path d="M-6-22h12v40H-6z" opacity=".25"/>',
  // brazos cruzados
  '<circle cx="0" cy="-36" r="15"/><path d="M-34 30c0-24 14-44 34-44s34 20 34 44z"/><path d="M-26 6h52v10h-52z" opacity=".3"/>',
  // con auriculares (radio / plató)
  '<circle cx="0" cy="-34" r="15"/><path d="M-18-36a18 18 0 0136 0" fill="none" stroke="currentColor" stroke-width="5"/><path d="M-34 30c0-26 14-44 34-44s34 18 34 44z"/>',
];

const TRAMAS = ['rayas', 'puntos', 'ondas', 'rayos', 'circulos', 'cuadricula'] as const;

function Trama({ tipo, id, color }: { tipo: (typeof TRAMAS)[number]; id: string; color: string }) {
  switch (tipo) {
    case 'rayas':
      return <pattern id={id} width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(35)"><rect width="3" height="8" fill={color} /></pattern>;
    case 'puntos':
      return <pattern id={id} width="7" height="7" patternUnits="userSpaceOnUse"><circle cx="3.5" cy="3.5" r="1.6" fill={color} /></pattern>;
    case 'ondas':
      return <pattern id={id} width="24" height="10" patternUnits="userSpaceOnUse"><path d="M0 5q6-5 12 0t12 0" fill="none" stroke={color} strokeWidth="1.6" /></pattern>;
    case 'cuadricula':
      return <pattern id={id} width="10" height="10" patternUnits="userSpaceOnUse"><path d="M10 0H0V10" fill="none" stroke={color} strokeWidth="1" /></pattern>;
    default:
      return <pattern id={id} width="12" height="12" patternUnits="userSpaceOnUse"><circle cx="6" cy="6" r="1" fill={color} /></pattern>;
  }
}

interface Props {
  carta: Carta;
  shiny?: boolean;
  /** relación de aspecto: 'ventana' (cartas normales) o 'completa' (arte completo) */
  forma?: 'ventana' | 'completa';
}

export const ArteSVG = memo(function ArteSVG({ carta: c, shiny, forma = 'ventana' }: Props) {
  const [rota, setRota] = useState(false);
  const url = IMAGEN[c.id];
  if (url && !rota) {
    return <img className="arte-img" src={url} alt="" loading="lazy" onError={() => setRota(true)} />;
  }
  const h = hash(c.id);
  const ancho = 200;
  const alto = forma === 'ventana' ? 130 : 280;
  const colores = c.clase === 'politico' ? [TIPO_INFO[c.tipo].oscuro, TIPO_INFO[c.tipo].color, TIPO_INFO[c.tipo].claro] : COLOR_CLASE[c.clase];
  const [oscuro, medio, claro] = shiny ? ['#3a1d5c', '#c58a1f', '#fff2b8'] : colores;
  const trama = TRAMAS[h % TRAMAS.length];
  const idG = `g-${c.id}${shiny ? 's' : ''}`;
  const idT = `t-${c.id}${shiny ? 's' : ''}`;
  const esPersona = !!c.persona;
  const silueta = SILUETAS[(h >>> 3) % SILUETAS.length];
  const icono = ICONOS[c.icono] ?? ICONOS[ICONO_POR_DEFECTO];
  const ang = (h >>> 7) % 360;
  const papel = '#f3f1ea';
  const acento = shiny ? '#ffffff' : '#e8b64a';
  return (
    <svg className="arte-svg" viewBox={`0 0 ${ancho} ${alto}`} preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <defs>
        <linearGradient id={idG} gradientTransform={`rotate(${ang % 90} .5 .5)`}>
          <stop offset="0" stopColor={oscuro} />
          <stop offset=".65" stopColor={medio} />
          <stop offset="1" stopColor={shiny ? '#62d5ff' : claro} />
        </linearGradient>
        <Trama tipo={trama} id={idT} color={shiny ? '#fff' : '#000'} />
      </defs>
      <rect width={ancho} height={alto} fill={`url(#${idG})`} />
      <rect width={ancho} height={alto} fill={`url(#${idT})`} opacity={shiny ? 0.18 : 0.16} />
      {trama === 'rayos' && (
        <g opacity=".14" fill={papel}>
          {Array.from({ length: 12 }, (_, i) => <path key={i} d={`M${ancho * 0.7} ${alto * 0.4}L${ancho * 0.7 + 260 * Math.cos((i * Math.PI) / 6)} ${alto * 0.4 + 260 * Math.sin((i * Math.PI) / 6)}L${ancho * 0.7 + 260 * Math.cos((i * Math.PI) / 6 + 0.18)} ${alto * 0.4 + 260 * Math.sin((i * Math.PI) / 6 + 0.18)}z`} />)}
        </g>
      )}
      {trama === 'circulos' && (
        <g fill="none" stroke={papel} opacity=".16" strokeWidth="2">
          {[20, 40, 60, 80, 100].map((r) => <circle key={r} cx={ancho * 0.72} cy={alto * 0.35} r={r} />)}
        </g>
      )}
      {/* suelo */}
      <rect y={alto * 0.78} width={ancho} height={alto * 0.22} fill="#000" opacity=".18" />
      {esPersona ? (
        <>
          <g transform={`translate(${ancho * 0.36} ${alto * 0.62}) scale(${forma === 'ventana' ? 1.15 : 1.9})`} fill={papel} color={papel} opacity=".92" dangerouslySetInnerHTML={{ __html: silueta }} />
          <g transform={`translate(${ancho * 0.6} ${alto * 0.12}) scale(${forma === 'ventana' ? 1 : 1.4})`}>
            <circle cx="32" cy="32" r="36" fill="#000" opacity=".22" />
            <g fill={acento} color={acento} dangerouslySetInnerHTML={{ __html: icono }} />
          </g>
        </>
      ) : (
        <g transform={`translate(${ancho / 2 - 48} ${alto / 2 - 50}) scale(1.5)`}>
          <g transform="translate(4 6)" fill="#000" opacity=".25" dangerouslySetInnerHTML={{ __html: icono }} />
          <g fill={papel} color={papel} dangerouslySetInnerHTML={{ __html: icono }} />
        </g>
      )}
      {shiny && (
        <g fill="#fff">
          {Array.from({ length: 9 }, (_, i) => {
            const x = ((h >>> (i * 3)) % 180) + 10;
            const y = ((h >>> (i * 2 + 1)) % (alto - 20)) + 10;
            const r = 2 + (i % 3);
            return <path key={i} className="destello" style={{ animationDelay: `${i * 0.27}s` }} d={`M${x} ${y - r * 2}L${x + r / 2} ${y - r / 2}L${x + r * 2} ${y}L${x + r / 2} ${y + r / 2}L${x} ${y + r * 2}L${x - r / 2} ${y + r / 2}L${x - r * 2} ${y}L${x - r / 2} ${y - r / 2}z`} />;
          })}
        </g>
      )}
    </svg>
  );
});
