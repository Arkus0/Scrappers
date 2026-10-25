// Nombres de rarezas, clases y palabras clave (sin React, para usarlos también desde scripts).
import type { Carta as TCarta, Clave } from '../motor/tipos';

export const RAREZA_TXT: Record<TCarta['rareza'], string> = { C: '◆', I: '◆◆', R: '◆◆◆', CL: 'CL', E: '★', S: '♛' };
export const RAREZA_NOMBRE: Record<TCarta['rareza'], string> = { C: 'Común', I: 'Infrecuente', R: 'Rara', CL: 'Cabeza de lista', E: 'Especial', S: 'Corona' };
export const CLASE_TXT: Record<TCarta['clase'], string> = { politico: 'Político', tertuliano: 'Tertuliano', asesor: 'Asesor', recurso: 'Recurso', herramienta: 'Herramienta', escenario: 'Escenario', maniobra: 'Maniobra' };
export const CLAVE_TXT: Record<Clave, string> = {
  disciplina: 'Disciplina', coalicion: 'Coalición', mitin: 'Mitin', legado: 'Legado', combo: 'Combo', portavoz: 'Portavoz', aforado: 'Aforado',
  cordon: 'Cordón sanitario', viral: 'Viral', remontada: 'Remontada', caos: 'Caos', fichaje: 'Fichaje', bulo: 'Bulo', negociar: 'Negociar',
  unica: 'Única', leyenda: 'Leyenda', sinFondos: 'Sin fondos', clima: 'Clima',
};
export const CLAVE_AYUDA: Record<Clave, string> = {
  disciplina: 'Gana fuerza por cada aliado de su mismo partido en juego.',
  coalicion: 'Mejora si tienes en juego políticos de varios tipos distintos.',
  mitin: 'Su efecto se dispara al bajarlo al banquillo o al ascenderlo.',
  legado: 'Su efecto se dispara cuando cae derribado.',
  combo: 'Mejora si ya has jugado otra carta este turno.',
  portavoz: 'Su Carisma también funciona desde el banquillo.',
  aforado: 'Los Recursos y las Noticias del rival no le afectan.',
  cordon: 'No pueden forzarle a subir a la tribuna ni dañarle en el banquillo.',
  viral: 'Cuando derriba a alguien con un ataque, robas una carta.',
  remontada: 'Mejora si vas por detrás en escaños.',
  caos: 'Monedas y efectos que golpean a los dos lados.',
  fichaje: 'Cambió de partido: cuenta como sus dos tipos.',
  bulo: 'Pone desgaste directo que no depende de la debilidad y alcanza el banquillo.',
  negociar: 'Suma Apoyos para la Votación de investidura.',
  unica: 'Solo puede haber una copia en el mazo.',
  leyenda: 'Su Carisma solo funciona si tu mazo cumple su condición.',
  sinFondos: 'Juega con dejar al rival sin cartas en el mazo.',
  clima: 'Cambia el Clima de campaña.',
};

