// Piezas compartidas por las pantallas de menú.
import type { ReactNode } from 'react';
import { validarMazo } from '../../motor/mazo';
import type { Recompensa } from '../../perfil/misiones';
import { cartasQueFaltan, type MazoGuardado, type Perfil } from '../../perfil/perfil';
import { SelloTipo } from '../Carta';

export function Cabecera({ titulo, onVolver, perfil, children }: { titulo: string; onVolver: () => void; perfil?: Perfil; children?: ReactNode }) {
  return (
    <header className="cabecera">
      <button className="boton-icono" type="button" onClick={onVolver} aria-label="Volver" data-accion="volver">←</button>
      <h2>{titulo}</h2>
      {children}
      {perfil && <Recursos p={perfil} />}
    </header>
  );
}

export function Recursos({ p, completo }: { p: Perfil; completo?: boolean }) {
  return (
    <div className="marcador-perfil" aria-label="Recursos">
      <span className="pildora oro" title="Fondos de campaña">◉ <span className="dato">{p.fondos}</span></span>
      <span className="pildora" title="Papeletas (para fabricar cartas)">✉ <span className="dato">{p.papeletas}</span></span>
      {completo && <span className="pildora" title="Sobres gratis">🎴 <span className="dato">{p.sobres.gratis}</span></span>}
    </div>
  );
}

export function ListaRecompensas({ lista }: { lista: Recompensa[] | null }) {
  if (!lista?.length) return null;
  const total = lista.reduce((s, r) => s + r.fondos, 0);
  return (
    <div className="recompensas">
      {lista.map((r, i) => <div key={i} className="recompensa"><span>{r.texto}</span>{r.fondos > 0 && <b className="dato">+{r.fondos} ◉</b>}</div>)}
      {lista.length > 1 && <div className="recompensa total"><span>Total</span><b className="dato">+{total} ◉</b></div>}
    </div>
  );
}

export function TiposMazo({ tipos }: { tipos: MazoGuardado['tipos'] }) {
  return <span className="tipos-mazo">{tipos.map((t) => <SelloTipo key={t} t={t} />)}</span>;
}

/** Errores de un mazo guardado para jugarlo (reglas + cartas que faltan). */
export function problemasMazo(p: Perfil, m: MazoGuardado): string[] {
  const e = validarMazo(m);
  if (cartasQueFaltan(p, m.cartas).length) e.push('Te faltan cartas de este mazo');
  return e;
}

export const mazosJugables = (p: Perfil) => p.mazos.filter((m) => problemasMazo(p, m).length === 0);

export function Modal({ children, onCerrar, titulo, ancho }: { children: ReactNode; onCerrar: () => void; titulo?: string; ancho?: number }) {
  return (
    <div className="velo" onClick={onCerrar}>
      <div className="modal" role="dialog" aria-label={titulo} onClick={(e) => e.stopPropagation()} style={ancho ? { width: `min(${ancho}px, 100%)` } : undefined}>
        {titulo && (
          <div className="hoja-cab">
            <h3>{titulo}</h3>
            <button className="boton-icono" type="button" onClick={onCerrar} aria-label="Cerrar" data-accion="cerrar">✕</button>
          </div>
        )}
        {children}
      </div>
    </div>
  );
}

export function Barra({ valor, max, etiqueta }: { valor: number; max: number; etiqueta?: string }) {
  const pct = Math.max(0, Math.min(100, (100 * valor) / Math.max(1, max)));
  return (
    <div className="barra-progreso" role="progressbar" aria-valuenow={valor} aria-valuemax={max} aria-label={etiqueta}>
      <i style={{ width: `${pct}%` }} />
    </div>
  );
}

export const formatoTiempo = (ms: number) => {
  const s = Math.max(0, Math.ceil(ms / 1000));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  return h ? `${h} h ${String(m).padStart(2, '0')} min` : `${m} min ${String(s % 60).padStart(2, '0')} s`;
};
