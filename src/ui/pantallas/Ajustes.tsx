// Ajustes: nombre, accesibilidad, servidor online y copia de seguridad del perfil.
import { useState } from 'react';
import type { Nivel } from '../../ia/bot';
import { limpiarNombre } from '../../red/protocolo';
import { borrarPerfil, exportarPerfil, importarPerfil } from '../../perfil/almacen';
import { perfilNuevo, type Perfil } from '../../perfil/perfil';
import type { Cambiar } from '../usePerfil';
import { Cabecera, Modal } from './comun';
import type { Destino } from '../App';

export function Ajustes({ perfil: p, cambiar, ir }: { perfil: Perfil; cambiar: Cambiar; ir: (d: Destino) => void }) {
  const [nombre, setNombre] = useState(p.nombre);
  const [codigo, setCodigo] = useState('');
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [borrar, setBorrar] = useState(false);
  const exportado = exportarPerfil(p);
  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(exportado);
      setMensaje('Código copiado al portapapeles');
    } catch {
      setMensaje('No se ha podido copiar: selecciona el texto y cópialo a mano');
    }
  };
  const importar = () => {
    const r = importarPerfil(codigo);
    if (typeof r === 'string') { setMensaje(r); return; }
    cambiar((q) => { Object.assign(q, r); });
    setMensaje(`Perfil de «${r.nombre}» importado`);
    setCodigo('');
  };
  return (
    <main className="pantalla">
      <div className="pantalla-caja estrecha">
        <Cabecera titulo="Ajustes" onVolver={() => ir({ p: 'inicio' })} />
        <section className="panel formulario">
          <label className="selector">
            <span className="etiqueta">Tu nombre de candidato</span>
            <input className="campo" value={nombre} maxLength={16} onChange={(e) => setNombre(e.target.value)} onBlur={() => { const n = limpiarNombre(nombre); setNombre(n); cambiar((q) => { q.nombre = n; }); }} />
          </label>
          <label className="selector">
            <span className="etiqueta">Nivel de la IA por defecto</span>
            <select className="campo" value={p.ajustes.nivel} onChange={(e) => cambiar((q) => { q.ajustes.nivel = e.target.value as Nivel; })}>
              <option value="novato">Novato</option>
              <option value="normal">Normal</option>
              <option value="experto">Experto</option>
            </select>
          </label>
          <label className="selector">
            <span className="etiqueta">Música · {Math.round(p.ajustes.musica * 100)} %</span>
            <input className="deslizador" type="range" min={0} max={1} step={0.05} value={p.ajustes.musica} onChange={(e) => cambiar((q) => { q.ajustes.musica = Number(e.target.value); })} />
          </label>
          <label className="selector">
            <span className="etiqueta">Efectos de sonido · {Math.round(p.ajustes.efectos * 100)} %</span>
            <input className="deslizador" type="range" min={0} max={1} step={0.05} value={p.ajustes.efectos} onChange={(e) => cambiar((q) => { q.ajustes.efectos = Number(e.target.value); })} />
          </label>
          <label className="interruptor">
            <input type="checkbox" checked={p.ajustes.reducirMovimiento} onChange={(e) => cambiar((q) => { q.ajustes.reducirMovimiento = e.target.checked; })} />
            Reducir animaciones
          </label>
          <label className="selector">
            <span className="etiqueta">Servidor online (vacío: el configurado por defecto)</span>
            <input className="campo" value={p.ajustes.urlServidor} placeholder="wss://tu-servidor.up.railway.app/ws" onChange={(e) => cambiar((q) => { q.ajustes.urlServidor = e.target.value.trim(); })} />
          </label>
        </section>
        <section className="panel formulario">
          <h3 className="titulo-seccion">Copia de seguridad</h3>
          <p className="serif" style={{ margin: 0 }}>Copia este código y pégalo en otro dispositivo para llevarte tu colección, tus mazos y tu campaña.</p>
          <textarea className="campo codigo" readOnly value={exportado} rows={3} onFocus={(e) => e.currentTarget.select()} aria-label="Código de tu perfil" />
          <button className="boton" type="button" onClick={copiar}>Copiar código</button>
          <textarea className="campo codigo" value={codigo} rows={3} placeholder="Pega aquí un código 176-…" onChange={(e) => setCodigo(e.target.value)} aria-label="Pegar código" />
          <button className="boton principal" type="button" disabled={!codigo.trim()} onClick={importar}>Importar perfil</button>
          {mensaje && <p className="aviso" role="status">{mensaje}</p>}
        </section>
        <section className="panel">
          <button className="boton peligro bloque" type="button" onClick={() => setBorrar(true)}>Borrar el perfil y empezar de cero</button>
        </section>
      </div>
      {borrar && (
        <Modal titulo="Borrar perfil" onCerrar={() => setBorrar(false)}>
          <p className="serif">Se pierden la colección, los mazos, la campaña y las estadísticas. Haz antes una copia si quieres conservarlos.</p>
          <div className="fila-botones">
            <button className="boton" type="button" onClick={() => setBorrar(false)}>Cancelar</button>
            <button className="boton peligro" type="button" onClick={() => { borrarPerfil(); cambiar((q) => { Object.assign(q, perfilNuevo()); }); setBorrar(false); ir({ p: 'inicio' }); }}>Borrar</button>
          </div>
        </Modal>
      )}
    </main>
  );
}
