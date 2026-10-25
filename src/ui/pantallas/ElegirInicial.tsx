// Elección del mazo inicial y tutorial en diapositivas.
import { useState } from 'react';
import { MAZOS_INICIALES, type MazoInicial } from '../../datos/mazos-iniciales';
import { TIPO_INFO } from '../../datos/partidos';
import { Carta } from '../Carta';
import type { Cambiar } from '../usePerfil';
import { elegirInicial } from '../../perfil/perfil';
import type { Destino } from '../App';

const ESTILO: Record<MazoInicial['id'], string> = {
  rojo: 'Equilibrado: políticos con aguante y Carisma que roba cartas. Bueno para aprender.',
  azul: 'Equilibrado, el espejo del Rojo: mismas estadísticas, otra gente.',
  magenta: 'Coalición y curación: aguanta y remonta cuando va por detrás.',
  verde: 'El espejo del Magenta: resistente y con golpes de remontada.',
};

export function ElegirInicial({ cambiar, ir }: { cambiar: Cambiar; ir: (d: Destino) => void }) {
  const [elegido, setElegido] = useState<MazoInicial['id'] | null>(null);
  const m = MAZOS_INICIALES.find((x) => x.id === elegido);
  return (
    <main className="pantalla">
      <div className="pantalla-caja">
        <header className="cabecera"><h2>Elige tu mazo inicial</h2></header>
        <p className="lema" style={{ marginTop: 0 }}>Los cuatro están igualados en espejo: Rojo frente a Azul y Magenta frente a Verde tienen las mismas cifras. Los demás se desbloquean jugando.</p>
        <div className="rejilla-iniciales">
          {MAZOS_INICIALES.map((x) => (
            <button key={x.id} type="button" className={`inicial ${elegido === x.id ? 'activo' : ''}`} data-t={x.tipos[0]} data-accion={`inicial-${x.id}`} onClick={() => setElegido(x.id)}>
              <Carta id={x.cartas[0]} tam="media" />
              <span className="inicial-txt">
                <b>{x.nombre}</b>
                <i>«{x.lema}»</i>
                <span>{TIPO_INFO[x.tipos[0]].nombre} · {x.lider}</span>
              </span>
            </button>
          ))}
        </div>
        {m && (
          <div className="panel">
            <p className="serif" style={{ marginTop: 0 }}>{ESTILO[m.id]}</p>
            <button className="boton principal bloque" type="button" data-accion="confirmar-inicial" onClick={() => { cambiar((p) => elegirInicial(p, m.id)); ir({ p: 'tutorial' }); }}>
              Empezar con {m.nombre}
            </button>
          </div>
        )}
      </div>
    </main>
  );
}

const PASOS: { titulo: string; texto: string; carta?: string }[] = [
  { titulo: 'Gana 176 escaños', texto: 'Cada político rival que derribas vale 1 punto (los Cabezas de lista, 2). Con 3 puntos llegas a 177 escaños: mayoría absoluta. También ganas si el rival se queda sin políticos en juego.', carta: 'B-01' },
  { titulo: 'Tribuna y banquillo', texto: 'Un político en la Tribuna (el que ataca y recibe) y hasta 3 en el Banquillo. Al empezar colocas tu Tribuna y los Básicos que quieras en el banquillo.' },
  { titulo: 'Votos', texto: 'Cada turno recibes 1 voto de los tipos de tu mazo y lo pegas a un político. Las acciones cuestan votos: mira los sellos de colores. Quien empieza recibe voto pero no puede atacar en su primer turno.' },
  { titulo: 'Ascensos', texto: 'Los políticos hacen carrera: sobre un Básico juegas su Fase 1 y luego su Fase 2. Cada ascenso le da más aguante y mejores acciones. No se asciende en el primer turno ni con quien acaba de bajar.', carta: 'B-03' },
  { titulo: 'Entrenadores', texto: 'Asesores (uno por turno), Recursos, Herramientas que se pegan a un político, Escenarios que cambian la mesa, Tertulianos que entran en tu plató y Maniobras que se juegan boca abajo y saltan solas.' },
  { titulo: 'Debilidad y clima', texto: 'Duele más el fuego amigo: el Rojo es débil al Magenta y viceversa; el Azul, al Verde. +20 de daño. El Clima de campaña va de Sereno a Ruptura: cuanto más crispado, más daño… y quien rompe paga un punto.' },
  { titulo: 'Tu colección', texto: 'Ganando consigues fondos para sobres de 5 cartas (2 gratis cada día). Con 3 victorias desbloqueas toda la colección Básica. Los duplicados se reciclan en papeletas para fabricar la carta que te falte.' },
];

export function Tutorial({ ir, onJugar }: { ir: (d: Destino) => void; onJugar: () => void }) {
  const [i, setI] = useState(0);
  const paso = PASOS[i];
  const ultimo = i === PASOS.length - 1;
  return (
    <main className="pantalla">
      <div className="pantalla-caja tutorial">
        <header className="cabecera">
          <h2>Cómo se juega · {i + 1}/{PASOS.length}</h2>
          <button className="boton fantasma pequeno" type="button" data-accion="saltar-tutorial" onClick={() => ir({ p: 'inicio' })}>Saltar</button>
        </header>
        <div className="panel paso-tutorial">
          {paso.carta && <Carta id={paso.carta} tam="media" />}
          <div>
            <h3>{paso.titulo}</h3>
            <p className="serif">{paso.texto}</p>
          </div>
        </div>
        <div className="puntos-tutorial" aria-hidden>{PASOS.map((_, k) => <i key={k} className={k === i ? 'on' : ''} />)}</div>
        <div className="fila-botones">
          <button className="boton" type="button" disabled={i === 0} onClick={() => setI(i - 1)}>Anterior</button>
          {ultimo
            ? <button className="boton principal" type="button" data-accion="primera-partida" onClick={onJugar}>Jugar mi primera partida</button>
            : <button className="boton principal" type="button" data-accion="siguiente" onClick={() => setI(i + 1)}>Siguiente</button>}
        </div>
      </div>
    </main>
  );
}
