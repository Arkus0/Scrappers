// Preparar una partida rápida contra la IA o a dos jugadores en el mismo dispositivo.
import { useState } from 'react';
import { MAZOS_INICIALES } from '../../datos/mazos-iniciales';
import { MAZOS_TEMATICOS } from '../../datos/mazos-tematicos';
import type { Nivel } from '../../ia/bot';
import type { DefMazo } from '../../motor/mazo';
import { conShiny, type Perfil } from '../../perfil/perfil';
import type { ConfigLocal } from '../partida/PartidaLocal';
import type { Cambiar } from '../usePerfil';
import { Cabecera, mazosJugables, TiposMazo } from './comun';
import type { Destino } from '../App';

interface OpcionMazo { id: string; nombre: string; mazo: DefMazo; lider: string; grupo: string }

const PREHECHOS: OpcionMazo[] = [
  ...MAZOS_INICIALES.map((m) => ({ id: `inicial-${m.id}`, nombre: m.nombre, mazo: m, lider: m.lider, grupo: 'Mazos iniciales' })),
  ...MAZOS_TEMATICOS.map((m) => ({ id: `tematico-${m.id}`, nombre: m.nombre, mazo: m, lider: m.nombre, grupo: 'Mazos temáticos' })),
];

const NIVELES: { n: Nivel; txt: string }[] = [
  { n: 'novato', txt: 'Novato · aprende' },
  { n: 'normal', txt: 'Normal · piensa el turno' },
  { n: 'experto', txt: 'Experto · calcula el futuro' },
];

function SelectorMazo({ opciones, valor, onCambio, etiqueta, azar }: { opciones: OpcionMazo[]; valor: string; onCambio: (id: string) => void; etiqueta: string; azar?: boolean }) {
  const grupos = [...new Set(opciones.map((o) => o.grupo))];
  const actual = opciones.find((o) => o.id === valor);
  return (
    <label className="selector">
      <span className="etiqueta">{etiqueta}</span>
      <select className="campo" value={valor} onChange={(e) => onCambio(e.target.value)}>
        {azar && <option value="azar">Al azar</option>}
        {grupos.map((g) => (
          <optgroup key={g} label={g}>
            {opciones.filter((o) => o.grupo === g).map((o) => <option key={o.id} value={o.id}>{o.nombre}</option>)}
          </optgroup>
        ))}
      </select>
      {actual && <TiposMazo tipos={actual.mazo.tipos} />}
    </label>
  );
}

export function ConfigPartida({ perfil: p, cambiar, ir, modo, onJugar }: { perfil: Perfil; cambiar: Cambiar; ir: (d: Destino) => void; modo: 'ia' | 'dos'; onJugar: (c: ConfigLocal) => void }) {
  const mios: OpcionMazo[] = mazosJugables(p).map((m) => ({ id: m.id, nombre: m.nombre, mazo: { ...m, cartas: conShiny(p, m.cartas) }, lider: p.nombre, grupo: 'Mis mazos' }));
  const propios = modo === 'ia' ? mios : [...mios, ...PREHECHOS];
  const [a, setA] = useState(() => (propios.some((o) => o.id === p.mazoActivo) ? p.mazoActivo! : propios[0]?.id ?? ''));
  const [b, setB] = useState<string>(modo === 'ia' ? 'azar' : (PREHECHOS[1].id));
  const [nivel, setNivel] = useState<Nivel>(p.ajustes.nivel);
  const [nombres, setNombres] = useState<[string, string]>([p.nombre, 'Invitado']);

  const empezar = () => {
    const ma = propios.find((o) => o.id === a);
    if (!ma) return;
    const rivales = modo === 'ia' ? PREHECHOS : propios;
    const mb = b === 'azar' ? rivales[Math.floor(Math.random() * rivales.length)] : rivales.find((o) => o.id === b)!;
    if (modo === 'ia') cambiar((q) => { q.ajustes.nivel = nivel; if (mios.some((o) => o.id === a)) q.mazoActivo = a; });
    onJugar({
      modo, mazos: [ma.mazo, mb.mazo], nivel, humano: 0, semilla: (Math.random() * 2 ** 31) | 0,
      nombres: modo === 'ia' ? [p.nombre, mb.lider] : [nombres[0] || 'Jugador 1', nombres[1] || 'Jugador 2'],
    });
  };

  return (
    <main className="pantalla">
      <div className="pantalla-caja estrecha">
        <Cabecera titulo={modo === 'ia' ? 'Partida rápida' : 'Dos jugadores'} onVolver={() => ir({ p: 'inicio' })} />
        {propios.length === 0 ? (
          <div className="panel">
            <p className="serif">No tienes ningún mazo completo. Crea uno en el editor o elige un mazo inicial.</p>
            <button className="boton principal" type="button" onClick={() => ir({ p: 'mazos' })}>Ir a mis mazos</button>
          </div>
        ) : (
          <div className="panel formulario">
            {modo === 'dos' && <input className="campo" value={nombres[0]} maxLength={16} onChange={(e) => setNombres([e.target.value, nombres[1]])} aria-label="Nombre del jugador 1" />}
            <SelectorMazo opciones={propios} valor={a} onCambio={setA} etiqueta={modo === 'ia' ? 'Tu mazo' : 'Mazo del jugador 1'} />
            {modo === 'dos' && <input className="campo" value={nombres[1]} maxLength={16} onChange={(e) => setNombres([nombres[0], e.target.value])} aria-label="Nombre del jugador 2" />}
            <SelectorMazo opciones={modo === 'ia' ? PREHECHOS : propios} valor={b} onCambio={setB} etiqueta={modo === 'ia' ? 'Rival (IA)' : 'Mazo del jugador 2'} azar={modo === 'ia'} />
            {modo === 'ia' && (
              <div className="chips" role="radiogroup" aria-label="Nivel de la IA">
                {NIVELES.map((x) => <button key={x.n} type="button" role="radio" aria-checked={nivel === x.n} className={`chip ${nivel === x.n ? 'on' : ''}`} data-accion={`nivel-${x.n}`} onClick={() => setNivel(x.n)}>{x.txt}</button>)}
              </div>
            )}
            <p className="aviso" style={{ margin: 0 }}>{modo === 'ia' ? 'Victoria: 50 ◉ · derrota: 15 ◉, además de misiones y logros.' : 'Entre turno y turno sale una cortina para pasar el móvil sin ver la mano del otro.'}</p>
            <button className="boton principal bloque" type="button" data-accion="empezar-partida" onClick={empezar}>Empezar</button>
          </div>
        )}
      </div>
    </main>
  );
}
