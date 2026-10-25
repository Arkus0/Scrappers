// Misiones del día, logros y estadísticas.
import { LOGROS, MISIONES } from '../../perfil/misiones';
import type { Perfil } from '../../perfil/perfil';
import { Barra, Cabecera } from './comun';
import type { Destino } from '../App';

export function Misiones({ perfil: p, ir }: { perfil: Perfil; ir: (d: Destino) => void }) {
  const s = p.stats;
  const conseguidos = LOGROS.filter((l) => p.logros[l.id]).length;
  return (
    <main className="pantalla">
      <div className="pantalla-caja estrecha">
        <Cabecera titulo="Misiones y logros" onVolver={() => ir({ p: 'inicio' })} perfil={p} />
        <section className="panel">
          <h3 className="titulo-seccion">Misiones de hoy</h3>
          <p className="tenue" style={{ marginTop: 0 }}>Se renuevan cada día. Cuentan las partidas contra la IA, la campaña y el online.</p>
          <div className="lista-misiones">
            {p.misiones.lista.map((m) => {
              const d = MISIONES.find((x) => x.id === m.id);
              if (!d) return null;
              return (
                <div key={m.id} className={`mision ${m.cobrada ? 'hecha' : ''}`}>
                  <div className="fila-resumen"><b>{d.texto}</b><span className="pildora oro">+{d.premio} ◉</span></div>
                  <Barra valor={m.progreso} max={d.objetivo} etiqueta={d.texto} />
                  <span className="tenue dato" style={{ fontSize: 12 }}>{m.cobrada ? '✓ Cobrada' : `${m.progreso}/${d.objetivo}`}</span>
                </div>
              );
            })}
          </div>
        </section>
        <section className="panel">
          <h3 className="titulo-seccion">Logros · {conseguidos}/{LOGROS.length}</h3>
          <div className="rejilla-logros">
            {LOGROS.map((l) => (
              <div key={l.id} className={`logro ${p.logros[l.id] ? 'on' : ''}`}>
                <b>{p.logros[l.id] ? '🏆' : '🔒'} {l.nombre}</b>
                <span>{l.texto}</span>
                <span className="dato tenue">+{l.premio} ◉</span>
              </div>
            ))}
          </div>
        </section>
        <section className="panel">
          <h3 className="titulo-seccion">Estadísticas</h3>
          <dl className="stats">
            <dt>Partidas</dt><dd className="dato">{s.partidas}</dd>
            <dt>Victorias</dt><dd className="dato">{s.victorias} ({s.partidas ? Math.round((100 * s.victorias) / s.partidas) : 0} %)</dd>
            <dt>Derrotas · empates</dt><dd className="dato">{s.derrotas} · {s.empates}</dd>
            <dt>Políticos derribados</dt><dd className="dato">{s.derribos}</dd>
            <dt>Daño total</dt><dd className="dato">{s.dano}</dd>
            <dt>Investiduras</dt><dd className="dato">{s.investiduras}</dd>
            <dt>Online</dt><dd className="dato">{s.victoriasOnline}/{s.online}</dd>
            <dt>Sobres abiertos</dt><dd className="dato">{s.sobresAbiertos}</dd>
            <dt>Shiny abiertas</dt><dd className="dato">{s.shiniesAbiertas}</dd>
          </dl>
        </section>
      </div>
    </main>
  );
}
