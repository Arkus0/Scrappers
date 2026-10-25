// Partida en este dispositivo: contra la IA o a dos jugadores (con cortina entre turnos).
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { pedirDecision } from '../../ia/cliente-ia';
import type { Nivel } from '../../ia/bot';
import type { DefMazo } from '../../motor/mazo';
import { clonar, crearPartida, responder } from '../../motor/motor';
import { vistaPara } from '../../motor/vista';
import type { Jug, Partida, Respuesta } from '../../motor/tipos';
import { Tablero } from './Tablero';
import { FinPartida, type ResultadoPartida } from './FinPartida';

export interface ConfigLocal {
  modo: 'ia' | 'dos';
  mazos: [DefMazo, DefMazo];
  nombres: [string, string];
  /** en modo IA, qué asiento es el humano */
  humano: Jug;
  nivel: Nivel;
  semilla?: number;
}

interface Props {
  config: ConfigLocal;
  estadoInicial?: Partida | null;
  onGuardar?: (e: Partida) => void;
  onFin: (r: ResultadoPartida) => void;
  onSalir: () => void;
  textoFin?: (r: ResultadoPartida) => React.ReactNode;
}

const RETRASO_IA = 520;

export function PartidaLocal({ config, estadoInicial, onGuardar, onFin, onSalir, textoFin }: Props) {
  const [e, setE] = useState<Partida>(() => estadoInicial ?? crearPartida(config.semilla ?? ((Math.random() * 2 ** 31) | 0), [
    { nombre: config.nombres[0], cartas: config.mazos[0].cartas, tipos: config.mazos[0].tipos },
    { nombre: config.nombres[1], cartas: config.mazos[1].cartas, tipos: config.mazos[1].tipos },
  ]));
  const [error, setError] = useState<string | null>(null);
  const esHumano = useCallback((j: Jug) => config.modo === 'dos' || j === config.humano, [config]);
  const decide = (e.pendiente?.jugador ?? e.enTurno) as Jug;
  // en el modo a dos, mira quien tiene que decidir; contra la IA, siempre el humano
  const mira: Jug = config.modo === 'dos' ? decide : config.humano;
  const [cortina, setCortina] = useState<Jug | null>(config.modo === 'dos' ? decide : null);
  const ultimoMira = useRef<Jug>(mira);
  useEffect(() => {
    if (config.modo !== 'dos' || e.ganador) return;
    if (mira !== ultimoMira.current) { setCortina(mira); ultimoMira.current = mira; }
  }, [mira, config.modo, e.ganador]);

  const aplicar = useCallback((r: Respuesta) => {
    setE((prev) => {
      const n = clonar(prev);
      try {
        responder(n, r);
      } catch (err) {
        setError(String(err));
        return prev;
      }
      onGuardar?.(n);
      return n;
    });
  }, [onGuardar]);

  // turno de la IA
  const pensando = useRef(false);
  useEffect(() => {
    if (e.ganador || !e.pendiente || e.pendiente.tipo === 'espera') return;
    const j = e.pendiente.jugador as Jug;
    if (esHumano(j) || pensando.current) return;
    pensando.current = true;
    const vista = vistaPara(e, j);
    const t = window.setTimeout(async () => {
      try {
        const r = await pedirDecision(vista, config.nivel);
        aplicar(r);
      } finally {
        pensando.current = false;
      }
    }, RETRASO_IA);
    return () => { window.clearTimeout(t); pensando.current = false; };
  }, [e, esHumano, aplicar, config.nivel]);

  const terminado = useRef(false);
  const resultado = useMemo<ResultadoPartida | null>(() => (e.ganador ? { ganador: e.ganador.jug, motivo: e.ganador.motivo, puntos: [e.jugadores[0].puntos, e.jugadores[1].puntos], humano: config.humano, modo: config.modo, partida: e } : null), [e, config]);
  useEffect(() => {
    if (resultado && !terminado.current) { terminado.current = true; onFin(resultado); }
  }, [resultado, onFin]);

  const vista = useMemo(() => vistaPara(e, mira), [e, mira]);
  const humanoDecide = !!e.pendiente && e.pendiente.tipo !== 'espera' && esHumano(e.pendiente.jugador as Jug) && e.pendiente.jugador === mira;
  return (
    <>
      <Tablero vista={vista} puedeActuar={humanoDecide && cortina === null} onResponder={aplicar} onSalir={onSalir}
        esperaTxt={!humanoDecide && config.modo === 'ia' ? `${e.jugadores[decide].nombre} está pensando…` : undefined} />
      {cortina !== null && !e.ganador && (
        <div className="cortina" role="dialog" aria-label="Cambio de jugador">
          <div>
            <h2>Pasa el móvil a {e.jugadores[cortina].nombre}</h2>
            <p className="tenue">Que no mire el rival: su mano queda oculta.</p>
            <button className="boton principal" type="button" data-accion="cortina" onClick={() => setCortina(null)}>Soy {e.jugadores[cortina].nombre}</button>
          </div>
        </div>
      )}
      {resultado && <FinPartida r={resultado} onSalir={onSalir} extra={textoFin?.(resultado)} />}
      {error && <div className="toast" onClick={() => setError(null)}>Error: {error}</div>}
    </>
  );
}
