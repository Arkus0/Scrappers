// Aplicación: de momento, portada y partida rápida (la progresión llega en el hito 5).
import { useState } from 'react';
import { MAZOS_INICIALES } from '../datos/mazos-iniciales';
import type { Nivel } from '../ia/bot';
import { PartidaLocal, type ConfigLocal } from './partida/PartidaLocal';

export function App() {
  const [config, setConfig] = useState<ConfigLocal | null>(null);
  const [mazo, setMazo] = useState(0);
  const [rival, setRival] = useState(1);
  const [nivel, setNivel] = useState<Nivel>('normal');
  if (config) return <PartidaLocal key={config.semilla} config={config} onFin={() => {}} onSalir={() => setConfig(null)} />;
  return (
    <main className="pantalla">
      <div className="pantalla-caja portada">
        <div>
          <h1 className="titulo-176">176</h1>
          <p className="subtitulo">¡Hazte con los 176!</p>
          <p className="lema">El juego de cartas de las elecciones del 29N.</p>
        </div>
        <div className="panel">
          <span className="etiqueta">Tu mazo</span>
          <div className="rejilla-botones">{MAZOS_INICIALES.map((m, i) => <button key={m.id} className={`boton ${mazo === i ? 'principal' : ''}`} type="button" onClick={() => setMazo(i)}>{m.nombre}</button>)}</div>
          <span className="etiqueta">Rival</span>
          <div className="rejilla-botones">{MAZOS_INICIALES.map((m, i) => <button key={m.id} className={`boton ${rival === i ? 'principal' : ''}`} type="button" onClick={() => setRival(i)}>{m.nombre}</button>)}</div>
          <span className="etiqueta">Nivel</span>
          <div className="rejilla-botones">{(['novato', 'normal', 'experto'] as Nivel[]).map((n) => <button key={n} className={`boton ${nivel === n ? 'principal' : ''}`} type="button" onClick={() => setNivel(n)}>{n}</button>)}</div>
        </div>
        <div className="menu-principal">
          <button className="boton principal" type="button" onClick={() => setConfig({ modo: 'ia', mazos: [MAZOS_INICIALES[mazo], MAZOS_INICIALES[rival]], nombres: ['Tú', MAZOS_INICIALES[rival].lider], humano: 0, nivel, semilla: Date.now() & 0x7fffffff })}><b>Partida rápida</b><span>Contra la IA</span></button>
          <button className="boton" type="button" onClick={() => setConfig({ modo: 'dos', mazos: [MAZOS_INICIALES[mazo], MAZOS_INICIALES[rival]], nombres: ['Jugador 1', 'Jugador 2'], humano: 0, nivel, semilla: Date.now() & 0x7fffffff })}><b>Dos jugadores</b><span>En este dispositivo</span></button>
        </div>
      </div>
    </main>
  );
}
