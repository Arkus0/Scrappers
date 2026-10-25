// Reglamento resumido, tabla de tipos y glosario de palabras clave.
import { TIPO_INFO } from '../../datos/partidos';
import { NOMBRES_CLIMA } from '../../motor/reglas';
import type { Clave, Tipo } from '../../motor/tipos';
import { CLAVE_AYUDA, CLAVE_TXT, SelloTipo } from '../Carta';
import { Cabecera } from './comun';
import type { Destino } from '../App';

const TIPOS: { t: Tipo; quien: string; debil: string }[] = [
  { t: 'rojo', quien: 'PSOE y PSC', debil: 'Magenta' },
  { t: 'magenta', quien: 'Frente Amplio: Sumar, IU, Más Madrid, Comuns', debil: 'Rojo' },
  { t: 'azul', quien: 'Partido Popular', debil: 'Verde' },
  { t: 'verde', quien: 'Vox', debil: 'Azul' },
  { t: 'morado', quien: 'Podemos', debil: 'mitad Magenta, mitad Verde' },
  { t: 'ambar', quien: 'ERC, Junts, PNV, Bildu, BNG, CC, UPN, Compromís, Teruel Existe…', debil: 'mitad Rojo, mitad Azul' },
  { t: 'incoloro', quien: 'Independientes, SALF, exdirigentes de Cs y Leyendas', debil: '—' },
];

const ESTADOS: [string, string][] = [
  ['Bajo sospecha', '10 de daño en cada recuento entre turnos mientras esté en la tribuna.'],
  ['Quemado', '20 de daño en cada recuento; con cara se le pasa.'],
  ['Desconectado', 'No puede atacar ni hacer relevo; con cara vuelve a conectar en el recuento.'],
  ['Bloqueado', 'No puede atacar ni hacer relevo hasta el final de su siguiente turno.'],
  ['Desnortado', 'Al atacar tira moneda: con cruz el ataque no sale.'],
];

export function Ayuda({ ir }: { ir: (d: Destino) => void }) {
  return (
    <main className="pantalla">
      <div className="pantalla-caja estrecha ayuda">
        <Cabecera titulo="Cómo se juega" onVolver={() => ir({ p: 'inicio' })} />
        <section className="panel">
          <h3 className="titulo-seccion">Objetivo</h3>
          <p className="serif">Llega a <b>3 puntos</b> (177 escaños, mayoría absoluta). Cada político rival derribado vale 1 punto; un <b>Cabeza de lista (CL)</b>, 2. También ganas si el rival se queda sin políticos en juego o si completas la <b>Votación de investidura</b>. Si a los 30 turnos de cada uno nadie ha ganado llega la jornada de reflexión: gana quien tenga más puntos, luego más políticos en juego, luego menos desgaste.</p>
          <h3 className="titulo-seccion">Mazo</h3>
          <p className="serif">20 cartas, como mucho 2 con el mismo nombre (1 si es Única), al menos un político Básico y de 1 a 3 tipos de voto. Empiezas con 5 cartas y siempre con un Básico.</p>
          <h3 className="titulo-seccion">Tu turno</h3>
          <ol className="serif">
            <li><b>Robar</b> una carta. Si no puedes, «Sin fondos»: tu tribuna recibe 30.</li>
            <li><b>Voto</b>: una vez por turno pegas el voto de la zona a un político. Ves cuál es el siguiente.</li>
            <li>En cualquier orden: bajar Básicos al banquillo (máx. 3), <b>ascender</b> (Básico → Fase 1 → Fase 2), jugar entrenadores (un Asesor por turno), usar Carismas y hacer un <b>relevo</b> pagando su coste.</li>
            <li><b>Atacar</b> con la tribuna si tiene los votos de la acción. El turno acaba al atacar.</li>
          </ol>
          <p className="serif">Quien empieza recibe voto pero no ataca en su primer turno. Nadie asciende en su primer turno ni con un político que acaba de bajar.</p>
        </section>
        <section className="panel">
          <h3 className="titulo-seccion">Tipos y debilidad: «fuego amigo»</h3>
          <p className="serif" style={{ marginTop: 0 }}>Duele más el socio que se disputa tu voto: la debilidad suma +20 de daño. El reparto es simétrico entre bloques.</p>
          <table className="tabla">
            <thead><tr><th>Tipo</th><th>Quiénes</th><th>Débil a</th></tr></thead>
            <tbody>{TIPOS.map((x) => <tr key={x.t}><td><SelloTipo t={x.t} /> {TIPO_INFO[x.t].nombre}</td><td>{x.quien}</td><td>{x.debil}</td></tr>)}</tbody>
          </table>
        </section>
        <section className="panel">
          <h3 className="titulo-seccion">Clima de campaña</h3>
          <p className="serif" style={{ marginTop: 0 }}>Un contador compartido de 5 a 1: {[5, 4, 3, 2, 1].map((n) => NOMBRES_CLIMA[n]).join(' · ')}. En <b>Sereno</b> el daño baja 10 y las curas suben 10; en <b>Guerra sucia</b> el daño sube 10. Quien lleve el Clima a <b>Ruptura</b> regala un punto al rival y el Clima vuelve a Bronco.</p>
          <h3 className="titulo-seccion">Estados</h3>
          <dl className="glosario">{ESTADOS.map(([n, t]) => <div key={n}><dt>{n}</dt><dd>{t}</dd></div>)}</dl>
        </section>
        <section className="panel">
          <h3 className="titulo-seccion">Plató, maniobras e investidura</h3>
          <p className="serif" style={{ marginTop: 0 }}><b>Tertulianos</b>: entran en tu plató (2 huecos, un solo presentador) y aplican su efecto mientras les dure la Audiencia. <b>Maniobras</b>: se juegan boca abajo y saltan solas cuando el rival hace lo que indican. <b>Negociar</b>: los partidos Ámbar suman Apoyos; con 6 Apoyos de 4 partidos distintos, la carta Única «Votación de investidura» gana la partida.</p>
        </section>
        <section className="panel">
          <h3 className="titulo-seccion">Palabras clave</h3>
          <dl className="glosario">{(Object.keys(CLAVE_TXT) as Clave[]).map((k) => <div key={k}><dt>{CLAVE_TXT[k]}</dt><dd>{CLAVE_AYUDA[k]}</dd></div>)}</dl>
        </section>
        <section className="panel">
          <h3 className="titulo-seccion">Sobre las personas reales</h3>
          <p className="serif" style={{ marginTop: 0 }}>Es una parodia sin afiliación. Las cartas recogen solo la faceta pública de cada persona, sin caras, aspecto físico ni familia, y sin atribuir delitos: los casos judiciales aparecen solo como Noticias con redacción factual y presunción de inocencia. Cada bloque tiene el mismo número y poder de cartas. Cualquier carta puede retirarse del juego al momento.</p>
        </section>
      </div>
    </main>
  );
}
