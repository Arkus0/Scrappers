// La campaña del 29N: elegir bloque y mazo, jugar actos provincia a provincia, debates, negociación y noche electoral.
import { useEffect, useMemo, useState } from 'react';
import { PROV, ZONAS } from '../../datos/provincias';
import {
  ACTOS_POR_SEMANA, CALENDARIO, cerrarSemana, escanosDe, jefePendiente, libres, MAYORIA, nombreMazoRival, nuevaCampana, prepararActo,
  prepararJefe, prepararNegociacion, SEMANAS, type Acto, type BloqueCampana,
} from '../../perfil/campana';
import { conseguirLogro } from '../../perfil/misiones';
import type { Perfil } from '../../perfil/perfil';
import { Hemiciclo } from '../Hemiciclo';
import type { Cambiar } from '../usePerfil';
import { Cabecera, ListaRecompensas, mazosJugables, Modal, TiposMazo } from '../pantallas/comun';
import { MapaCampana } from './MapaCampana';
import type { Destino } from '../App';

const COLORES: Record<BloqueCampana, { yo: string; rival: string }> = {
  progresista: { yo: '#e5483f', rival: '#3a86e8' },
  conservador: { yo: '#3a86e8', rival: '#e5483f' },
};
const NIVEL_TXT = { novato: 'Novato', normal: 'Normal', experto: 'Experto' };

export function Campana({ perfil: p, cambiar, ir, onJugar }: { perfil: Perfil; cambiar: Cambiar; ir: (d: Destino) => void; onJugar: (a: Acto) => void }) {
  const c = p.campana;
  const [elegida, setElegida] = useState<string | null>(null);
  const [notas, setNotas] = useState<string[] | null>(null);
  const [nueva, setNueva] = useState(false);
  if (!c || nueva) return <NuevaCampana perfil={p} hayCampana={!!c} onCancelar={() => (c ? setNueva(false) : ir({ p: 'inicio' }))} onEmpezar={(b, m) => { cambiar((q) => { q.campana = nuevaCampana(b, m); }); setNueva(false); }} />;

  const yo = escanosDe(c, 'yo');
  const rival = escanosDe(c, 'rival');
  const semana = CALENDARIO[c.semana - 1];
  const quedan = ACTOS_POR_SEMANA - c.actos;
  const jefe = jefePendiente(c);
  const mazo = p.mazos.find((m) => m.id === c.mazo);
  const elegibles = new Set(!c.terminada && c.semana <= SEMANAS && quedan > 0 ? libres(c).map((x) => x.id) : []);
  const jugar = (prep: (q: NonNullable<Perfil['campana']>) => Acto | null) => {
    const a = cambiar((q) => (q.campana ? prep(q.campana) : null));
    if (a) onJugar(a);
  };

  return (
    <main className="pantalla campana">
      <div className="pantalla-caja ancha">
        <Cabecera titulo="Campaña del 29N" onVolver={() => ir({ p: 'inicio' })} perfil={p} />
        <div className="cab-campana panel">
          <div>
            <span className="etiqueta">{c.terminada || c.semana > SEMANAS ? 'Noche electoral · 29 nov' : `Semana ${c.semana} de ${SEMANAS} · ${semana.fechas}`}</span>
            {semana?.hito && !c.terminada && c.semana <= SEMANAS && <p className="hito">{semana.hito}</p>}
            <p className="tenue" style={{ margin: 0 }}>{c.bloque === 'progresista' ? 'Bloque progresista' : 'Bloque conservador'} · {mazo ? <>{mazo.nombre} <TiposMazo tipos={mazo.tipos} /></> : 'mazo borrado: elige otro'}</p>
          </div>
          <div className="marcador-campana">
            <Hemiciclo className="hemiciclo-campana" escanos={[yo, rival]} colores={[COLORES[c.bloque].yo, COLORES[c.bloque].rival]} nombres={['Tú', 'Rival']} />
            <p className="dato"><b style={{ color: COLORES[c.bloque].yo }}>{yo}</b> · <b style={{ color: COLORES[c.bloque].rival }}>{rival}</b> <span className="tenue">/ {MAYORIA}</span></p>
          </div>
        </div>

        {c.terminada ? <FinCampana perfil={p} cambiar={cambiar} onNueva={() => setNueva(true)} /> : (
          <div className="cuerpo-campana">
            <div className="col-mapa">
              <MapaCampana dueno={c.provincias} colores={COLORES[c.bloque]} elegibles={elegibles} elegida={elegida} onElegir={setElegida} />
              <p className="tenue leyenda-mapa"><i style={{ background: COLORES[c.bloque].yo }} /> tuyas <i style={{ background: COLORES[c.bloque].rival }} /> del rival <i style={{ background: '#34405a' }} /> en juego · el número son los escaños</p>
            </div>
            <div className="col-acciones">
              {c.negociacion === 'pendiente' ? (
                <div className="panel">
                  <h3 className="titulo-seccion">Noche electoral: {yo} escaños</h3>
                  <p className="serif">Te quedas a {MAYORIA - yo} de la mayoría. Los socios territoriales deciden: gana la partida de negociación y habrá investidura.</p>
                  <button className="boton principal bloque" type="button" data-accion="negociar" disabled={!mazo} onClick={() => jugar(prepararNegociacion)}>Negociar con los socios</button>
                </div>
              ) : (
                <>
                  <div className="panel">
                    <h3 className="titulo-seccion">Actos esta semana: {quedan}/{ACTOS_POR_SEMANA}</h3>
                    {elegida ? <FichaProvincia c={c} id={elegida} puede={elegibles.has(elegida) && !!mazo} onJugar={() => jugar((q) => prepararActo(q, elegida))} /> : <p className="serif tenue" style={{ margin: 0 }}>{quedan > 0 ? 'Toca una provincia en gris para hacer campaña allí. Las grandes dan más escaños, pero el rival las defiende mejor.' : 'Has hecho todos los actos de la semana.'}</p>}
                  </div>
                  {jefe && (
                    <div className="panel jefe">
                      <h3 className="titulo-seccion">{semana.jefe === 'cara' ? '16N · Cara a cara' : '26N · Debate a cuatro'}</h3>
                      <p className="serif">El debate de la campaña, contra la IA experta. Quien gane arrastra las dos provincias más grandes que sigan en juego.</p>
                      <button className="boton principal bloque" type="button" data-accion="debate" disabled={!mazo} onClick={() => jugar(prepararJefe)}>Ir al debate</button>
                    </div>
                  )}
                  <button className="boton bloque" type="button" data-accion="cerrar-semana" onClick={() => setNotas(cambiar((q) => (q.campana ? cerrarSemana(q.campana) : [])))}>
                    {c.semana === SEMANAS ? 'Cerrar la campaña e ir a la noche electoral' : 'Cerrar la semana'}{quedan > 0 ? ` (pierdes ${quedan} acto${quedan === 1 ? '' : 's'})` : ''}{jefe ? ' · sin debate' : ''}
                  </button>
                  <p className="aviso" style={{ margin: 0 }}>Al cerrar cada semana el bloque rival hace campaña y se lleva las {2} provincias más grandes que sigan en juego.</p>
                </>
              )}
              {!mazo && (
                <div className="panel">
                  <p className="serif" style={{ marginTop: 0 }}>El mazo de la campaña ya no existe. Elige otro:</p>
                  <div className="fila-botones">{mazosJugables(p).map((m) => <button key={m.id} className="boton pequeno" type="button" onClick={() => cambiar((q) => { if (q.campana) q.campana.mazo = m.id; })}>{m.nombre}</button>)}</div>
                </div>
              )}
              <details className="panel historial">
                <summary>Historial ({c.historial.length})</summary>
                <ul>{c.historial.slice().reverse().map((h, i) => <li key={i}>Sem. {h.semana} · {h.prov ? PROV[h.prov].nombre : h.tipo === 'cara' ? 'Cara a cara' : h.tipo === 'cuatro' ? 'Debate a cuatro' : 'Negociación'} · {h.gano ? '✓ ganado' : '✗ perdido'}</li>)}</ul>
              </details>
              <button className="boton fantasma pequeno" type="button" onClick={() => setNueva(true)}>Empezar otra campaña</button>
            </div>
          </div>
        )}
      </div>
      {notas && (
        <Modal titulo="Fin de semana" onCerrar={() => setNotas(null)}>
          <ul className="serif notas">{notas.map((n, i) => <li key={i}>{n}</li>)}</ul>
          <button className="boton principal bloque" type="button" data-accion="ok-semana" onClick={() => setNotas(null)}>Seguir</button>
        </Modal>
      )}
    </main>
  );
}

function FichaProvincia({ c, id, puede, onJugar }: { c: NonNullable<Perfil['campana']>; id: string; puede: boolean; onJugar: () => void }) {
  const p = PROV[id];
  // la vista previa usa una copia: la tirada real se hace al jugar (y sale igual, porque la semilla es la misma)
  const previa = useMemo(() => (puede ? prepararActo(structuredClone(c), id) : null), [c, id, puede]);
  const d = c.provincias[id];
  return (
    <div className="ficha-provincia">
      <p className="prov-nombre"><b>{p.nombre}</b> <span className="pildora">{p.escanos} escaños</span></p>
      <p className="tenue" style={{ margin: 0 }}>{ZONAS[p.zona].nombre}{d ? ` · ${d === 'yo' ? 'ya es tuya' : 'ya es del rival'}` : ''}</p>
      {previa && (
        <>
          <p className="serif" style={{ margin: '6px 0' }}>Rival: <b>«{nombreMazoRival(previa.rival)}»</b> · IA {NIVEL_TXT[previa.nivel]}</p>
          <button className="boton principal bloque" type="button" data-accion="jugar-acto" onClick={onJugar}>Hacer campaña en {p.corto}</button>
        </>
      )}
    </div>
  );
}

function NuevaCampana({ perfil: p, hayCampana, onCancelar, onEmpezar }: { perfil: Perfil; hayCampana: boolean; onCancelar: () => void; onEmpezar: (b: BloqueCampana, mazo: string) => void }) {
  const mazos = mazosJugables(p);
  const [bloque, setBloque] = useState<BloqueCampana>(() => (p.inicial === 'azul' || p.inicial === 'verde' ? 'conservador' : 'progresista'));
  const [mazo, setMazo] = useState(() => (mazos.some((m) => m.id === p.mazoActivo) ? p.mazoActivo! : mazos[0]?.id ?? ''));
  return (
    <main className="pantalla">
      <div className="pantalla-caja estrecha">
        <Cabecera titulo="Nueva campaña" onVolver={onCancelar} perfil={p} />
        <div className="panel">
          <p className="serif" style={{ marginTop: 0 }}>Del 6 de octubre al 29 de noviembre: ocho semanas, {ACTOS_POR_SEMANA} actos por semana. En cada acto eliges una circunscripción y juegas contra la IA; si ganas, sumas sus escaños reales. El 16N hay cara a cara y el 26N debate a cuatro. Con {MAYORIA} escaños hay investidura; entre 160 y 175, toca negociar.</p>
          {hayCampana && <p className="aviso">Empezar otra campaña borra la que tienes en curso.</p>}
        </div>
        <div className="panel formulario">
          <span className="etiqueta">Tu bloque</span>
          <div className="fila-botones">
            <button type="button" className={`boton ${bloque === 'progresista' ? 'principal' : ''}`} onClick={() => setBloque('progresista')}>Progresista</button>
            <button type="button" className={`boton ${bloque === 'conservador' ? 'principal' : ''}`} onClick={() => setBloque('conservador')}>Conservador</button>
          </div>
          <p className="tenue" style={{ margin: 0 }}>Te enfrentarás a los mazos temáticos del otro bloque y, en Cataluña, la Cornisa Norte y Canarias, también a los socios territoriales.</p>
          <label className="selector">
            <span className="etiqueta">Tu mazo</span>
            <select className="campo" value={mazo} onChange={(e) => setMazo(e.target.value)}>
              {mazos.map((m) => <option key={m.id} value={m.id}>{m.nombre}</option>)}
            </select>
          </label>
          <button className="boton principal bloque" type="button" data-accion="empezar-campana" disabled={!mazo} onClick={() => onEmpezar(bloque, mazo)}>Empezar la campaña</button>
        </div>
      </div>
    </main>
  );
}

function FinCampana({ perfil: p, cambiar, onNueva }: { perfil: Perfil; cambiar: Cambiar; onNueva: () => void }) {
  const c = p.campana!;
  const t = c.terminada!;
  const [premios, setPremios] = useState<ReturnType<typeof conseguirLogro>>([]);
  useEffect(() => {
    if (t.investidura) setPremios(cambiar((q) => conseguirLogro(q, 'campana')));
  }, [t.investidura, cambiar]);
  return (
    <div className="fin-campana">
      <div className="panel centro">
        <h2 className="titulo-fin">{t.investidura ? '¡Investidura!' : 'Repetición electoral'}</h2>
        <p className="serif">{t.motivo}</p>
        <ListaRecompensas lista={premios} />
      </div>
      <button className="boton principal" type="button" data-accion="nueva-campana" onClick={onNueva}>Nueva campaña</button>
    </div>
  );
}
