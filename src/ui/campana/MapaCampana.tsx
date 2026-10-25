// El mapa real de las 52 circunscripciones (adaptado de «176 · La Batalla del 29N»), coloreado según la campaña.
import { memo } from 'react';
import mapa from '../../datos/mapa.json';
import { PROVINCIAS } from '../../datos/provincias';

const CENTROS = mapa.centros as unknown as Record<string, [number, number]>;
const RUTAS = mapa.provincias as unknown as Record<string, string>;
// pequeños ajustes para que los marcadores no se pisen donde las provincias son diminutas
const DESPLAZA: Record<string, [number, number]> = { '20': [10, -10], '01': [-6, 10], '48': [-14, -8], '51': [-8, 4], '52': [10, 4], '28': [0, 4] };
const pos = (id: string): [number, number] => {
  const [x, y] = CENTROS[id];
  const [dx, dy] = DESPLAZA[id] ?? [0, 0];
  return [x + dx, y + dy];
};

interface Props {
  dueno: Record<string, 'yo' | 'rival'>;
  colores: { yo: string; rival: string };
  elegibles: Set<string>;
  elegida: string | null;
  onElegir: (id: string) => void;
}

export const MapaCampana = memo(function MapaCampana({ dueno, colores, elegibles, elegida, onElegir }: Props) {
  // las elegibles y la elegida al final, para que su borde no quede tapado por las vecinas
  const orden = [...PROVINCIAS].sort((a, b) => Number(elegibles.has(a.id)) + Number(a.id === elegida) * 2 - Number(elegibles.has(b.id)) - Number(b.id === elegida) * 2);
  return (
    <svg className="mapa-campana" viewBox={`0 0 ${mapa.ancho} ${mapa.alto}`} preserveAspectRatio="xMidYMid meet" role="group" aria-label="Mapa de circunscripciones">
      <defs>
        <radialGradient id="mar-campana" cx="50%" cy="40%" r="75%">
          <stop offset="0%" stopColor="#13213a" />
          <stop offset="100%" stopColor="#0a1220" />
        </radialGradient>
      </defs>
      <rect x={-2000} y={-2000} width={5000} height={5000} fill="url(#mar-campana)" />
      <path d={mapa.vecinos} fill="#18233a" stroke="#22304d" strokeWidth={1} />
      <path d={mapa.recuadro} fill="none" stroke="var(--linea)" strokeWidth={1.2} strokeDasharray="5 5" />
      {orden.map((p) => {
        const d = dueno[p.id];
        const puede = elegibles.has(p.id);
        const relleno = d === 'yo' ? colores.yo : d === 'rival' ? colores.rival : '#34405a';
        return (
          <path key={p.id} d={RUTAS[p.id]} className={`prov-campana ${puede ? 'elegible' : ''} ${elegida === p.id ? 'elegida' : ''}`}
            fill={relleno} fillOpacity={d ? 0.85 : puede ? 0.95 : 0.6}
            onClick={puede || d ? () => onElegir(p.id) : undefined}
            role={puede ? 'button' : undefined} tabIndex={puede ? 0 : undefined} data-prov={p.id}
            aria-label={`${p.nombre}: ${p.escanos} escaños${d === 'yo' ? ', tuya' : d === 'rival' ? ', del rival' : ''}`}
            onKeyDown={puede ? (ev) => { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); onElegir(p.id); } } : undefined} />
        );
      })}
      <g pointerEvents="none">
        {PROVINCIAS.map((p) => {
          const [x, y] = pos(p.id);
          const d = dueno[p.id];
          return (
            <g key={p.id} transform={`translate(${x} ${y})`}>
              <circle r={p.escanos >= 10 ? 13 : 10} fill={d ? '#0d1524' : '#1b2a45'} stroke={d === 'yo' ? colores.yo : d === 'rival' ? colores.rival : '#93a1bb'} strokeWidth={2} />
              <text y={4} textAnchor="middle" fontSize={p.escanos >= 10 ? 12 : 10} fontWeight={800} fill="#e9edf5" fontFamily="var(--f-dato)">{p.escanos}</text>
            </g>
          );
        })}
      </g>
    </svg>
  );
});
