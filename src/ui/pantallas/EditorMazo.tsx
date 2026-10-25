// Editor de mazos: tu colección a un lado, el mazo de 20 al otro, con validación en vivo.
import { useMemo, useState } from 'react';
import { CARTAS_JUGABLES, carta, esPolitico } from '../../datos/catalogo';
import { TIPO_INFO } from '../../datos/partidos';
import { MAX_COPIAS, sugerirTipos, TAM_MAZO, validarMazo } from '../../motor/mazo';
import type { Carta as TCarta, Tipo } from '../../motor/tipos';
import { TIPOS_VOTO } from '../../motor/tipos';
import { copiasTotal, guardarMazo, mazoNuevo, type MazoGuardado, type Perfil } from '../../perfil/perfil';
import { Carta, CLASE_TXT, SelloTipo } from '../Carta';
import type { Cambiar } from '../usePerfil';
import { Cabecera, Modal } from './comun';
import type { Destino } from '../App';

const ORDEN_CLASE = ['politico', 'tertuliano', 'asesor', 'recurso', 'herramienta', 'escenario', 'maniobra'];
const ORDEN_FASE = { basico: 0, fase1: 1, fase2: 2 };
function orden(a: TCarta, b: TCarta) {
  const k = ORDEN_CLASE.indexOf(a.clase) - ORDEN_CLASE.indexOf(b.clase);
  if (k) return k;
  if (esPolitico(a) && esPolitico(b)) return a.tipo.localeCompare(b.tipo) || ORDEN_FASE[a.fase] - ORDEN_FASE[b.fase] || a.id.localeCompare(b.id);
  return a.id.localeCompare(b.id);
}
const maxDe = (c: TCarta) => (c.unica ? 1 : MAX_COPIAS);

export function EditorMazo({ perfil: p, cambiar, ir, id }: { perfil: Perfil; cambiar: Cambiar; ir: (d: Destino) => void; id: string | null }) {
  const original = p.mazos.find((m) => m.id === id);
  const [m, setM] = useState<MazoGuardado>(() => (original ? structuredClone(original) : mazoNuevo()));
  const [tiposManual, setTiposManual] = useState(!!original);
  const [texto, setTexto] = useState('');
  const [filtro, setFiltro] = useState<Tipo | 'entrenador' | 'todos'>('todos');
  const [vista, setVista] = useState<'coleccion' | 'mazo'>('coleccion');
  const [zoom, setZoom] = useState<string | null>(null);
  const [errores, setErrores] = useState<string[]>([]);
  const [salir, setSalir] = useState(false);

  const enMazo = useMemo(() => {
    const n = new Map<string, number>();
    for (const x of m.cartas) n.set(x, (n.get(x) ?? 0) + 1);
    return n;
  }, [m.cartas]);
  // las copias de una carta cuentan por nombre (arte alternativo incluido)
  const porNombre = useMemo(() => {
    const n = new Map<string, number>();
    for (const x of m.cartas) n.set(carta(x).nombre, (n.get(carta(x).nombre) ?? 0) + 1);
    return n;
  }, [m.cartas]);

  const coleccion = useMemo(() => {
    const t = texto.trim().toLowerCase();
    return CARTAS_JUGABLES.filter((c) => copiasTotal(p, c.id) > 0)
      .filter((c) => filtro === 'todos' || (filtro === 'entrenador' ? !esPolitico(c) : esPolitico(c) && (c.tipo === filtro || c.tipo2 === filtro)))
      .filter((c) => !t || `${c.nombre} ${c.id}`.toLowerCase().includes(t))
      .sort(orden);
  }, [p, texto, filtro]);

  const fijar = (cartas: string[]) => setM((x) => ({ ...x, cartas, tipos: tiposManual ? x.tipos : sugerirTipos(cartas).slice(0, 3) }));
  const puedeAnadir = (c: TCarta) => m.cartas.length < TAM_MAZO && (enMazo.get(c.id) ?? 0) < copiasTotal(p, c.id) && (porNombre.get(c.nombre) ?? 0) < maxDe(c);
  const anadir = (c: TCarta) => { if (puedeAnadir(c)) fijar([...m.cartas, c.id]); };
  const quitar = (cid: string) => { const i = m.cartas.indexOf(cid); if (i >= 0) fijar(m.cartas.filter((_, k) => k !== i)); };
  const alternarTipo = (t: Tipo) => {
    setTiposManual(true);
    setM((x) => ({ ...x, tipos: x.tipos.includes(t) ? x.tipos.filter((y) => y !== t) : x.tipos.length < 3 ? [...x.tipos, t] : x.tipos }));
  };

  const avisos = validarMazo(m);
  const cambiado = JSON.stringify(original ?? null) !== JSON.stringify(m) && (original || m.cartas.length > 0);
  const guardar = () => {
    const e = cambiar((q) => guardarMazo(q, m));
    setErrores(e);
    if (!e.length) ir({ p: 'mazos' });
  };
  const listaMazo = [...enMazo.entries()].map(([cid, n]) => ({ c: carta(cid), n })).sort((a, b) => orden(a.c, b.c));
  const politicos = m.cartas.filter((x) => esPolitico(carta(x))).length;
  const basicos = m.cartas.filter((x) => { const c = carta(x); return esPolitico(c) && c.fase === 'basico'; }).length;

  return (
    <main className="pantalla editor">
      <div className="pantalla-caja ancha">
        <Cabecera titulo={original ? 'Editar mazo' : 'Nuevo mazo'} onVolver={() => (cambiado ? setSalir(true) : ir({ p: 'mazos' }))}>
          <button className="boton principal" type="button" data-accion="guardar-mazo" disabled={avisos.length > 0} onClick={guardar}>Guardar</button>
        </Cabecera>
        <div className="panel cab-editor">
          <input className="campo" value={m.nombre} maxLength={40} onChange={(e) => setM({ ...m, nombre: e.target.value })} aria-label="Nombre del mazo" />
          <div className="fila-resumen">
            <span className={`dato contador-mazo ${m.cartas.length === TAM_MAZO ? 'ok' : ''}`}>{m.cartas.length}/{TAM_MAZO}</span>
            <span className="tenue">{politicos} políticos · {basicos} básicos · {m.cartas.length - politicos} entrenadores</span>
          </div>
          <div className="chips" role="group" aria-label="Tipos de voto">
            <span className="etiqueta">Votos</span>
            {TIPOS_VOTO.map((t) => (
              <button key={t} type="button" className={`chip ${m.tipos.includes(t) ? 'on' : ''}`} onClick={() => alternarTipo(t)} aria-pressed={m.tipos.includes(t)}>
                <SelloTipo t={t} /> {TIPO_INFO[t].nombre}
              </button>
            ))}
            <button type="button" className="chip" onClick={() => { setTiposManual(false); setM((x) => ({ ...x, tipos: sugerirTipos(x.cartas).slice(0, 3) })); }}>Sugerir</button>
          </div>
          {(errores.length > 0 || avisos.length > 0) && <ul className="errores">{[...new Set([...errores, ...avisos])].map((e) => <li key={e}>{e}</li>)}</ul>}
        </div>

        <div className="pestanas solo-movil" role="tablist">
          <button role="tab" type="button" aria-selected={vista === 'coleccion'} className={vista === 'coleccion' ? 'on' : ''} onClick={() => setVista('coleccion')}>Colección</button>
          <button role="tab" type="button" aria-selected={vista === 'mazo'} className={vista === 'mazo' ? 'on' : ''} onClick={() => setVista('mazo')}>Mazo ({m.cartas.length})</button>
        </div>

        <div className="cuerpo-editor">
          <section className={`col-coleccion ${vista === 'coleccion' ? '' : 'oculta-movil'}`} aria-label="Tu colección">
            <div className="filtros">
              <input className="campo" type="search" placeholder="Buscar…" value={texto} onChange={(e) => setTexto(e.target.value)} aria-label="Buscar en la colección" />
              <div className="chips">
                {(['todos', ...TIPOS_VOTO, 'entrenador'] as const).map((g) => (
                  <button key={g} type="button" className={`chip ${filtro === g ? 'on' : ''}`} onClick={() => setFiltro(g)}>
                    {g === 'todos' ? 'Todas' : g === 'entrenador' ? 'Entrenadores' : <SelloTipo t={g} />}
                  </button>
                ))}
              </div>
            </div>
            <div className="rejilla-editor">
              {coleccion.map((c) => {
                const usadas = enMazo.get(c.id) ?? 0;
                const libres = Math.min(copiasTotal(p, c.id), maxDe(c)) - usadas;
                return (
                  <div key={c.id} className="ficha-editor">
                    <Carta id={c.id} tam="media" onClick={() => anadir(c)} apagada={!puedeAnadir(c)} etiqueta={`Añadir ${c.nombre}`} dataAccion={`anadir-${c.id}`} />
                    <span className="copias dato">{libres > 0 ? `+${libres}` : '✓'}</span>
                    <button type="button" className="lupa" onClick={() => setZoom(c.id)} aria-label={`Ver ${c.nombre}`}>🔍</button>
                  </div>
                );
              })}
              {coleccion.length === 0 && <p className="tenue">No tienes cartas con este filtro.</p>}
            </div>
          </section>
          <section className={`col-mazo ${vista === 'mazo' ? '' : 'oculta-movil'}`} aria-label="Cartas del mazo">
            {listaMazo.length === 0 && <p className="tenue">Toca cartas de tu colección para añadirlas. Necesitas {TAM_MAZO} cartas y al menos un político Básico.</p>}
            <ul className="lista-mazo">
              {listaMazo.map(({ c, n }) => (
                <li key={c.id}>
                  <button type="button" className="linea-mazo" data-t={esPolitico(c) ? c.tipo : undefined} onClick={() => quitar(c.id)} aria-label={`Quitar ${c.nombre}`}>
                    <span className="dato n">{n}×</span>
                    {esPolitico(c) ? <SelloTipo t={c.tipo} /> : <span className="clase-mini">{CLASE_TXT[c.clase].slice(0, 3)}</span>}
                    <span className="nom">{c.nombre}</span>
                    <span className="quitar">−</span>
                  </button>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>
      {zoom && <div className="velo" onClick={() => setZoom(null)}><div className="zoom"><Carta id={zoom} tam="grande" /></div></div>}
      {salir && (
        <Modal titulo="Cambios sin guardar" onCerrar={() => setSalir(false)}>
          <p className="serif">Si sales ahora se pierden los cambios del mazo.</p>
          <div className="fila-botones">
            <button className="boton" type="button" onClick={() => setSalir(false)}>Seguir editando</button>
            <button className="boton peligro" type="button" onClick={() => ir({ p: 'mazos' })}>Salir sin guardar</button>
          </div>
        </Modal>
      )}
    </main>
  );
}
