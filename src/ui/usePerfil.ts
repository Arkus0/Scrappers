// El perfil en React: una sola copia, se guarda en cada cambio.
import { useCallback, useEffect, useRef, useState } from 'react';
import { cargarPerfil, guardarPerfil } from '../perfil/almacen';
import { misionesDelDia } from '../perfil/misiones';
import type { Perfil } from '../perfil/perfil';
import { recargarGratis } from '../perfil/sobres';

export type Cambiar = <T>(fn: (p: Perfil) => T) => T;

export function usePerfil(): [Perfil, Cambiar, boolean] {
  const ref = useRef<Perfil | null>(null);
  if (!ref.current) {
    const p = cargarPerfil();
    misionesDelDia(p);
    recargarGratis(p);
    ref.current = p;
  }
  const [perfil, setPerfil] = useState<Perfil>(ref.current);
  const [persistente, setPersistente] = useState(true);
  const cambiar = useCallback(<T,>(fn: (p: Perfil) => T): T => {
    const n = structuredClone(ref.current!);
    const r = fn(n);
    ref.current = n;
    setPersistente(guardarPerfil(n));
    setPerfil(n);
    return r;
  }, []);
  // los sobres gratis y las misiones cambian con la hora aunque nadie toque nada
  useEffect(() => {
    const t = window.setInterval(() => cambiar((p) => { misionesDelDia(p); recargarGratis(p); }), 60_000);
    return () => window.clearInterval(t);
  }, [cambiar]);
  useEffect(() => { setPersistente(guardarPerfil(ref.current!)); }, []);
  return [perfil, cambiar, persistente];
}
