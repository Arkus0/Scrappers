// Mis mazos y la tienda de mazos temáticos.
import { useState } from 'react';
import { carta } from '../../datos/catalogo';
import { MAZOS_TEMATICOS } from '../../datos/mazos-tematicos';
import { borrarMazo, comprarTematico, cartasQueFaltan, mazoNuevo, type Perfil } from '../../perfil/perfil';
import { Carta } from '../Carta';
import type { Cambiar } from '../usePerfil';
import { Cabecera, Modal, problemasMazo, TiposMazo } from './comun';
import type { Destino } from '../App';

export function Mazos({ perfil: p, cambiar, ir, pestana = 'mios' }: { perfil: Perfil; cambiar: Cambiar; ir: (d: Destino) => void; pestana?: 'mios' | 'tienda' }) {
  const [tab, setTab] = useState(pestana);
  const [borrar, setBorrar] = useState<string | null>(null);
  const [verTematico, setVerTematico] = useState<string | null>(null);
  const t = MAZOS_TEMATICOS.find((m) => m.id === verTematico);
  return (
    <main className="pantalla">
      <div className="pantalla-caja">
        <Cabecera titulo="Mazos" onVolver={() => ir({ p: 'inicio' })} perfil={p} />
        <div className="pestanas" role="tablist">
          <button role="tab" type="button" aria-selected={tab === 'mios'} className={tab === 'mios' ? 'on' : ''} onClick={() => setTab('mios')}>Mis mazos ({p.mazos.length})</button>
          <button role="tab" type="button" aria-selected={tab === 'tienda'} className={tab === 'tienda' ? 'on' : ''} data-accion="tab-tienda" onClick={() => setTab('tienda')}>Mazos temáticos</button>
        </div>

        {tab === 'mios' && (
          <>
            <button className="boton principal" type="button" data-accion="nuevo-mazo" onClick={() => ir({ p: 'editor', id: null })}>+ Nuevo mazo</button>
            <div className="lista-mazos">
              {p.mazos.map((m) => {
                const problemas = problemasMazo(p, m);
                const activo = p.mazoActivo === m.id;
                return (
                  <div key={m.id} className={`fila-mazo ${activo ? 'activo' : ''}`}>
                    <div className="portada-mazo"><Carta id={m.cartas.find((id) => carta(id).clase === 'politico') ?? m.cartas[0]} tam="mini" /></div>
                    <div className="datos-mazo">
                      <b>{m.nombre}</b>
                      <span><TiposMazo tipos={m.tipos} /> {m.cartas.length}/20 {activo && <span className="pildora oro">Activo</span>}</span>
                      {problemas.length > 0 && <span className="error-txt">{problemas[0]}</span>}
                    </div>
                    <div className="botones-mazo">
                      {!activo && problemas.length === 0 && <button className="boton pequeno" type="button" onClick={() => cambiar((q) => { q.mazoActivo = m.id; })}>Usar</button>}
                      <button className="boton pequeno" type="button" data-accion={`editar-${m.id}`} onClick={() => ir({ p: 'editor', id: m.id })}>Editar</button>
                      <button className="boton pequeno" type="button" onClick={() => cambiar((q) => { const n = mazoNuevo([...m.cartas]); n.nombre = `${m.nombre} (copia)`.slice(0, 40); n.tipos = [...m.tipos]; q.mazos.push(n); })}>Duplicar</button>
                      <button className="boton pequeno peligro" type="button" onClick={() => setBorrar(m.id)}>Borrar</button>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {tab === 'tienda' && (
          <div className="lista-mazos">
            <p className="aviso" style={{ margin: 0 }}>Cada mazo temático trae sus 20 cartas a tu colección y queda listo para jugar. Son los mismos que usa la IA en la campaña: cada uno es un arquetipo distinto.</p>
            {MAZOS_TEMATICOS.map((m) => {
              const comprado = p.tematicos.includes(m.id);
              const faltan = new Set(cartasQueFaltan(p, m.cartas)).size;
              return (
                <div key={m.id} className="fila-mazo">
                  <div className="portada-mazo"><Carta id={m.cartas.find((id) => carta(id).clase === 'politico') ?? m.cartas[0]} tam="mini" /></div>
                  <div className="datos-mazo">
                    <b>{m.nombre}</b>
                    <span><TiposMazo tipos={m.tipos} /> <span className="pildora">{m.arquetipo}</span></span>
                    <span className="serif tenue" style={{ fontSize: 12.5 }}>{m.descripcion}</span>
                    {!comprado && <span className="tenue" style={{ fontSize: 12 }}>{faltan === 0 ? 'Ya tienes todas sus cartas' : `Te faltan ${faltan} cartas distintas`}</span>}
                  </div>
                  <div className="botones-mazo">
                    <button className="boton pequeno" type="button" onClick={() => setVerTematico(m.id)}>Ver</button>
                    {comprado
                      ? <span className="pildora">Comprado</span>
                      : <button className="boton pequeno principal" type="button" data-accion={`comprar-${m.id}`} disabled={p.fondos < m.precio} onClick={() => cambiar((q) => comprarTematico(q, m.id))}>{m.precio} ◉</button>}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      {borrar && (
        <Modal titulo="Borrar mazo" onCerrar={() => setBorrar(null)}>
          <p className="serif">¿Borrar «{p.mazos.find((m) => m.id === borrar)?.nombre}»? Las cartas siguen en tu colección.</p>
          <div className="fila-botones">
            <button className="boton" type="button" onClick={() => setBorrar(null)}>Cancelar</button>
            <button className="boton peligro" type="button" onClick={() => { cambiar((q) => borrarMazo(q, borrar)); setBorrar(null); }}>Borrar</button>
          </div>
        </Modal>
      )}
      {t && (
        <Modal titulo={t.nombre} onCerrar={() => setVerTematico(null)} ancho={900}>
          <p className="serif" style={{ marginTop: 0 }}>{t.descripcion}</p>
          <div className="rejilla-mini">
            {t.cartas.map((id, i) => <Carta key={i} id={id} tam="mini" />)}
          </div>
        </Modal>
      )}
    </main>
  );
}
