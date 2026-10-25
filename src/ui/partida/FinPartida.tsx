// Pantalla de fin de partida: quién gana, escaños y lo que se gana.
import type { Jug, Partida } from '../../motor/tipos';
import { escanos } from '../../motor/reglas';
import { Hemiciclo } from '../Hemiciclo';

export interface ResultadoPartida {
  ganador: Jug | null;
  motivo: string;
  puntos: [number, number];
  humano: Jug;
  modo: 'ia' | 'dos' | 'online' | 'campana';
  partida?: Partida;
}

export function FinPartida({ r, onSalir, extra }: { r: ResultadoPartida; onSalir: () => void; extra?: React.ReactNode }) {
  const nombres = r.partida ? [r.partida.jugadores[0].nombre, r.partida.jugadores[1].nombre] : ['Jugador 1', 'Jugador 2'];
  const gano = r.ganador === r.humano;
  const titulo = r.ganador === null ? 'Repetición electoral' : r.modo === 'dos' ? `¡Gana ${nombres[r.ganador]}!` : gano ? '¡Victoria!' : 'Derrota';
  return (
    <div className="velo">
      <div className="modal fin">
        <h2>{titulo}</h2>
        <p className="serif" style={{ margin: 0 }}>{r.motivo}</p>
        <Hemiciclo className="hemiciclo" escanos={[escanos(r.puntos[0]), escanos(r.puntos[1])]} nombres={nombres as [string, string]} />
        <p className="dato">{nombres[0]} {escanos(r.puntos[0])} · {escanos(r.puntos[1])} {nombres[1]}</p>
        {extra}
        <button className="boton principal" type="button" data-accion="fin" onClick={onSalir}>Continuar</button>
      </div>
    </div>
  );
}
