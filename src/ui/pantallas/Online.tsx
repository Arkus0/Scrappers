// Modo online: sala con código, emparejamiento rápido y la partida contra el servidor autoritativo.
import { useCallback, useEffect, useRef, useState } from 'react';
import type { Jug, Partida, Respuesta, Suceso, Vista } from '../../motor/tipos';
import { tocarTema } from '../../audio/audio';
import { ClienteOnline, urlPorDefecto, type EstadoConexion } from '../../red/cliente';
import { EMOTES, LETRAS_CODIGO, type MsgServidor } from '../../red/protocolo';
import { registrarPartida, type Recompensa } from '../../perfil/misiones';
import { conShiny, type Perfil } from '../../perfil/perfil';
import { FinPartida } from '../partida/FinPartida';
import { Tablero } from '../partida/Tablero';
import type { Cambiar } from '../usePerfil';
import { Cabecera, ListaRecompensas, mazosJugables, Modal, TiposMazo } from './comun';
import type { Destino } from '../App';

type Fase = { f: 'menu' } | { f: 'sala'; codigo: string } | { f: 'buscando'; segundos: number; desde: number } | { f: 'partida' };
interface Emparejado { asiento: Jug; rival: string; codigo: string; contraIA?: boolean }

function Cuenta({ limite }: { limite: number | null }) {
  const [, setT] = useState(0);
  useEffect(() => {
    if (limite === null) return;
    const t = window.setInterval(() => setT((x) => x + 1), 500);
    return () => window.clearInterval(t);
  }, [limite]);
  if (limite === null) return null;
  const s = Math.max(0, Math.ceil((limite - Date.now()) / 1000));
  return <span className={`pildora dato plazo ${s <= 10 ? 'urgente' : ''}`} title="Tiempo para decidir" aria-live="off">⏱ {s}</span>;
}

export function Online({ perfil: p, cambiar, ir }: { perfil: Perfil; cambiar: Cambiar; ir: (d: Destino) => void }) {
  const mazos = mazosJugables(p);
  const [mazoId, setMazoId] = useState(() => (mazos.some((m) => m.id === p.mazoActivo) ? p.mazoActivo! : mazos[0]?.id ?? ''));
  const [url, setUrl] = useState(() => p.ajustes.urlServidor || urlPorDefecto() || '');
  const [con, setCon] = useState<EstadoConexion>('desconectado');
  const [fase, setFase] = useState<Fase>({ f: 'menu' });
  const [codigo, setCodigo] = useState('');
  const [emp, setEmp] = useState<Emparejado | null>(null);
  const [vista, setVista] = useState<{ v: Vista; seq: number; limite: number | null } | null>(null);
  const [enviado, setEnviado] = useState(-1);
  const [fin, setFin] = useState<{ ganador: Jug | null; motivo: string } | null>(null);
  const [premios, setPremios] = useState<Recompensa[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [version, setVersion] = useState(false);
  const [emote, setEmote] = useState<{ mio: boolean; txt: string } | null>(null);
  const [verEmotes, setVerEmotes] = useState(false);
  const [rivalFuera, setRivalFuera] = useState<number | null>(null);
  const [revancha, setRevancha] = useState<'yo' | 'rival' | null>(null);
  const [salir, setSalir] = useState(false);
  const cliente = useRef<ClienteOnline | null>(null);
  const sucesos = useRef<Suceso[]>([]);
  const vistos = useRef(0);
  const registradas = useRef(new Set<string>());
  const empRef = useRef<Emparejado | null>(null);
  const vistaRef = useRef<Vista | null>(null);

  const alMensaje = useCallback((m: MsgServidor) => {
    switch (m.t) {
      case 'sala': setFase({ f: 'sala', codigo: m.codigo }); break;
      case 'buscando': setFase({ f: 'buscando', segundos: m.segundos, desde: Date.now() }); break;
      case 'emparejado':
        empRef.current = m;
        setEmp(m);
        setFase({ f: 'partida' });
        setFin(null);
        setPremios(null);
        setRevancha(null);
        setRivalFuera(null);
        break;
      case 'vista': {
        // los sucesos llegan recortados: se acumulan aquí para las misiones y los logros
        if (m.vista.nSucesos < vistos.current) { sucesos.current = []; vistos.current = 0; }
        const n = Math.min(m.vista.sucesos.length, m.vista.nSucesos - vistos.current);
        if (n > 0) sucesos.current.push(...m.vista.sucesos.slice(-n));
        vistos.current = m.vista.nSucesos;
        vistaRef.current = m.vista;
        setVista({ v: m.vista, seq: m.seq, limite: m.plazo === null ? null : Date.now() + m.plazo });
        break;
      }
      case 'emote': setEmote({ mio: false, txt: EMOTES[m.id] ?? '' }); break;
      case 'rivalDesconectado': setRivalFuera(m.segundos); break;
      case 'rivalReconectado': setRivalFuera(null); break;
      case 'revancha': setRevancha((r) => (r === 'yo' ? r : 'rival')); break;
      case 'fin': {
        setFin({ ganador: m.ganador, motivo: m.motivo });
        const e = empRef.current, v = vistaRef.current;
        const clave = `${e?.codigo}-${v?.nSucesos}-${m.motivo}`;
        if (e && v && !registradas.current.has(clave)) {
          registradas.current.add(clave);
          const partida = { ...v, sucesos: sucesos.current, ganador: { jug: m.ganador, motivo: m.motivo } } as unknown as Partida;
          setPremios(cambiar((q) => registrarPartida(q, { modo: e.contraIA ? 'ia' : 'online', ganador: m.ganador, yo: e.asiento, partida })));
        }
        break;
      }
      case 'error':
        if (m.codigo === 'version') setVersion(true);
        else setError(m.texto);
        if (m.codigo === 'sala' || m.codigo === 'mazo') setFase((f) => (f.f === 'partida' ? f : { f: 'menu' }));
        break;
    }
  }, [cambiar]);

  const conectar = useCallback((u: string) => {
    cliente.current?.cerrar();
    if (!u) return;
    const c = new ClienteOnline(u, p.nombre);
    c.onEstado = setCon;
    c.onMensaje = alMensaje;
    cliente.current = c;
    c.conectar();
  }, [p.nombre, alMensaje]);

  useEffect(() => {
    if (url) conectar(url);
    return () => cliente.current?.cerrar();
    // solo al entrar: cambiar de servidor se hace con el botón
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // música: vestíbulo, partida y fanfarria final
  const enPartida = fase.f === 'partida' && !!emp && !!vista;
  const tema = !enPartida ? 'menu' : fin ? (fin.ganador === emp?.asiento ? 'victoria' : 'derrota') : 'combate';
  useEffect(() => { tocarTema(tema); }, [tema]);

  useEffect(() => {
    if (!emote) return;
    const t = window.setTimeout(() => setEmote(null), 2600);
    return () => window.clearTimeout(t);
  }, [emote]);

  const mazo = () => {
    const m = mazos.find((x) => x.id === mazoId)!;
    return { nombre: m.nombre, cartas: conShiny(p, m.cartas), tipos: m.tipos };
  };
  const listo = con === 'conectado' && !!mazos.find((x) => x.id === mazoId);
  const responder = (r: Respuesta) => {
    if (!vista) return;
    setEnviado(vista.seq);
    cliente.current?.responder(vista.seq, r);
  };
  const volverMenu = () => { setFase({ f: 'menu' }); setVista(null); setEmp(null); setFin(null); sucesos.current = []; vistos.current = 0; };

  // ————————————————————————————————————— partida
  if (fase.f === 'partida' && emp && vista) {
    const v = vista.v;
    const miTurno = !fin && !!v.pendiente && v.pendiente.tipo !== 'espera' && v.pendiente.jugador === v.yo && enviado !== vista.seq;
    return (
      <>
        <Tablero vista={v} puedeActuar={miTurno} onResponder={responder} onSalir={() => (fin ? volverMenu() : setSalir(true))}
          esperaTxt={!miTurno && !fin ? (enviado === vista.seq && v.pendiente?.jugador === v.yo ? 'Enviando…' : `${emp.rival} está decidiendo…`) : undefined}
          extraBarra={<>
            <Cuenta limite={vista.limite} />
            <button className="boton-icono" type="button" aria-label="Emoticonos" title="Emoticonos" onClick={() => setVerEmotes((x) => !x)}>💬</button>
          </>} />
        {verEmotes && (
          <div className="emotes" role="menu">
            {Object.entries(EMOTES).map(([id, txt]) => (
              <button key={id} type="button" role="menuitem" className="boton pequeno" onClick={() => { cliente.current?.emote(id); setEmote({ mio: true, txt }); setVerEmotes(false); }}>{txt}</button>
            ))}
          </div>
        )}
        {emote && <div className={`bocadillo ${emote.mio ? 'mio' : 'suyo'}`} role="status">{emote.mio ? 'Tú' : emp.rival}: {emote.txt}</div>}
        {rivalFuera !== null && !fin && <div className="toast">{emp.rival} se ha desconectado: tiene {rivalFuera} s para volver</div>}
        {con === 'reconectando' && <div className="toast">Reconectando con el servidor…</div>}
        {fin && (
          <FinPartida
            r={{ ganador: fin.ganador, motivo: fin.motivo, puntos: [v.jugadores[0].puntos, v.jugadores[1].puntos], humano: emp.asiento, modo: 'online', partida: v as unknown as Partida }}
            onSalir={volverMenu}
            extra={<>
              <ListaRecompensas lista={premios} />
              <button className="boton" type="button" data-accion="revancha" disabled={revancha === 'yo'} onClick={() => { cliente.current?.revancha(); setRevancha('yo'); }}>
                {revancha === 'rival' ? `¡${emp.rival} quiere la revancha! Aceptar` : revancha === 'yo' ? 'Esperando al rival…' : 'Pedir revancha'}
              </button>
            </>} />
        )}
        {salir && (
          <Modal titulo="Abandonar la partida" onCerrar={() => setSalir(false)}>
            <p className="serif">Si abandonas, la partida cuenta como derrota.</p>
            <div className="fila-botones">
              <button className="boton" type="button" onClick={() => setSalir(false)}>Seguir jugando</button>
              <button className="boton peligro" type="button" onClick={() => { cliente.current?.abandonar(); setSalir(false); }}>Abandonar</button>
            </div>
          </Modal>
        )}
        {error && <div className="toast" onClick={() => setError(null)}>{error}</div>}
      </>
    );
  }

  // ————————————————————————————————————— vestíbulo
  return (
    <main className="pantalla">
      <div className="pantalla-caja estrecha">
        <Cabecera titulo="Online" onVolver={() => { cliente.current?.cancelar(); ir({ p: 'inicio' }); }}>
          <span className={`pildora estado-con ${con}`}>{{ desconectado: 'Sin conexión', conectando: 'Conectando…', conectado: 'Conectado', reconectando: 'Reconectando…' }[con]}</span>
        </Cabecera>
        {version && <div className="panel"><p className="serif">Hay una versión nueva del juego en el servidor.</p><button className="boton principal" type="button" onClick={() => location.reload()}>Recargar</button></div>}
        {(con === 'desconectado' || !url) && (
          <div className="panel formulario">
            <p className="serif" style={{ margin: 0 }}>{url ? 'No se puede conectar con el servidor online. Comprueba la dirección: el modo online necesita el servidor del juego (Railway); la web de Vercel por sí sola no lo incluye.' : 'Indica la dirección del servidor online (wss://…/ws).'}</p>
            <input className="campo" value={url} placeholder="wss://tu-servidor.up.railway.app/ws" onChange={(e) => setUrl(e.target.value.trim())} aria-label="Servidor" />
            <button className="boton principal" type="button" disabled={!url} onClick={() => { cambiar((q) => { q.ajustes.urlServidor = url === urlPorDefecto() ? '' : url; }); conectar(url); }}>Conectar</button>
          </div>
        )}
        {mazos.length === 0 ? (
          <div className="panel"><p className="serif">Necesitas un mazo completo para jugar online.</p><button className="boton" type="button" onClick={() => ir({ p: 'mazos' })}>Ir a mis mazos</button></div>
        ) : fase.f === 'menu' ? (
          <div className="panel formulario">
            <label className="selector">
              <span className="etiqueta">Tu mazo</span>
              <select className="campo" value={mazoId} onChange={(e) => setMazoId(e.target.value)}>
                {mazos.map((m) => <option key={m.id} value={m.id}>{m.nombre}</option>)}
              </select>
              <TiposMazo tipos={mazos.find((m) => m.id === mazoId)?.tipos ?? []} />
            </label>
            <button className="boton principal bloque" type="button" data-accion="buscar-rival" disabled={!listo} onClick={() => cliente.current?.buscar(mazo())}>Buscar rival</button>
            <button className="boton bloque" type="button" data-accion="crear-sala" disabled={!listo} onClick={() => cliente.current?.crearSala(mazo())}>Crear sala privada</button>
            <div className="fila-botones">
              <input className="campo codigo-sala" value={codigo} maxLength={4} placeholder="CÓDIGO" aria-label="Código de sala"
                onChange={(e) => setCodigo([...e.target.value.toUpperCase()].filter((ch) => LETRAS_CODIGO.includes(ch)).join(''))} />
              <button className="boton" type="button" data-accion="unirse" disabled={!listo || codigo.length !== 4} onClick={() => cliente.current?.unirse(codigo, mazo())}>Unirse</button>
            </div>
            <p className="aviso" style={{ margin: 0 }}>Si nadie aparece en 30 segundos juegas contra la IA de guardia. Solo hay emoticonos, sin chat. Victoria online: 80 ◉.</p>
          </div>
        ) : fase.f === 'sala' ? (
          <div className="panel centro">
            <p className="etiqueta">Código de la sala</p>
            <p className="codigo-grande dato" data-codigo={fase.codigo}>{fase.codigo}</p>
            <p className="serif">Pásale este código a tu rival. La partida empieza cuando se una.</p>
            <button className="boton" type="button" onClick={() => { cliente.current?.cancelar(); setFase({ f: 'menu' }); }}>Cancelar</button>
          </div>
        ) : fase.f === 'buscando' ? (
          <Buscando segundos={fase.segundos} desde={fase.desde} onCancelar={() => { cliente.current?.cancelar(); setFase({ f: 'menu' }); }} />
        ) : (
          <div className="panel centro"><p className="serif">Preparando la partida…</p></div>
        )}
      </div>
      {error && <div className="toast" onClick={() => setError(null)}>{error}</div>}
    </main>
  );
}

function Buscando({ segundos, desde, onCancelar }: { segundos: number; desde: number; onCancelar: () => void }) {
  const [, setT] = useState(0);
  useEffect(() => {
    const t = window.setInterval(() => setT((x) => x + 1), 1000);
    return () => window.clearInterval(t);
  }, []);
  const quedan = Math.max(0, segundos - Math.floor((Date.now() - desde) / 1000));
  return (
    <div className="panel centro">
      <div className="girando" aria-hidden />
      <p className="serif">Buscando rival… {quedan > 0 ? `${quedan} s hasta la IA de guardia` : 'llamando a la IA de guardia'}</p>
      <button className="boton" type="button" onClick={onCancelar}>Cancelar</button>
    </div>
  );
}
