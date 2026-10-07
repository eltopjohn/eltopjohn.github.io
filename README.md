# El enlace de «Compartir» de EL TOP JOHN

Una sola página, servida con **GitHub Pages** en `https://eltopjohn.github.io/`,
que es lo que manda el botón «Compartir» del juego en vez de la ficha de una
tienda. El repo se llama `eltopjohn.github.io` dentro de la organización
`eltopjohn` a propósito: es el único nombre que Pages sirve en la raíz.

## Por qué existe

Antes, la app compartía el enlace de la tienda del móvil que compartía. Un
iPhone mandaba el de la App Store a un grupo de WhatsApp donde casi todos llevan
Android, y ahí se perdía justo la gente a la que le había gustado el juego. Con
esta página, cada móvil salta a su tienda; y el que todavía no tiene tienda ve
la página, que le dice que llega pronto y que con un iPhone en la mesa basta.

Es un repo aparte por lo mismo que `eltopjohn-privacy`: Pages gratis solo
publica repos públicos, y el del juego lleva las cartas con sus respuestas.

## Qué hay

| Fichero | Para qué |
| --- | --- |
| `index.html` | La página, en español e inglés dentro del mismo fichero. Da la vista previa en español. |
| `en/index.html` | Sin cuerpo: solo da la **vista previa en inglés** y salta a la tienda o a `/?lang=en`. |
| `assets/go.js` | El salto a la tienda, el idioma y el estado de los botones. **Lo que se toca.** |
| `assets/styles.css` | El tema «neón» del juego. Sin fuentes de fuera. |
| `assets/og-*.jpg` | La imagen de la vista previa (1200 × 630), la misma lámina que el gráfico de Play. |
| `assets/shot-*.jpg` | Tres capturas de tienda, reducidas a 600 px. |
| `tools/imagenes.js` | Rehace las imágenes de `assets/` desde el repo del juego. |
| `.nojekyll` | Que Pages sirva los ficheros tal cual. |

## Lo que hay que tocar

**1. La dirección, solo si la web se muda.** La vista previa necesita la
dirección entera de la imagen, así que `https://eltopjohn.github.io` va escrita
en las dos páginas, y también en `src/services/share.ts` del juego. Esa última
viaja dentro del binario: si la web cambia de sitio, la vieja tiene que seguir
viva y redirigir, porque los móviles sin actualizar la seguirán mandando.

**2. `live`, cada vez que se publica en una tienda.** En `assets/go.js`:

```js
ios:     { live: true,  ... },
android: { live: false, ... },   // → true el día que salga en Google Play
```

Con `false`, nadie salta a esa tienda y su botón dice «muy pronto». No hay que
tocar el HTML: el botón y el aviso para los de Android se corrigen solos.

Los enlaces de las tiendas tienen que cuadrar con `src/services/share.ts` del
juego.

## Probarla

```bash
python3 -m http.server 8000
```

Desde un móvil con tienda, la página salta nada más abrirse. Para verla sin que
salte, `?stay`: `http://…/?stay`, o `http://…/en/?stay` para la inglesa.

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
