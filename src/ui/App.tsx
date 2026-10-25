// La aplicación: perfil, navegación entre pantallas y las partidas locales (rápida, a dos, campaña y tutorial).
import { useCallback, useEffect, useState } from 'react';
import { desbloquearAudio, sonido, tocarTema, volumenes } from '../audio/audio';
import type { TemaId } from '../audio/temas';
import { MAZOS_INICIALES } from '../datos/mazos-iniciales';
import { mazoRival, resolverActo, type Acto } from '../perfil/campana';
import { registrarPartida, type Recompensa } from '../perfil/misiones';
import { conShiny } from '../perfil/perfil';
import { Campana } from './campana/Campana';
import { PartidaLocal, type ConfigLocal } from './partida/PartidaLocal';
import type { ResultadoPartida } from './partida/FinPartida';
import { Ajustes } from './pantallas/Ajustes';
import { Album } from './pantallas/Album';
import { Ayuda } from './pantallas/Ayuda';
import { ListaRecompensas } from './pantallas/comun';
import { ConfigPartida } from './pantallas/ConfigPartida';
import { EditorMazo } from './pantallas/EditorMazo';
import { ElegirInicial, Tutorial } from './pantallas/ElegirInicial';
import { Inicio } from './pantallas/Inicio';
import { Mazos } from './pantallas/Mazos';
import { Misiones } from './pantallas/Misiones';
import { Online } from './pantallas/Online';
import { Sobres } from './pantallas/Sobres';
import { usePerfil } from './usePerfil';

export type Destino =
  | { p: 'inicio' } | { p: 'inicial' } | { p: 'tutorial' } | { p: 'rapida' } | { p: 'dos' } | { p: 'online' } | { p: 'sobres' }
  | { p: 'album' } | { p: 'mazos'; tab?: 'mios' | 'tienda' } | { p: 'editor'; id: string | null } | { p: 'misiones' } | { p: 'ajustes' }
  | { p: 'ayuda' } | { p: 'campana' };

interface EnCurso {
  config: ConfigLocal;
  tipo: 'rapida' | 'dos' | 'campana' | 'tutorial';
  acto?: Acto;
  volver: Destino;
}

interface Desenlace {
  premios: Recompensa[];
  nota: string | null;
  fanfarria: 'victoria' | 'derrota';
}

const ESPEJO = { rojo: 'azul', azul: 'rojo', magenta: 'verde', verde: 'magenta' } as const;

export function App() {
  const [perfil, cambiar, persistente] = usePerfil();
  const [destino, setDestino] = useState<Destino>({ p: 'inicio' });
  const [partida, setPartida] = useState<EnCurso | null>(null);
  const [desenlace, setDesenlace] = useState<Desenlace | null>(null);
  const ir = useCallback((d: Destino) => { setDestino(d); window.scrollTo?.(0, 0); }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('reducir-movimiento', perfil.ajustes.reducirMovimiento);
  }, [perfil.ajustes.reducirMovimiento]);

  // ————————————————————————— música y sonido
  useEffect(() => { volumenes(perfil.ajustes.musica, perfil.ajustes.efectos); }, [perfil.ajustes.musica, perfil.ajustes.efectos]);
  useEffect(() => {
    // el navegador solo deja sonar tras un gesto; los botones suenan con un clic suave
    const gesto = () => desbloquearAudio();
    const clic = (ev: MouseEvent) => { if ((ev.target as Element | null)?.closest?.('button.boton, button.chip, .pestanas button, .boton-icono')) sonido('clic'); };
    window.addEventListener('pointerdown', gesto, true);
    window.addEventListener('keydown', gesto, true);
    document.addEventListener('click', clic, true);
    return () => {
      window.removeEventListener('pointerdown', gesto, true);
      window.removeEventListener('keydown', gesto, true);
      document.removeEventListener('click', clic, true);
    };
  }, []);
  const c = perfil.campana;
  const tema: TemaId | null | 'online' = partida
    ? desenlace ? desenlace.fanfarria : 'combate'
    : destino.p === 'online' ? 'online'
      : destino.p === 'campana' ? (c?.terminada ? (c.terminada.investidura ? 'victoria' : 'derrota') : 'campana')
        : destino.p === 'sobres' || destino.p === 'album' ? 'sobres' : 'menu';
  // la pantalla online elige su propia música (vestíbulo o partida)
  useEffect(() => { if (tema !== 'online') tocarTema(tema); }, [tema]);

  const jugar = (config: ConfigLocal, tipo: EnCurso['tipo'], volver: Destino, acto?: Acto) => {
    setDesenlace(null);
    setPartida({ config, tipo, acto, volver });
  };

  const primeraPartida = () => {
    const mio = perfil.mazos.find((m) => m.id === perfil.mazoActivo) ?? perfil.mazos[0];
    const rival = MAZOS_INICIALES.find((m) => m.id === ESPEJO[perfil.inicial ?? 'rojo'])!;
    cambiar((q) => { q.tutorialVisto = true; });
    jugar({ modo: 'ia', mazos: [{ ...mio, cartas: conShiny(perfil, mio.cartas) }, rival], nombres: [perfil.nombre, rival.lider], humano: 0, nivel: 'novato', semilla: (Math.random() * 2 ** 31) | 0 }, 'tutorial', { p: 'inicio' });
  };

  const jugarActo = (acto: Acto) => {
    const c = perfil.campana!;
    const mio = perfil.mazos.find((m) => m.id === c.mazo)!;
    jugar({ modo: 'ia', mazos: [{ ...mio, cartas: conShiny(perfil, mio.cartas) }, mazoRival(acto.rival)], nombres: [perfil.nombre, acto.lider], humano: 0, nivel: acto.nivel, semilla: (Math.random() * 2 ** 31) | 0 }, 'campana', { p: 'campana' }, acto);
  };

  const alTerminar = useCallback((r: ResultadoPartida) => {
    if (!partida || !r.partida) return;
    const e = r.partida;
    const gano = r.ganador === 0;
    if (partida.tipo === 'campana' && partida.acto) {
      const res = cambiar((q) => {
        const premios = registrarPartida(q, { modo: 'campana', ganador: r.ganador, yo: 0, partida: e });
        const fanfarria = gano ? 'victoria' as const : 'derrota' as const;
        if (!q.campana) return { premios, nota: null, fanfarria };
        return { premios, nota: resolverActo(q.campana, gano), fanfarria };
      });
      setDesenlace(res);
      return;
    }
    const premios = cambiar((q) => registrarPartida(q, { modo: partida.tipo === 'dos' ? 'dos' : 'ia', ganador: r.ganador, yo: 0, partida: e }));
    setDesenlace({ premios, nota: null, fanfarria: gano || (partida.tipo === 'dos' && r.ganador !== null) ? 'victoria' : 'derrota' });
  }, [partida, cambiar]);

  const salirDePartida = () => {
    if (!partida) return;
    // abandonar un acto de campaña a medias cuenta como derrota
    if (!desenlace && partida.tipo === 'campana') cambiar((q) => { if (q.campana?.enCurso) resolverActo(q.campana, false); });
    const volver = partida.volver;
    setPartida(null);
    setDesenlace(null);
    ir(volver);
  };

  if (partida) {
    return (
      <PartidaLocal key={partida.config.semilla} config={partida.config} onFin={alTerminar} onSalir={salirDePartida}
        avisoAbandono={partida.tipo === 'campana' ? 'Abandonar un acto de campaña cuenta como derrota: la provincia se va al rival.' : partida.tipo === 'dos' ? undefined : 'La partida no cuenta si la abandonas.'}
        textoFin={() => desenlace && (
          <div className="extra-fin">
            {desenlace.nota && <p className="serif nota-fin">{desenlace.nota}</p>}
            <ListaRecompensas lista={desenlace.premios} />
          </div>
        )} />
    );
  }

  const comunes = { perfil, cambiar, ir };
  switch (destino.p) {
    case 'inicial': return <ElegirInicial cambiar={cambiar} ir={ir} />;
    case 'tutorial': return <Tutorial ir={ir} onJugar={primeraPartida} />;
    case 'rapida': return <ConfigPartida {...comunes} modo="ia" onJugar={(c) => jugar(c, 'rapida', { p: 'rapida' })} />;
    case 'dos': return <ConfigPartida {...comunes} modo="dos" onJugar={(c) => jugar(c, 'dos', { p: 'dos' })} />;
    case 'online': return <Online {...comunes} />;
    case 'sobres': return <Sobres {...comunes} />;
    case 'album': return <Album {...comunes} />;
    case 'mazos': return <Mazos {...comunes} pestana={destino.tab} />;
    case 'editor': return <EditorMazo key={destino.id ?? 'nuevo'} {...comunes} id={destino.id} />;
    case 'misiones': return <Misiones perfil={perfil} ir={ir} />;
    case 'ajustes': return <Ajustes {...comunes} />;
    case 'ayuda': return <Ayuda ir={ir} />;
    case 'campana': return <Campana {...comunes} onJugar={jugarActo} />;
    default: return <Inicio perfil={perfil} ir={ir} persistente={persistente} cambiar={cambiar} />;
  }
}
