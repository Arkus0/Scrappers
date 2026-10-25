# Ilustraciones de las cartas

Guarda aquí una imagen por carta, con el **id de la carta** como nombre: `B-07.png`, `N-001.jpg`, `S-03.webp`…
(también vale `N-001 Pedro Sánchez.png`: lo que cuenta es el id del principio).

- La lista completa de las 306 cartas, con el prompt de cada una, está en `docs/PROMPTS_IMAGENES.md`
  y en formato máquina en `docs/cartas.json`.
- `npm run ilustraciones` las recorta a 600 × 390, las pasa a WebP y el juego las usa en lugar del arte generado.
  El build de Vercel lo hace solo.
- Sube mejor JPG o WebP que PNG: ocupan mucho menos en el repositorio.
- Normas: sin caras ni parecido de personas reales, sin logotipos de partidos, sin banderas oficiales y sin texto.
