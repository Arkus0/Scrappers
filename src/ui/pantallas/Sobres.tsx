// Abrir sobres: el sobre se rasga, las cartas salen boca abajo y se giran una a una.
import { useEffect, useState } from 'react';
import { carta } from '../../datos/catalogo';
import { avanzarMisiones, revisarColeccion, type Recompensa } from '../../perfil/misiones';
import { HORAS_SOBRE_GRATIS, MAX_SOBRES_GRATIS, PRECIO_SOBRE, type Perfil } from '../../perfil/perfil';
import { abrirSobre, puedeAbrir, SOBRES_GARANTIA, type CartaSobre, type Pago } from '../../perfil/sobres';
import { Carta, RAREZA_NOMBRE, RAREZA_TXT } from '../Carta';
import { sonido } from '../../audio/audio';
import type { Cambiar } from '../usePerfil';
import { Barra, Cabecera, formatoTiempo, ListaRecompensas } from './comun';
import type { Destino } from '../App';

export function Sobres({ perfil: p, cambiar, ir }: { perfil: Perfil; cambiar: Cambiar; ir: (d: Destino) => void }) {
  const [abiertas, setAbiertas] = useState<CartaSobre[] | null>(null);
  const [vueltas, setVueltas] = useState<Set<number>>(new Set());
  const [rasgando, setRasgando] = useState(false);
  const [premios, setPremios] = useState<Recompensa[]>([]);
  const [zoom, setZoom] = useState<CartaSobre | null>(null);
  const [ahora, setAhora] = useState(Date.now());
  useEffect(() => {
    const t = window.setInterval(() => setAhora(Date.now()), 1000);
    return () => window.clearInterval(t);
  }, []);

  const abrir = (pago: Pago) => {
    setRasgando(true);
    window.setTimeout(() => {
      const r = cambiar((q) => {
        const cartas = abrirSobre(q, pago);
        if (!cartas) return null;
        const premios = [...avanzarMisiones(q, 'sobres', 1), ...revisarColeccion(q)];
        return { cartas, premios };
      });
      setRasgando(false);
      if (!r) return;
      setAbiertas(r.cartas);
      setVueltas(new Set());
      setPremios(r.premios);
    }, 650);
  };

  /** El sonido de la mejor carta que se descubre: Shiny, rara (CL o mejor) o normal. */
  const sonar = (cs: CartaSobre[]) => {
    if (cs.some((c) => c.shiny)) sonido('shiny');
    else if (cs.some((c) => ['CL', 'E', 'S'].includes(carta(c.id).rareza))) sonido('rara');
    else sonido('girar');
  };
  const girar = (i: number) => {
    if (abiertas) sonar([abiertas[i]]);
    setVueltas((v) => new Set(v).add(i));
  };
  const girarTodas = () => {
    if (!abiertas) return;
    sonar(abiertas.filter((_, i) => !vueltas.has(i)));
    setVueltas(new Set(abiertas.map((_, i) => i)));
  };
  const todas = abiertas !== null && vueltas.size === abiertas.length;
  const faltaGratis = p.sobres.gratis < MAX_SOBRES_GRATIS ? p.sobres.proximoGratis - ahora : null;

  return (
    <main className="pantalla">
      <div className="pantalla-caja">
        <Cabecera titulo="Sobres · Expansión 29N" onVolver={() => ir({ p: 'inicio' })} perfil={p} />

        {!abiertas && (
          <div className="zona-sobre">
            <button type="button" className={`sobre ${rasgando ? 'rasgando' : ''}`} disabled={rasgando || (!puedeAbrir(p, 'gratis') && !puedeAbrir(p, 'fondos'))}
              onClick={() => abrir(puedeAbrir(p, 'gratis') ? 'gratis' : 'fondos')} aria-label="Abrir sobre" data-accion="abrir-sobre-arte">
              <span className="sobre-176">176</span>
              <span className="sobre-exp">EXPANSIÓN 29N</span>
              <span className="sobre-n">5 cartas</span>
            </button>
            <div className="panel info-sobres">
              <div className="fila-botones">
                <button className="boton principal" type="button" data-accion="abrir-gratis" disabled={rasgando || !puedeAbrir(p, 'gratis')} onClick={() => abrir('gratis')}>
                  Abrir gratis ({p.sobres.gratis}/{MAX_SOBRES_GRATIS})
                </button>
                <button className="boton" type="button" data-accion="abrir-fondos" disabled={rasgando || !puedeAbrir(p, 'fondos')} onClick={() => abrir('fondos')}>
                  Comprar · {PRECIO_SOBRE} ◉
                </button>
              </div>
              <p className="tenue" style={{ margin: 0 }}>
                {faltaGratis !== null ? `Próximo sobre gratis en ${formatoTiempo(faltaGratis)}` : `Tienes los ${MAX_SOBRES_GRATIS} sobres gratis: ábrelos para que se recarguen`} · uno cada {HORAS_SOBRE_GRATIS} h.
              </p>
              <div>
                <span className="etiqueta">Garantía de Cabeza de lista o mejor</span>
                <Barra valor={p.sobres.sinCL} max={SOBRES_GARANTIA - 1} etiqueta="Garantía" />
                <p className="tenue" style={{ margin: '4px 0 0', fontSize: 12 }}>
                  {SOBRES_GARANTIA - 1 - p.sobres.sinCL <= 0 ? '¡El próximo sobre trae CL, ★ o ♛ seguro!' : `Como mucho ${SOBRES_GARANTIA - p.sobres.sinCL} sobres más hasta una CL o mejor.`}
                </p>
              </div>
              <details>
                <summary>Probabilidades</summary>
                <p className="serif" style={{ fontSize: 13 }}>Cartas 1-3: {RAREZA_TXT.C}. Carta 4: {RAREZA_TXT.I} 90 %, {RAREZA_TXT.R} 6 %, CL 2,5 %, {RAREZA_TXT.E} 1,5 %. Carta 5: {RAREZA_TXT.I} 62 %, {RAREZA_TXT.R} 22 %, CL 10 %, {RAREZA_TXT.E} 5,5 %, {RAREZA_TXT.S} 0,5 %. Cada carta de una persona tiene además un 5 % de salir Shiny. Nunca se repite carta en un mismo sobre.</p>
              </details>
            </div>
          </div>
        )}

        {abiertas && (
          <>
            <div className="cartas-sobre">
              {abiertas.map((c, i) => {
                const v = vueltas.has(i);
                const r = carta(c.id).rareza;
                return (
                  <div key={i} className={`hueco-sobre ${v ? 'vuelta' : ''}`} data-rareza={r} style={{ animationDelay: `${i * 90}ms` }}>
                    {v ? (
                      <div className={`revelada ${c.shiny ? 'destello-shiny' : ''}`}>
                        <Carta id={c.id} shiny={c.shiny} tam="media" onClick={() => setZoom(c)} etiqueta={`${carta(c.id).nombre}, ${RAREZA_NOMBRE[r]}${c.shiny ? ', Shiny' : ''}`} />
                        {c.nueva && <span className="sello-nueva">NUEVA</span>}
                      </div>
                    ) : (
                      <button type="button" className="carta media reverso boca-abajo" data-accion={`girar-${i}`} onClick={() => girar(i)} aria-label={`Girar carta ${i + 1}`}>
                        <span className="marca">176</span>
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
            <div className="fila-botones centro">
              {!todas && <button className="boton" type="button" data-accion="girar-todas" onClick={girarTodas}>Girar todas</button>}
              {todas && (
                <>
                  <button className="boton principal" type="button" data-accion="otro-sobre" disabled={!puedeAbrir(p, 'gratis') && !puedeAbrir(p, 'fondos')} onClick={() => { setAbiertas(null); abrir(puedeAbrir(p, 'gratis') ? 'gratis' : 'fondos'); }}>
                    Otro sobre {puedeAbrir(p, 'gratis') ? '(gratis)' : `(${PRECIO_SOBRE} ◉)`}
                  </button>
                  <button className="boton" type="button" data-accion="cerrar-sobre" onClick={() => setAbiertas(null)}>Hecho</button>
                  <button className="boton fantasma" type="button" onClick={() => ir({ p: 'album' })}>Ver álbum</button>
                </>
              )}
            </div>
            {todas && <ListaRecompensas lista={premios} />}
          </>
        )}
      </div>
      {zoom && (
        <div className="velo" onClick={() => setZoom(null)}>
          <div className="zoom"><Carta id={zoom.id} shiny={zoom.shiny} tam="grande" /><p className="tenue">Toca para cerrar</p></div>
        </div>
      )}
    </main>
  );
}
