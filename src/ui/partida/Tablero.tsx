// El tablero de una partida, visto por un jugador. Funciona igual contra la IA, a dos en el mismo móvil y online:
// solo recibe la vista y una función para responder.
import { useEffect, useMemo, useRef, useState } from 'react';
import { carta as cartaDe, esPolitico, esTertuliano } from '../../datos/catalogo';
import { TIPO_INFO } from '../../datos/partidos';
import { aguanteMax, clave, costeRelevo, escanos, NOMBRES_CLIMA, pagable, polUid, modificadores } from '../../motor/reglas';
import type { AccionJuego, CartaTertuliano, Decision, EnJuego, Jug, Partida, Respuesta, Suceso, Uid, Vista } from '../../motor/tipos';
import { OTRO } from '../../motor/tipos';
import { Carta, Coste, Reverso, SelloTipo } from '../Carta';
import { nombreEstado } from '../../datos/textos';

interface Props {
  vista: Vista;
  /** el jugador que mira puede responder la decisión pendiente */
  puedeActuar: boolean;
  onResponder: (r: Respuesta) => void;
  onSalir: () => void;
  /** texto mientras decide el otro (IA pensando, rival online…) */
  esperaTxt?: string;
  extraBarra?: React.ReactNode;
}

const idEn = (v: Vista, u: Uid) => v.cartaDe[u];
const P = (v: Vista) => v as unknown as Partida;

type Seleccion = { tipo: 'mano'; uid: Uid } | { tipo: 'mesa'; uid: Uid } | null;

export function Tablero({ vista: v, puedeActuar, onResponder, onSalir, esperaTxt, extraBarra }: Props) {
  const yo = v.yo;
  const rv = OTRO(yo);
  const d = v.pendiente;
  const miDecision = puedeActuar && d && d.tipo !== 'espera' && d.jugador === yo ? d : null;
  const acciones = miDecision?.tipo === 'accion' ? miDecision.acciones : [];
  const [sel, setSel] = useState<Seleccion>(null);
  const [zoom, setZoom] = useState<string | null>(null);
  const [verRegistro, setVerRegistro] = useState(false);
  const [elegidas, setElegidas] = useState<Uid[]>([]);
  useEffect(() => { setSel(null); setElegidas([]); }, [d]);

  const objetivos = miDecision?.tipo === 'objetivo' ? new Set(miDecision.opciones) : null;
  const responder = (r: Respuesta) => { setSel(null); setElegidas([]); onResponder(r); };
  const accionesDe = (uid: Uid) => acciones.filter((a) => ('carta' in a && a.carta === uid) || ('sobre' in a && a.sobre === uid && a.a !== 'ascender' && a.a !== 'herramienta') || (a.a === 'relevo' && a.a2 === uid));
  const jugables = useMemo(() => new Set(acciones.flatMap((a) => ('carta' in a ? [a.carta] : []))), [acciones]);
  const mesaActivable = useMemo(() => new Set(acciones.flatMap((a) => (a.a === 'voto' || a.a === 'carisma' ? [a.sobre] : a.a === 'relevo' ? [a.a2] : a.a === 'atacar' ? [v.jugadores[yo].tribuna!.uid] : []))), [acciones, v, yo]);

  const tocarMesa = (uid: Uid, mio: boolean) => {
    if (objetivos) {
      if (objetivos.has(uid)) responder({ tipo: 'objetivo', uids: [uid] });
      return;
    }
    if (mio && miDecision?.tipo === 'accion') setSel({ tipo: 'mesa', uid });
    else if (idEn(v, uid)) setZoom(idEn(v, uid));
  };

  const pasar = acciones.find((a) => a.a === 'pasar');
  const me = v.jugadores[yo];
  const el = v.jugadores[rv];

  return (
    <div className="tablero-marco">
      <div className="tablero">
        <BarraJugador v={v} j={rv} />
        <div className="lado rival" style={{ paddingTop: 6 }}>
          <div className="fila">
            {el.banquillo.map((b) => <EnMesa key={b.uid} v={v} ej={b} tam="mini" onClick={() => tocarMesa(b.uid, false)} elegible={objetivos?.has(b.uid)} />)}
            {Array.from({ length: Math.max(0, 3 - el.banquillo.length) }, (_, i) => <div key={i} className="hueco" />)}
          </div>
        </div>
        <div className="zona-juego">
          <div className="lado" style={{ alignContent: 'end' }}>
            <div className="fila">
              <PlatoYManiobras v={v} j={rv} onZoom={setZoom} />
              {el.tribuna ? <EnMesa v={v} ej={el.tribuna} tam="media" onClick={() => tocarMesa(el.tribuna!.uid, false)} elegible={objetivos?.has(el.tribuna.uid)} /> : <div className="hueco tribuna">Tribuna</div>}
            </div>
          </div>
          <FranjaCentro v={v} onZoom={setZoom} onRegistro={() => setVerRegistro(true)} />
          <div className="lado" style={{ alignContent: 'start' }}>
            <div className="fila">
              {me.tribuna ? <EnMesa v={v} ej={me.tribuna} tam="media" onClick={() => tocarMesa(me.tribuna!.uid, true)} elegible={objetivos?.has(me.tribuna.uid) || (!objetivos && mesaActivable.has(me.tribuna.uid))} dataAccion="tribuna-propia" /> : <div className="hueco tribuna">Tribuna</div>}
              <PlatoYManiobras v={v} j={yo} onZoom={setZoom} />
            </div>
          </div>
        </div>
        <div className="lado">
          <div className="fila">
            {me.banquillo.map((b) => <EnMesa key={b.uid} v={v} ej={b} tam="mini" onClick={() => tocarMesa(b.uid, true)} elegible={objetivos?.has(b.uid) || (!objetivos && mesaActivable.has(b.uid))} />)}
            {Array.from({ length: Math.max(0, 3 - me.banquillo.length) }, (_, i) => <div key={i} className="hueco" />)}
          </div>
        </div>
        <div>
          <div className="barra-turno">
            <span className="info">
              {v.ganador ? 'Partida terminada' : miDecision ? (miDecision.tipo === 'accion' ? `Tu turno ${Math.ceil(v.turno / 2)} · toca una carta para jugarla` : miDecision.texto) : esperaTxt ?? `Turno de ${v.jugadores[(d?.jugador ?? v.enTurno) as Jug].nombre}…`}
            </span>
            {extraBarra}
            <button className="boton-icono" type="button" onClick={onSalir} aria-label="Menú" title="Salir">☰</button>
            {pasar && <button className="boton principal" type="button" data-accion="pasar" onClick={() => responder({ tipo: 'accion', accion: pasar })}>Terminar turno</button>}
          </div>
          <BarraJugador v={v} j={yo} mia />
          <div className="mano" aria-label="Tu mano">
            {me.mano.length === 0 && <span className="mano-vacia">Sin cartas en la mano</span>}
            {me.mano.map((u) => {
              const id = idEn(v, u);
              if (!id) return <Reverso key={u} />;
              const puede = jugables.has(u);
              return <Carta key={u} id={id} tam="mini" onClick={() => (puede ? setSel({ tipo: 'mano', uid: u }) : setZoom(id))} elegible={puede} seleccionada={sel?.tipo === 'mano' && sel.uid === u} apagada={!!miDecision && miDecision.tipo === 'accion' && !puede} dataAccion={puede ? `mano-${u}` : undefined} />;
            })}
          </div>
        </div>
      </div>
      <div className="lateral">
        <Registro v={v} />
      </div>

      {sel && miDecision?.tipo === 'accion' && (
        <HojaAcciones v={v} sel={sel} acciones={sel.tipo === 'mano' ? acciones.filter((a) => 'carta' in a && a.carta === sel.uid) : accionesDe(sel.uid).concat(acciones.filter((a) => a.a === 'atacar' && v.jugadores[yo].tribuna?.uid === sel.uid))}
          onAccion={(a) => responder({ tipo: 'accion', accion: a })} onCerrar={() => setSel(null)} />
      )}
      {miDecision?.tipo === 'objetivo' && (
        <div className="decision" role="dialog" aria-label="Decisión">
          <p>{miDecision.texto}</p>
          <span className="tenue" style={{ fontSize: 12 }}>Toca uno de los políticos resaltados.</span>
        </div>
      )}
      {miDecision?.tipo === 'cartas' && (
        <div className="velo">
          <div className="modal">
            <h2>{miDecision.texto}</h2>
            <p className="tenue" style={{ marginTop: 0 }}>{miDecision.max > 1 ? `Elige entre ${miDecision.min} y ${miDecision.max}.` : miDecision.min === 0 ? 'Puedes elegir una o ninguna.' : 'Elige una.'}</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center' }}>
              {Object.entries(miDecision.visibles).map(([u, id]) => {
                const uid = Number(u);
                const valida = miDecision.opciones.includes(uid);
                const marcada = elegidas.includes(uid);
                return (
                  <Carta key={u} id={id} tam="media" elegible={valida && !marcada} seleccionada={marcada} apagada={!valida} dataAccion={valida ? `elige-${uid}` : undefined}
                    onClick={valida ? () => setElegidas((x) => (marcada ? x.filter((y) => y !== uid) : miDecision.max === 1 ? [uid] : x.length < miDecision.max ? [...x, uid] : x)) : () => setZoom(id)} />
                );
              })}
            </div>
            <div className="acciones-dec" style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 12 }}>
              {miDecision.min === 0 && <button className="boton" type="button" onClick={() => responder({ tipo: 'cartas', uids: [] })}>Ninguna</button>}
              <button className="boton principal" type="button" data-accion="confirmar" disabled={elegidas.length < miDecision.min || elegidas.length > miDecision.max} onClick={() => responder({ tipo: 'cartas', uids: elegidas })}>Confirmar</button>
            </div>
          </div>
        </div>
      )}
      {miDecision?.tipo === 'opcion' && (
        <div className="velo">
          <div className="modal">
            <h2>{miDecision.texto}</h2>
            <div className="hoja-botones">
              {miDecision.opciones.map((o, i) => <button key={i} className="boton" type="button" data-accion={`opcion-${i}`} onClick={() => responder({ tipo: 'opcion', i })}>{o}</button>)}
            </div>
          </div>
        </div>
      )}
      {zoom && (
        <div className="velo" onClick={() => setZoom(null)}>
          <div className="zoom" onClick={(e) => e.stopPropagation()}>
            <Carta id={zoom} tam="grande" />
            <button className="boton" type="button" onClick={() => setZoom(null)}>Cerrar</button>
          </div>
        </div>
      )}
      {verRegistro && (
        <div className="velo" onClick={() => setVerRegistro(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="cabecera"><h2>Crónica de la partida</h2><button className="boton pequeno" type="button" onClick={() => setVerRegistro(false)}>Cerrar</button></div>
            <Registro v={v} />
          </div>
        </div>
      )}
      <Efectos v={v} />
    </div>
  );
}

// ————————————————————————————————————— piezas
function BarraJugador({ v, j, mia }: { v: Vista; j: Jug; mia?: boolean }) {
  const p = v.jugadores[j];
  const enTurno = v.enTurno === j && !v.ganador;
  return (
    <div className={`barra-jugador ${mia ? 'mia' : ''}`} style={enTurno ? { boxShadow: 'inset 3px 0 0 var(--oro)' } : undefined}>
      <span className="nombre">{p.nombre}{enTurno ? ' ·' : ''}</span>
      <span className="escanos" title={`${escanos(p.puntos)} escaños`} aria-label={`${escanos(p.puntos)} de 176 escaños`}>
        {[0, 1, 2].map((i) => <span key={i} className={`punto ${p.puntos > i ? 'lleno' : ''}`} />)}
        <span style={{ fontSize: 12 }}>{escanos(p.puntos)}</span>
      </span>
      {p.apoyos.length > 0 && <span className="apoyos" title="Apoyos para la investidura">🤝 {p.apoyos.length}/{new Set(p.apoyos).size}p</span>}
      <span className="contador" title="Cartas en la mano">✋ {p.mano.length}</span>
      <span className="contador" title="Cartas en el mazo">▤ {p.mazo.length}</span>
      <span className="contador" title="Descarte">⌫ {p.descarte.length}</span>
    </div>
  );
}

function EnMesa({ v, ej, tam, onClick, elegible, dataAccion }: { v: Vista; ej: EnJuego; tam: 'mini' | 'media'; onClick: () => void; elegible?: boolean; dataAccion?: string }) {
  const id = idEn(v, ej.uid);
  if (!id) return <Reverso tam={tam} />;
  const max = aguanteMax(P(v), ej);
  const herr = ej.herramienta !== null ? idEn(v, ej.herramienta) : null;
  return (
    <div className="en-juego" data-uid={ej.uid}>
      <Carta id={id} tam={tam} onClick={onClick} elegible={elegible} aguante={max} dataAccion={dataAccion ?? (elegible ? `mesa-${ej.uid}` : undefined)} etiqueta={`${cartaDe(id).nombre}: ${max - ej.dano} de ${max} de aguante, ${ej.votos.length} votos`} />
      {ej.dano > 0 && <span className="dano-chip" title="Desgaste">{max - ej.dano}</span>}
      {Object.keys(ej.estados).length > 0 && (
        <span className="estado-chip">{(Object.keys(ej.estados) as (keyof EnJuego['estados'])[]).map((s) => <span key={s}>{nombreEstado(s)}</span>)}</span>
      )}
      {herr && <span className="herr-chip" title={cartaDe(herr).nombre}>⚙ {cartaDe(herr).nombre}</span>}
      <span className="marcas">{ej.votos.map((t, i) => <span key={i} className="voto-chip" data-t={t} title={`Voto ${TIPO_INFO[t].nombre}`} />)}</span>
    </div>
  );
}

function PlatoYManiobras({ v, j, onZoom }: { v: Vista; j: Jug; onZoom: (id: string) => void }) {
  const p = v.jugadores[j];
  if (!p.plato.length && !p.maniobras.length) return null;
  return (
    <div style={{ display: 'grid', gap: 4, alignSelf: 'center' }}>
      {p.plato.map((t) => {
        const id = idEn(v, t.uid);
        const c = cartaDe(id) as CartaTertuliano;
        return <button key={t.uid} type="button" className="plato-ficha" onClick={() => onZoom(id)} title={`${c.nombre} · Audiencia ${t.audiencia}`}>📺 <span className="nom">{c.nombre}</span> <b className="dato">{t.audiencia}</b></button>;
      })}
      {p.maniobras.length > 0 && (
        <div className="plato-fila" title="Maniobras boca abajo">
          {p.maniobras.map((u) => (idEn(v, u) ? <button key={u} type="button" className="maniobra-ficha" onClick={() => onZoom(idEn(v, u))} aria-label="Tu maniobra" /> : <span key={u} className="maniobra-ficha" />))}
        </div>
      )}
    </div>
  );
}

const COLOR_CLIMA: Record<number, string> = { 5: '#52c08a', 4: '#9fc95a', 3: '#e8b64a', 2: '#ff7a59', 1: '#e5483f' };

function FranjaCentro({ v, onZoom, onRegistro }: { v: Vista; onZoom: (id: string) => void; onRegistro: () => void }) {
  const me = v.jugadores[v.yo];
  return (
    <div className="franja-centro">
      <span className="clima" title="Clima de campaña" style={{ ['--c' as string]: COLOR_CLIMA[v.clima] }}>
        <span className="barra">{[1, 2, 3, 4, 5].map((i) => <i key={i} className={i <= v.clima ? 'on' : ''} />)}</span>
        {NOMBRES_CLIMA[v.clima]}
      </span>
      {v.escenario && <button type="button" className="escenario-mini" onClick={() => onZoom(idEn(v, v.escenario!.uid))}>🏛 {cartaDe(idEn(v, v.escenario.uid)).nombre}</button>}
      <span className="zona-voto" title="Tu zona de voto: el voto de este turno y el siguiente">
        Voto {me.votoActual && v.enTurno === v.yo ? <span className="voto-chip" data-t={me.votoActual} /> : <span className="tenue">—</span>}
        <span className="voto-chip siguiente" data-t={me.votoSiguiente} title="Siguiente" />
      </span>
      <button type="button" className="boton pequeno fantasma" onClick={onRegistro} aria-label="Crónica de la partida">📜</button>
    </div>
  );
}

function HojaAcciones({ v, sel, acciones, onAccion, onCerrar }: { v: Vista; sel: NonNullable<Seleccion>; acciones: AccionJuego[]; onAccion: (a: AccionJuego) => void; onCerrar: () => void }) {
  const id = idEn(v, sel.uid);
  const c = cartaDe(id);
  const yo = v.yo;
  const tribuna = v.jugadores[yo].tribuna;
  const nombreUid = (u: Uid) => cartaDe(idEn(v, u)).nombre;
  const etiqueta = (a: AccionJuego): React.ReactNode => {
    switch (a.a) {
      case 'bajar': return 'Bajar al banquillo';
      case 'ascender': return <>Ascender sobre <b>{nombreUid(a.sobre)}</b></>;
      case 'entrenador': return c.clase === 'maniobra' ? 'Preparar boca abajo' : c.clase === 'escenario' ? 'Poner en juego' : 'Jugar';
      case 'herramienta': return <>Equipar a <b>{nombreUid(a.sobre)}</b></>;
      case 'tertuliano': return 'Llevar al plató';
      case 'voto': return <>Dar el voto <span className="voto-chip" data-t={v.jugadores[yo].votoActual ?? 'incoloro'} style={{ display: 'inline-block', verticalAlign: 'middle' }} /></>;
      case 'carisma': return esPolitico(c) && c.carisma ? `Carisma: ${c.carisma.nombre}` : 'Carisma';
      case 'relevo': return <>Relevo: subir a la tribuna (cuesta {tribuna ? costeRelevo(P(v), tribuna) : 0} votos de {tribuna ? nombreUid(tribuna.uid) : ''})</>;
      case 'atacar': {
        const acc = polUid(P(v), sel.uid).acciones[a.i];
        return <><Coste coste={acc.coste} /> <b>{acc.nombre}</b><span className="dano">{acc.danoTxt ?? acc.dano}</span></>;
      }
      case 'pasar': return 'Terminar turno';
    }
  };
  // en la tribuna se enseñan también los ataques que aún no se pueden pagar
  const ataquesNoPagables = sel.tipo === 'mesa' && tribuna?.uid === sel.uid && esPolitico(c)
    ? c.acciones.map((a, i) => ({ a, i })).filter(({ i }) => !acciones.some((x) => x.a === 'atacar' && x.i === i))
    : [];
  const ej = sel.tipo === 'mesa' ? [tribuna, ...v.jugadores[yo].banquillo].find((x) => x?.uid === sel.uid) : null;
  return (
    <>
      <div className="velo-hoja" onClick={onCerrar} />
      <div className="hoja" role="dialog" aria-label={c.nombre}>
        <div className="hoja-cab"><h3>{c.nombre}</h3><button className="boton pequeno" type="button" onClick={onCerrar}>Cerrar</button></div>
        <div className="hoja-detalle">
          <Carta id={id} tam="media" aguante={ej ? aguanteMax(P(v), ej) : undefined} />
          <div className="hoja-botones">
            {acciones.length === 0 && ataquesNoPagables.length === 0 && <p className="tenue">No puedes hacer nada con esta carta ahora.</p>}
            {acciones.map((a) => (
              <button key={clave(a)} className={`boton ${a.a === 'atacar' ? 'principal' : ''}`} type="button" data-accion={clave(a)} onClick={() => onAccion(a)}>{etiqueta(a)}</button>
            ))}
            {ataquesNoPagables.map(({ a, i }) => {
              const sinVotos = ej && !pagable(ej.votos, a.coste, modificadores(P(v), ej.uid).costeIncoloro);
              const motivo = v.turno === 1 && v.primero === yo ? 'no se ataca en el primer turno' : sinVotos ? 'faltan votos' : 'no puede atacar';
              return <button key={`na${i}`} className="boton" type="button" disabled><Coste coste={a.coste} /> <b>{a.nombre}</b> <span className="tenue">({motivo})</span></button>;
            })}
          </div>
        </div>
      </div>
    </>
  );
}

function Registro({ v }: { v: Vista }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => { ref.current?.scrollTo({ top: 1e9 }); }, [v.registro.length]);
  return (
    <div className="registro" ref={ref}>
      {v.registro.slice(-120).map((r, i) => (
        <div key={i} className={r.texto.startsWith('—') ? 'turno' : ''}>{r.texto}</div>
      ))}
    </div>
  );
}

// ————————————————————————————————————— animaciones a partir de los sucesos
interface Flotante { id: number; x: number; y: number; txt: string; cura?: boolean }

function Efectos({ v }: { v: Vista }) {
  const vistos = useRef(v.sucesos.length);
  const [moneda, setMoneda] = useState<boolean | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [flot, setFlot] = useState<Flotante[]>([]);
  useEffect(() => {
    const nuevos = v.sucesos.slice(vistos.current);
    vistos.current = v.sucesos.length;
    if (!nuevos.length) return;
    const timers: number[] = [];
    let retraso = 0;
    const lanzar = (s: Suceso) => {
      if (s.s === 'moneda') { setMoneda(s.cara); timers.push(window.setTimeout(() => setMoneda(null), 900)); }
      if (s.s === 'dano' || s.s === 'cura') {
        const el = document.querySelector(`[data-uid="${s.uid}"]`);
        const r = el?.getBoundingClientRect();
        if (r) setFlot((f) => [...f.slice(-8), { id: Math.random(), x: r.left + r.width / 2 - 20, y: r.top + r.height / 3, txt: s.s === 'dano' ? `−${s.n}` : `+${s.n}`, cura: s.s === 'cura' }]);
      }
      if (s.s === 'ko') setToast(`¡Cae ${cartaDe(s.carta).nombre}! +${s.puntos * 59} escaños`);
      if (s.s === 'maniobra') setToast(`¡Maniobra! ${cartaDe(s.carta).nombre}`);
      if (s.s === 'ruptura') setToast('¡Ruptura! El Clima estalla y se paga en escaños');
      if (s.s === 'tertuliano') setToast(`📺 ${cartaDe(s.carta).nombre} entra en el plató`);
      if (s.s === 'sinFondos') setToast('Sin fondos de campaña: la tribuna paga 30');
    };
    for (const s of nuevos) {
      if (s.s === 'moneda') { timers.push(window.setTimeout(() => lanzar(s), retraso)); retraso += 950; }
      else timers.push(window.setTimeout(() => lanzar(s), retraso));
    }
    return () => { /* los temporizadores terminan solos */ };
  }, [v.sucesos]);
  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), 1900);
    return () => window.clearTimeout(t);
  }, [toast]);
  useEffect(() => {
    if (!flot.length) return;
    const t = window.setTimeout(() => setFlot([]), 1200);
    return () => window.clearTimeout(t);
  }, [flot]);
  return (
    <>
      {moneda !== null && <div className="velo" style={{ background: 'rgba(5,9,16,.35)', pointerEvents: 'none' }}><div className="moneda-anim">{moneda ? 'CARA' : 'CRUZ'}</div></div>}
      {toast && <div className="toast" role="status">{toast}</div>}
      {flot.map((f) => <span key={f.id} className={`flotante ${f.cura ? 'cura' : ''}`} style={{ left: f.x, top: f.y }}>{f.txt}</span>)}
    </>
  );
}

export { SelloTipo, esTertuliano };
export type { Decision };
