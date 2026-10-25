// Web Worker de la IA: decide fuera del hilo de la interfaz para que el tablero no se congele.
import { decidirIA, type Nivel } from './bot';
import type { Vista } from '../motor/tipos';

self.onmessage = (ev: MessageEvent<{ vista: Vista; nivel: Nivel; semilla: number; pid: number }>) => {
  const { vista, nivel, semilla, pid } = ev.data;
  try {
    const r = decidirIA(vista, nivel, semilla);
    (self as unknown as Worker).postMessage({ pid, r });
  } catch (err) {
    (self as unknown as Worker).postMessage({ pid, error: String(err) });
  }
};
