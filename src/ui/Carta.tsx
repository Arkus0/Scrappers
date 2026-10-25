// La carta: marco del tipo, nombre, aguante, arte, acciones, Carisma y pie con debilidad, relevo y número.
import { memo, useRef, type CSSProperties, type PointerEvent as PE } from 'react';
import { carta as cartaDe, esPolitico, esTertuliano } from '../datos/catalogo';
import { PARTIDOS } from '../datos/partidos';
import type { Carta as TCarta, Tipo } from '../motor/tipos';
import { ArteSVG } from './arte/ArteSVG';
import { TIPO_INFO } from '../datos/partidos';

const FASE_TXT = { basico: 'Básico', fase1: 'Fase 1', fase2: 'Fase 2' };
import { CLASE_TXT, CLAVE_AYUDA, CLAVE_TXT, RAREZA_NOMBRE, RAREZA_TXT } from './textos-carta';
export { CLASE_TXT, CLAVE_AYUDA, CLAVE_TXT, RAREZA_NOMBRE, RAREZA_TXT };
export function SelloTipo({ t, titulo }: { t: Tipo; titulo?: string }) {
  return <span className="tipo-sello" data-t={t} title={titulo ?? TIPO_INFO[t].nombre} aria-label={TIPO_INFO[t].nombre}>{TIPO_INFO[t].simbolo}</span>;
}

export function Coste({ coste }: { coste: Tipo[] }) {
  if (!coste.length) return <span className="coste"><span className="tipo-sello" data-t="incoloro" title="Sin coste">0</span></span>;
  return <span className="coste">{coste.map((t, i) => <SelloTipo key={i} t={t} />)}</span>;
}

interface Props {
  id: string;
  tam?: 'mini' | 'media' | 'grande';
  shiny?: boolean;
  onClick?: () => void;
  elegible?: boolean;
  seleccionada?: boolean;
  apagada?: boolean;
  /** aguante máximo con modificadores (en juego) */
  aguante?: number;
  etiqueta?: string;
  dataAccion?: string;
  style?: CSSProperties;
}

function claseCSS(c: TCarta) {
  return esPolitico(c) ? c.tipo : undefined;
}

export const Carta = memo(function Carta({ id, tam = 'media', shiny, onClick, elegible, seleccionada, apagada, aguante, etiqueta, dataAccion, style }: Props) {
  const c = cartaDe(id);
  const ref = useRef<HTMLElement | null>(null);
  const brillo = shiny || id.endsWith('*');
  const mover = (ev: PE) => {
    if (!brillo || !ref.current) return;
    const r = ref.current.getBoundingClientRect();
    ref.current.style.setProperty('--mx', `${((ev.clientX - r.left) / r.width) * 100}%`);
    ref.current.style.setProperty('--my', `${((ev.clientY - r.top) / r.height) * 100}%`);
  };
  const clases = ['carta', tam, brillo ? 'shiny' : '', elegible ? 'elegible' : '', seleccionada ? 'seleccionada' : '', apagada ? 'apagada' : '', esPolitico(c) && c.cl ? 'cl' : ''].filter(Boolean).join(' ');
  const contenido = <Cuerpo c={c} tam={tam} aguante={aguante} brillo={brillo} />;
  const comunes = {
    className: clases,
    'data-tipo': claseCSS(c),
    'data-clase': c.clase,
    'data-carta': c.id,
    'data-accion': dataAccion,
    onPointerMove: mover,
    style,
    title: tam !== 'grande' ? c.nombre : undefined,
  };
  if (onClick) {
    return (
      <button type="button" {...comunes} ref={(el) => { ref.current = el; }} onClick={onClick} aria-label={etiqueta ?? `${c.nombre}${brillo ? ' (Shiny)' : ''}`} aria-pressed={seleccionada}>
        {contenido}
      </button>
    );
  }
  return <div {...comunes} ref={(el) => { ref.current = el; }} role="img" aria-label={etiqueta ?? c.nombre}>{contenido}</div>;
});

function Cuerpo({ c, tam, aguante, brillo }: { c: TCarta; tam: string; aguante?: number; brillo: boolean }) {
  const grande = tam === 'grande';
  return (
    <div className="carta-int">
      {brillo && <span className="sello-shiny">SHINY</span>}
      {esPolitico(c) && c.cl && <span className="sello-cl">CL</span>}
      <div className="carta-cab">
        <span className="carta-nombre">{tam === 'mini' ? c.nombre.split(' · ')[0] : c.nombre}</span>
        {esPolitico(c) && (
          <span className="carta-aguante"><small>AG</small>{aguante ?? c.aguante}</span>
        )}
        {esPolitico(c) ? <SelloTipo t={c.tipo} /> : null}
        {esPolitico(c) && c.tipo2 ? <SelloTipo t={c.tipo2} /> : null}
      </div>
      {tam !== 'mini' && (
        <div className="carta-cab" style={{ paddingTop: 0 }}>
          <span className="carta-fase">
            {esPolitico(c) ? `${FASE_TXT[c.fase]}${c.de ? ` · de ${c.de.split(' · ')[0]}` : ''} · ${PARTIDOS[c.partido].siglas}` : esTertuliano(c) ? `${c.presentador ? 'Presentador' : 'Tertuliano'} · Audiencia ${c.audiencia}` : `${CLASE_TXT[c.clase]}${c.noticia ? ' · Noticia' : ''}${c.clase === 'escenario' && 'duracion' in c && c.duracion ? ` · ${c.duracion} turnos` : ''}`}
          </span>
        </div>
      )}
      <div className="carta-arte"><ArteSVG carta={c} shiny={brillo} /></div>
      {tam !== 'mini' && 'cargo' in c && c.cargo && <div className="carta-cargo">{c.cargo}</div>}
      {tam !== 'mini' && c.claves && c.claves.length > 0 && grande && (
        <div className="carta-claves">{c.claves.map((k) => <span key={k} className="clave" title={CLAVE_AYUDA[k]}>{CLAVE_TXT[k]}</span>)}</div>
      )}
      <div className="carta-cuerpo">
        {esPolitico(c) ? (
          <>
            {c.carisma && (
              <div className="carta-carisma">
                <b>Carisma · {c.carisma.nombre}</b>
                {(grande || tam === 'media') && <span>{c.carisma.texto}</span>}
              </div>
            )}
            {c.acciones.map((a, i) => (
              <div key={i} className="carta-accion">
                <Coste coste={a.coste} />
                <b>{a.nombre}</b>
                <span className="dano">{a.danoTxt ?? (a.dano || '')}</span>
                {a.texto && (grande || tam === 'media') && <span className="carta-accion-txt">{a.texto}</span>}
              </div>
            ))}
          </>
        ) : (
          <div className="carta-texto">{c.texto}</div>
        )}
        {grande && c.frase && <div className="carta-frase">«{c.frase}»</div>}
      </div>
      {tam !== 'mini' && (
        <div className="carta-pie">
          {esPolitico(c) && (
            <>
              <span>Débil {c.debilidad ? <SelloTipo t={c.debilidad} /> : '—'}</span>
              <span>Relevo {c.relevo}</span>
            </>
          )}
          <span className="relleno" />
          <span title={RAREZA_NOMBRE[c.rareza]}>{RAREZA_TXT[c.rareza]}</span>
          <span className="dato">{c.id}</span>
        </div>
      )}
    </div>
  );
}

export function Reverso({ tam = 'mini', n }: { tam?: 'mini' | 'media'; n?: number }) {
  return <div className={`carta ${tam} reverso`} aria-label="Carta boca abajo"><span className="marca">{n ?? '176'}</span></div>;
}
