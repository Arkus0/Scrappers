# 176 TCG · ¡Hazte con los 176!

Juego de cartas coleccionables sobre las elecciones generales del 29 de noviembre de 2026, spin-off de
«176 · La Batalla del 29N». 306 cartas con políticos, periodistas y asesores reales (y su versión Shiny),
reglas al estilo Pokémon TCG Pocket y mecánicas para mazos de combo, de equipo, de control, de desgaste…

**Parodia sin afiliación** ni respaldo de ningún partido, medio ni persona. Las personas aparecen solo en su faceta
pública, sin caras ni logotipos.

## Modos

- **Campaña del 29N**: 8 semanas sobre el mapa real de las 52 circunscripciones, debates del 16N y el 26N,
  negociación e investidura.
- **Partida rápida** contra la IA (novato, normal, experto).
- **Dos jugadores** en el mismo dispositivo.
- **Online**: sala con código o rival al azar (con IA de guardia si no aparece nadie).
- Progresión: mazo inicial, sobres de 5 cartas (2 gratis al día), Shiny 1/20, álbum, papeletas para fabricar,
  editor de mazos, 16 mazos temáticos, misiones diarias y logros. El progreso se guarda en el navegador y se puede
  llevar a otro dispositivo con un código de copia (Ajustes).

## Desarrollo

```bash
npm install
npm run dev            # juego en http://localhost:5173
npm run dev:servidor   # servidor online en :8080 (Vite le pasa /ws)
npm test               # reglas, cartas, contenido, IA, perfil, sobres, campaña y servidor
npm run simular -- --n 200   # equilibrio de los mazos (IA contra IA)
npm run cartas -- --md --json   # docs/CARTAS.md y docs/cartas.json
```

## Desplegar en Vercel

El juego completo (campaña, IA, dos jugadores, sobres, álbum) es una web estática y funciona en Vercel tal cual:

1. En Vercel, **Add New → Project** e importa este repositorio (rama con el juego).
2. Vercel lee `vercel.json`: instala con `npm ci`, compila con `npm run build:web` y publica `dist/`. No hay que tocar nada más.
3. Opcional, para el modo online: en **Settings → Environment Variables** añade
   `VITE_SERVIDOR = wss://tu-servidor.up.railway.app/ws` y vuelve a desplegar.

Vercel no mantiene conexiones WebSocket abiertas, así que el **servidor del modo online** va aparte. El repositorio
trae `Dockerfile` y `railway.toml` para Railway: crea un proyecto desde el repo, y Railway compila con
`npm run build:servidor` y arranca `node dist-servidor/servidor.mjs` (healthcheck en `/salud`, una sola réplica porque
las salas viven en memoria). Ese mismo servidor también sirve el juego, así que en Railway el online funciona sin
configurar nada.

`npm run build:archivo` genera un único `dist/index.html` que se juega abriéndolo como archivo, sin servidor.

## Ilustraciones

Cada carta trae un arte generado por código. Para ponerle una ilustración propia:

1. La lista de las 306 cartas, con el nombre de archivo que le toca a cada una, está en `docs/cartas.json`
   (y con sus reglas en `docs/CARTAS.md`). `npm run cartas -- --json --md` las vuelve a generar si cambian las cartas.
2. Guarda la imagen en `ilustraciones/` con el id de la carta (`N-001.jpg`, `B-07.png`…), en proporción 20:13.
3. `npm run ilustraciones` (o el propio build) la recorta y la convierte a WebP; si falta alguna, la carta sigue con su arte
   generado.

Normas: nada de caras ni parecido con personas reales, ni logotipos de partidos, ni banderas oficiales, ni texto.
