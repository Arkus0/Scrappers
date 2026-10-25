// El álbum: todas las cartas numeradas, siluetas para las que faltan, filtros, fabricar y reciclar.
import { useMemo, useState } from 'react';
import { CARTAS_JUGABLES, esPolitico } from '../../datos/catalogo';
import { TIPO_INFO } from '../../datos/partidos';
import { MAX_COPIAS } from '../../motor/mazo';
import type { Carta as TCarta, Clase, Rareza, Tipo } from '../../motor/tipos';
import { revisarColeccion, type Recompensa } from '../../perfil/misiones';
import { COSTE_FABRICAR, copias, fabricar, progresoColeccion, puedeFabricar, reciclarDuplicados, VALOR_PAPELETAS, type Perfil } from '../../perfil/perfil';
import { Carta, CLASE_TXT, RAREZA_NOMBRE, RAREZA_TXT, SelloTipo } from '../Carta';
import type { Cambiar } from '../usePerfil';
import { Barra, Cabecera, ListaRecompensas, Modal } from './comun';
import type { Destino } from '../App';

type Estado = 'todas' | 'tengo' | 'faltan' | 'shiny' | 'sobran';
type Grupo = Tipo | 'entrenador' | 'tertuliano' | 'todos';
const GRUPOS: Grupo[] = ['todos', 'rojo', 'azul', 'magenta', 'verde', 'morado', 'ambar', 'incoloro', 'tertuliano', 'entrenador'];
const RAREZAS: Rareza[] = ['C', 'I', 'R', 'CL', 'E', 'S'];
const COLECCIONES = { todas: 'Todas', basica: 'Básica', '29n': 'Expansión 29N', secreta: 'Secretas' } as const;

const grupoDe = (c: TCarta): Grupo => (esPolitico(c) ? c.tipo : c.clase === 'tertuliano' ? 'tertuliano' : 'entrenador');
const max = (c: TCarta) => (c.unica ? 1 : MAX_COPIAS);

/** Papeletas que daría reciclar ahora (sin tocar el perfil). */
function previsionReciclar(p: Perfil): number {
  const copia = structuredClone(p);
  return reciclarDuplicados(copia);
}

export function Album({ perfil: p, cambiar, ir }: { perfil: Perfil; cambiar: Cambiar; ir: (d: Destino) => void }) {
  const [texto, setTexto] = useState('');
  const [grupo, setGrupo] = useState<Grupo>('todos');
  const [rareza, setRareza] = useState<Rareza | null>(null);
  const [estado, setEstado] = useState<Estado>('todas');
  const [col, setCol] = useState<keyof typeof COLECCIONES>('todas');
  const [clase, setClase] = useState<Clase | null>(null);
  const [detalle, setDetalle] = useState<string | null>(null);
  const [verShiny, setVerShiny] = useState(false);
  const [confirmar, setConfirmar] = useState(false);
  const [premios, setPremios] = useState<Recompensa[] | null>(null);
  const prog = progresoColeccion(p);
  const reciclables = useMemo(() => previsionReciclar(p), [p]);

  const lista = useMemo(() => {
    const t = texto.trim().toLowerCase();
    return CARTAS_JUGABLES.filter((c) => {
      const n = copias(p, c.id), s = copias(p, `${c.id}*`);
      if (grupo !== 'todos' && grupoDe(c) !== grupo) return false;
      if (clase && c.clase !== clase) return false;
      if (rareza && c.rareza !== rareza) return false;
      if (col !== 'todas' && c.coleccion !== col) return false;
      if (estado === 'tengo' && n + s === 0) return false;
      if (estado === 'faltan' && n + s > 0) return false;
      if (estado === 'shiny' && s === 0) return false;
      if (estado === 'sobran' && n + s <= max(c)) return false;
      if (t && !`${c.nombre} ${'cargo' in c ? c.cargo ?? '' : ''} ${c.id}`.toLowerCase().includes(t)) return false;
      return true;
    });
  }, [p, texto, grupo, rareza, estado, col, clase]);

  const c = detalle ? CARTAS_JUGABLES.find((x) => x.id === detalle)! : null;

  return (
    <main className="pantalla">
      <div className="pantalla-caja album">
        <Cabecera titulo="Álbum" onVolver={() => ir({ p: 'inicio' })} perfil={p} />
        <div className="panel progreso-album">
          <div className="fila-resumen">
            <span><b className="dato">{prog.tengo}</b>/<span className="dato">{prog.total}</span> cartas</span>
            <span className="shiny-txt">✦ <b className="dato">{prog.shiny}</b>/<span className="dato">{prog.totalShiny}</span> Shiny</span>
            <button className="boton pequeno" type="button" data-accion="reciclar" disabled={reciclables === 0} onClick={() => setConfirmar(true)}>
              Reciclar duplicados {reciclables > 0 && `(+${reciclables} ✉)`}
            </button>
          </div>
          <Barra valor={prog.tengo} max={prog.total} etiqueta="Progreso del álbum" />
        </div>

        <div className="filtros">
          <input className="campo" type="search" placeholder="Buscar nombre, cargo o número…" value={texto} onChange={(e) => setTexto(e.target.value)} aria-label="Buscar carta" />
          <div className="chips" role="group" aria-label="Tipo">
            {GRUPOS.map((g) => (
              <button key={g} type="button" className={`chip ${grupo === g ? 'on' : ''}`} onClick={() => { setGrupo(g); setClase(null); }}>
                {g === 'todos' ? 'Todos' : g === 'entrenador' ? 'Entrenadores' : g === 'tertuliano' ? 'Tertulianos' : <><SelloTipo t={g} /> {TIPO_INFO[g].nombre}</>}
              </button>
            ))}
          </div>
          {grupo === 'entrenador' && (
            <div className="chips" role="group" aria-label="Clase">
              {(['asesor', 'recurso', 'herramienta', 'escenario', 'maniobra'] as Clase[]).map((k) => (
                <button key={k} type="button" className={`chip ${clase === k ? 'on' : ''}`} onClick={() => setClase(clase === k ? null : k)}>{CLASE_TXT[k]}</button>
              ))}
            </div>
          )}
          <div className="chips" role="group" aria-label="Rareza y estado">
            {RAREZAS.map((r) => <button key={r} type="button" className={`chip ${rareza === r ? 'on' : ''}`} title={RAREZA_NOMBRE[r]} onClick={() => setRareza(rareza === r ? null : r)}>{RAREZA_TXT[r]}</button>)}
            <span className="sep" />
            {(['todas', 'tengo', 'faltan', 'shiny', 'sobran'] as Estado[]).map((s) => (
              <button key={s} type="button" className={`chip ${estado === s ? 'on' : ''}`} onClick={() => setEstado(s)}>
                {{ todas: 'Todas', tengo: 'Las tengo', faltan: 'Me faltan', shiny: 'Shiny', sobran: 'Repetidas' }[s]}
              </button>
            ))}
            <span className="sep" />
            <select className="campo pequeno" value={col} onChange={(e) => setCol(e.target.value as keyof typeof COLECCIONES)} aria-label="Colección">
              {Object.entries(COLECCIONES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>
        </div>

        <p className="tenue" style={{ margin: 0 }}>{lista.length} cartas</p>
        <div className="rejilla-album">
          {lista.map((c) => {
            const n = copias(p, c.id), s = copias(p, `${c.id}*`);
            const tengo = n + s > 0;
            return (
              <div key={c.id} className={`ficha-album ${tengo ? '' : 'falta'}`}>
                <Carta id={c.id} tam="media" shiny={s > 0 && n === 0} onClick={() => { setDetalle(c.id); setVerShiny(s > 0 && n === 0); }} etiqueta={`${c.nombre}${tengo ? `, tienes ${n + s}` : ', no la tienes'}`} />
                {tengo
                  ? <span className="copias dato">×{n + s}{s > 0 && <i className="shiny-txt"> ✦{s}</i>}</span>
                  : <span className="copias dato tenue">{c.id}</span>}
              </div>
            );
          })}
        </div>
      </div>

      {c && (
        <Modal onCerrar={() => setDetalle(null)} titulo={`${c.id} · ${c.nombre}`}>
          <div className="hoja-detalle">
            <Carta id={c.id} tam="grande" shiny={verShiny} />
            <div className="detalle-album">
              <p><b>{RAREZA_NOMBRE[c.rareza]}</b> {RAREZA_TXT[c.rareza]} · {CLASE_TXT[c.clase]} · {COLECCIONES[c.coleccion as keyof typeof COLECCIONES] ?? c.coleccion}</p>
              <p>Tienes <b className="dato">{copias(p, c.id)}</b> normal{copias(p, c.id) === 1 ? '' : 'es'} y <b className="dato">{copias(p, `${c.id}*`)}</b> Shiny. Máximo en un mazo: {max(c)}.</p>
              {c.persona && <label className="interruptor"><input type="checkbox" checked={verShiny} onChange={(e) => setVerShiny(e.target.checked)} /> Ver versión Shiny {copias(p, `${c.id}*`) === 0 && '(aún no la tienes)'}</label>}
              {c.coleccion === 'basica'
                ? <p className="tenue">Las cartas Básicas no salen en sobres: se consiguen con el mazo inicial y al ganar {3} partidas.</p>
                : (
                  <>
                    <button className="boton principal" type="button" data-accion="fabricar" disabled={!puedeFabricar(p, c.id)}
                      onClick={() => { const r = cambiar((q) => (fabricar(q, c.id) ? revisarColeccion(q) : [])); setPremios(r.length ? r : null); }}>
                      Fabricar · {COSTE_FABRICAR[c.rareza]} ✉
                    </button>
                    <p className="tenue" style={{ fontSize: 12 }}>Tienes {p.papeletas} papeletas. Reciclar una copia sobrante da {VALOR_PAPELETAS[c.rareza]} ✉ ({VALOR_PAPELETAS[c.rareza] * 2} si es Shiny).</p>
                  </>
                )}
              <ListaRecompensas lista={premios} />
            </div>
          </div>
        </Modal>
      )}
      {confirmar && (
        <Modal onCerrar={() => setConfirmar(false)} titulo="Reciclar duplicados">
          <p className="serif">Se reciclan las copias que pasan del máximo que cabe en un mazo (2, o 1 en las cartas Únicas). Primero las normales; las Shiny solo si te sobran también. Ganas <b>{reciclables} papeletas</b>.</p>
          <div className="fila-botones">
            <button className="boton" type="button" onClick={() => setConfirmar(false)}>Cancelar</button>
            <button className="boton principal" type="button" data-accion="confirmar-reciclar" onClick={() => { cambiar((q) => reciclarDuplicados(q)); setConfirmar(false); }}>Reciclar</button>
          </div>
        </Modal>
      )}
    </main>
  );
}
