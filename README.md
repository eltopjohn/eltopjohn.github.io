# La página de EL TOP JOHN

Servida con **GitHub Pages** en `https://eltopjohn.github.io/`. Hace dos
trabajos: es lo que manda el botón «Compartir» del juego en vez de la ficha de
una tienda, y es lo que leen los buscadores y los asistentes cuando alguien
pregunta por un juego así. El repo se llama `eltopjohn.github.io` dentro de la
organización `eltopjohn` a propósito: es el único nombre que Pages sirve en la
raíz.

## Por qué existe

Antes, la app compartía el enlace de la tienda del móvil que compartía. Un
iPhone mandaba el de la App Store a un grupo de WhatsApp donde casi todos llevan
Android, y ahí se perdía justo la gente a la que le había gustado el juego. Con
esta página, cada móvil salta a su tienda, y el que no tiene tienda ve la
página.

Lo segundo llegó en octubre de 2026, al mirar de dónde venían las descargas de
MeLaJuego en la App Store: 11 de 40 llegaban desde ChatGPT, sin haber hecho
nada. Un asistente no ordena por valoraciones ni por descargas, que es donde una
app nueva pierde siempre: casa lo que le preguntan con lo que lee. Así que la
página tiene que poder leerse entera sin ejecutar nada, y decir con frases
normales lo que alguien preguntaría.

Es un repo aparte por lo mismo que `eltopjohn-privacy`: Pages gratis solo
publica repos públicos, y el del juego lleva las cartas con sus respuestas.

## Qué hay

| Fichero | Para qué |
| --- | --- |
| `tools/pagina.html` | **La página, y lo que se edita.** Lleva los dos idiomas juntos. |
| `tools/paginas.js` | Saca de ahí todo lo de abajo que pone «generado». |
| `index.html` | Generado. La página en español, con su vista previa. |
| `en/index.html` | Generado. La página en inglés, con la suya. |
| `sitemap.xml`, `robots.txt` | Generados. Para los buscadores. |
| `assets/go.js` | El salto a la tienda, el idioma y de dónde viene la visita. |
| `assets/styles.css` | El tema «neón» del juego. Sin fuentes de fuera. |
| `assets/og-*.jpg` | La imagen de la vista previa (1200 × 630), la misma lámina que el gráfico de Play. |
| `assets/shot-*.jpg` | Tres capturas de tienda, reducidas a 600 px. |
| `tools/imagenes.js` | Rehace las imágenes de `assets/` desde el repo del juego. |
| `987e…2e57.txt` | La clave de IndexNow, para avisar a Bing. Ver «Buscadores y asistentes». |
| `.nojekyll` | Que Pages sirva los ficheros tal cual. |

## Cambiar la página

Se edita `tools/pagina.html` y se rehacen las dos:

```bash
node tools/paginas.js
```

Lo que cambia de un idioma a otro va en **dos elementos seguidos**, uno con
`lang="es"` y otro con `lang="en"`, y cada página se queda con el suyo. Vale
para todo, cabecera incluida. Van pegados por lo mismo que las cartas del juego
llevan su traducción en la línea de debajo: el error caro no es olvidar un
texto, es cruzar dos, y con las dos versiones a la vista eso se ve leyendo.

Hay una página por idioma porque quien lee sin ejecutar nada —la vista previa de
WhatsApp, un buscador, un asistente— se queda con lo que venga escrito. Antes
iban las dos versiones en el mismo `index.html` y se escondía una con CSS: un
buscador leía una página en dos idiomas a la vez, y la inglesa estaba vacía.

El generador no usa nada más que Node, y falla si se queda un elemento con
idioma, una marca `%…%` sin sustituir o unos datos estructurados que no sean
JSON válido.

**Las cartas de muestra son copia** de `src/data/cards/decks/` del juego: cuatro
de las 40 gratis, una por forma de responder, y las mismas que ya salen en las
capturas de las tiendas. Van sin respuestas, como se ven antes de destapar. Si
una cambia en el juego, se cambia aquí.

## Lo que hay que tocar

**1. La dirección, solo si la web se muda.** En este repo se escribe una vez,
`SITE` en `tools/paginas.js`. La otra copia está en `src/services/share.ts` del
juego y viaja dentro del binario: si la web cambia de sitio, la vieja tiene que
seguir viva y redirigir, porque los móviles sin actualizar la seguirán mandando.

**2. `live`, si la app deja de estar en una tienda.** En `assets/go.js`:

```js
ios:     { live: true, ... },
android: { live: true, ... },   // desde el 10 de octubre de 2026
```

Con `false`, nadie salta a esa tienda y su botón se apaga y dice «muy pronto».
No hay que tocar el HTML.

## De dónde viene cada visita

Cualquier enlace que pongamos nosotros lleva `?c=` con el sitio:

```
https://eltopjohn.github.io/?c=reddit
https://eltopjohn.github.io/en/?c=prensa
```

`go.js` se lo pasa a Google Play en `referrer`, y sale en Play Console, en
«Adquisición». Sin `?c=` cuenta como `enlace`, que es el mensaje compartido
desde la app: la dirección que manda el binario va pelada y no se puede cambiar.
Si la visita trae un `utm_source` —ChatGPT se lo pone a los enlaces que cita—,
vale igual.

En la App Store no hay nada parecido que sirva con pocas descargas: App
Analytics solo dice el tipo de fuente (búsqueda, otra app, una web) y no
desglosa una campaña hasta que junta un mínimo.

## Buscadores y asistentes

- **A un robot no se le mueve.** Googlebot y Bingbot leen la página con un
  navegador que se presenta como un móvil Android: con el salto a la tienda tal
  cual, acababan en Google Play y apuntaban la página como una redirección.
  `go.js` los reconoce y los deja donde han entrado.
- **Cada idioma es su página** y se señalan entre sí (`hreflang`).
- **Datos estructurados** en la cabecera: qué es, cuántos juegan, dónde se
  instala y que es gratis.
- **Las preguntas frecuentes** están escritas para que cada respuesta se
  entienda sola, que es como la copia un asistente.

Una página nueva sin nadie que la enlace puede tardar semanas en aparecer. Tras
publicar un cambio que importe:

```bash
curl "https://api.indexnow.org/indexnow?url=https://eltopjohn.github.io/&key=987e18db08a413b70de05e02e2572e57"
curl "https://api.indexnow.org/indexnow?url=https://eltopjohn.github.io/en/&key=987e18db08a413b70de05e02e2572e57"
```

Eso avisa a Bing, que por lo que se ha medido desde fuera es de donde más tira
ChatGPT (OpenAI no lo documenta). Google no lo escucha: ahí hay que dar de alta
la página en Search Console (propiedad de
«prefijo de URL», verificada con la etiqueta `<meta>` que te da, pegada en la
cabecera de `tools/pagina.html`) y mandarle `sitemap.xml`. En Bing Webmaster
Tools se puede importar de Search Console, y es donde se ve si la ha indexado.

## Probarla

```bash
python3 -m http.server 8000
```

Desde un móvil con tienda, la página salta nada más abrirse. Para verla sin que
salte, `?stay`: `http://…/?stay`, o `http://…/en/?stay` para la inglesa. En un
ordenador, `/` pasa a `/en/` si el navegador no está en una lengua de España y
no se ha elegido idioma antes.

La vista previa solo se puede probar publicada. WhatsApp la guarda por enlace:
si cambias la imagen y sigue saliendo la vieja, añade algo al final
(`/?v=2`) para forzar que la vuelva a leer.

## Publicarla

Igual que `eltopjohn-privacy` (su `README.md` trae los pasos uno a uno): subir
el repo, y en `Settings` → `Pages`, *Deploy from a branch*, **main**, carpeta
**/ (root)**.

## Rehacer las imágenes

Cuando cambien las capturas de tienda o el lema:

```bash
node tools/imagenes.js
```

Tira de `../topgame` (o de `GAME=/otra/ruta`) y necesita `playwright-core` con
un Chromium. En la máquina de desarrollo no hay navegador: vale el que monta
`scripts/store-screenshots/setup.sh` del juego, cargando antes su `env.sh`.
