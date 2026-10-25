// Portada: título, aviso de parodia, resumen del perfil y menú.
import { progresoColeccion, type Perfil } from '../../perfil/perfil';
import { escanosDe, SEMANAS } from '../../perfil/campana';
import { MISIONES } from '../../perfil/misiones';
import { Barra, Recursos } from './comun';
import type { Destino } from '../App';

export function Inicio({ perfil: p, ir, persistente }: { perfil: Perfil; ir: (d: Destino) => void; persistente: boolean }) {
  const col = progresoColeccion(p);
  const nuevo = p.inicial === null;
  const misionesPend = p.misiones.lista.filter((m) => !m.cobrada).length;
  const c = p.campana;
  return (
    <main className="pantalla">
      <div className="pantalla-caja portada">
        <div className="portada-titulo">
          <h1 className="titulo-176">176</h1>
          <p className="subtitulo">¡Hazte con los 176!</p>
          <p className="lema">El juego de cartas coleccionables de las generales del 29 de noviembre. Políticos, tertulianos y asesores reales; mazos de combo, de equipo, de control… y Shiny.</p>
        </div>

        {nuevo ? (
          <div className="panel bienvenida">
            <h3>Empieza tu campaña</h3>
            <p className="serif">Elige uno de los cuatro mazos iniciales. Ganando partidas consigues fondos para sobres, desbloqueas la colección Básica y llegas a la Moncloa.</p>
            <button className="boton principal bloque" type="button" data-accion="empezar" onClick={() => ir({ p: 'inicial' })}>Elegir mazo inicial</button>
          </div>
        ) : (
          <div className="panel resumen-perfil">
            <div className="fila-resumen">
              <b className="nombre-perfil">{p.nombre}</b>
              <Recursos p={p} completo />
            </div>
            <div className="fila-resumen tenue">
              <span>Colección {col.tengo}/{col.total} · Shiny {col.shiny}</span>
              <span>{p.stats.victorias} victorias · {p.stats.partidas} partidas</span>
            </div>
            <Barra valor={col.tengo} max={col.total} etiqueta="Colección" />
          </div>
        )}

        {!nuevo && (
          <nav className="menu-principal" aria-label="Menú principal">
            <button className="boton principal" type="button" data-accion="menu-campana" onClick={() => ir({ p: 'campana' })}>
              <b>Campaña del 29N</b>
              <span>{c ? (c.terminada ? 'Ver resultado' : c.semana > SEMANAS ? 'Noche electoral' : `Semana ${c.semana} · ${escanosDe(c, 'yo')} escaños`) : '52 provincias, 8 semanas'}</span>
            </button>
            <button className="boton" type="button" data-accion="menu-rapida" onClick={() => ir({ p: 'rapida' })}><b>Partida rápida</b><span>Contra la IA</span></button>
            <button className="boton" type="button" data-accion="menu-online" onClick={() => ir({ p: 'online' })}><b>Online</b><span>Sala con código o rival al azar</span></button>
            <button className="boton" type="button" data-accion="menu-dos" onClick={() => ir({ p: 'dos' })}><b>Dos jugadores</b><span>Pasando el móvil</span></button>
            <button className="boton" type="button" data-accion="menu-sobres" onClick={() => ir({ p: 'sobres' })}><b>Sobres {p.sobres.gratis > 0 && <span className="globo">{p.sobres.gratis}</span>}</b><span>5 cartas · Shiny 1/20</span></button>
            <button className="boton" type="button" data-accion="menu-album" onClick={() => ir({ p: 'album' })}><b>Álbum</b><span>{col.tengo} de {col.total} cartas</span></button>
            <button className="boton" type="button" data-accion="menu-mazos" onClick={() => ir({ p: 'mazos' })}><b>Mazos</b><span>Editor y mazos temáticos</span></button>
            <button className="boton" type="button" data-accion="menu-misiones" onClick={() => ir({ p: 'misiones' })}><b>Misiones {misionesPend > 0 && <span className="globo">{misionesPend}</span>}</b><span>{MISIONES.length} tipos · logros</span></button>
            <button className="boton" type="button" data-accion="menu-ayuda" onClick={() => ir({ p: 'ayuda' })}><b>Cómo se juega</b><span>Reglas y palabras clave</span></button>
            <button className="boton" type="button" data-accion="menu-ajustes" onClick={() => ir({ p: 'ajustes' })}><b>Ajustes</b><span>Nombre, copia de seguridad</span></button>
          </nav>
        )}

        {!persistente && <p className="aviso">⚠ Este navegador no deja guardar datos: tu progreso se perderá al cerrar. Usa «Ajustes → Copia de seguridad» para llevártelo.</p>}
        <p className="aviso parodia">
          <b>Parodia sin afiliación.</b> Juego satírico y no oficial. Las personas que aparecen son figuras públicas reales representadas solo en su faceta pública, sin caras ni logotipos; las frases de las cartas son declaraciones públicas. Ningún partido, medio ni persona ha participado ni respalda este juego. No hay encuestas ni llamadas al voto.
        </p>
      </div>
    </main>
  );
}
