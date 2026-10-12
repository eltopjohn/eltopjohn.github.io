// node tools/paginas.js — hace index.html (español) y en/index.html (inglés)
// desde tools/pagina.html, que lleva los dos idiomas juntos, y de paso
// sitemap.xml y robots.txt. Sin dependencias: Node y nada más.
//
// Hay una página por idioma porque quien la lee sin ejecutar nada —la vista
// previa de WhatsApp, un buscador, un asistente— se queda con lo que venga
// escrito. Antes iban las dos versiones en el mismo fichero y se escondía una
// con CSS: a una persona le daba igual, pero un buscador leía una página en dos
// idiomas a la vez, y la inglesa estaba vacía.
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

// La dirección publicada. En este repo solo se escribe aquí; la otra copia
// viaja dentro de la app (`src/services/share.ts` del juego) y esa ya no se
// puede cambiar: si la web se muda, la vieja tiene que redirigir.
const SITE = 'https://eltopjohn.github.io';

// Cada idioma y su carpeta. La raíz es el español, que es el original.
const PAGES = [
  { lang: 'es', dir: '' },
  { lang: 'en', dir: 'en/' },
];
const LANGS = PAGES.map((p) => p.lang);

// Los que no llevan cierre: se quitan ellos solos, sin buscar dónde acaban.
const VOID = new Set(['meta', 'link', 'img', 'br', 'hr', 'input', 'source']);

/** Dónde acaba el elemento que se abrió justo antes de `start`, contando los anidados. */
function endOf(html, tag, start) {
  const re = new RegExp(`<(/?)${tag}\\b[^>]*>`, 'gi');
  re.lastIndex = start;
  let depth = 1;
  let m;
  while ((m = re.exec(html))) {
    depth += m[1] ? -1 : 1;
    if (depth === 0) return re.lastIndex;
  }
  throw new Error(`Hay un <${tag} lang="…"> sin cerrar en tools/pagina.html`);
}

/** Deja lo de un idioma: quita los elementos marcados con otro y, a los suyos, la marca. */
function only(html, lang) {
  const open = new RegExp(`<([a-z][a-z0-9]*)\\b([^>]*?)\\slang="(${LANGS.join('|')})"([^>]*)>`, 'gi');
  let out = '';
  let from = 0;
  let m;
  while ((m = open.exec(html))) {
    const [, tag, before, tagLang, after] = m;
    out += html.slice(from, m.index);
    if (tagLang === lang) {
      out += `<${tag}${before}${after}>`;
      from = open.lastIndex;
      continue;
    }
    from = VOID.has(tag.toLowerCase()) ? open.lastIndex : endOf(html, tag, open.lastIndex);

    // Si ocupaba su línea entera, la línea se va con él: sangría y salto.
    const indent = m.index - (html.lastIndexOf('\n', m.index - 1) + 1);
    const rest = /^[ \t]*\n/.exec(html.slice(from));
    if (rest && /^[ \t]*$/.test(html.slice(m.index - indent, m.index))) {
      out = out.slice(0, out.length - indent);
      from += rest[0].length;
    }
    open.lastIndex = from;
  }
  return out + html.slice(from);
}

function build(source, page) {
  let html = source
    // Los comentarios son para quien edita la plantilla, no para quien la lee
    // publicada. Y fuera antes que nada: alguno nombra un `lang="…"`.
    .replace(/[ \t]*<!--[\s\S]*?-->\n?/g, '');

  html = only(html, page.lang)
    .replace(/%LANG%/g, page.lang)
    .replace(/%BASE%/g, page.dir ? '../' : './')
    .replace(/%SITE%/g, SITE)
    // Los huecos que deja lo quitado.
    .replace(/\n{3,}/g, '\n\n');

  return html.replace(
    /^<!doctype html>\n/i,
    '<!doctype html>\n<!-- Generado por tools/paginas.js desde tools/pagina.html. No editar aquí. -->\n'
  );
}

/** Lo que no puede salir publicado. Mejor fallar aquí que verlo en un buscador. */
function check(html, page) {
  const where = `${page.dir}index.html`;
  const left = html.match(/%[A-Z]+%/);
  if (left) throw new Error(`${where}: se ha quedado sin sustituir ${left[0]}`);

  const marked = html.replace(/<html\b[^>]*>/i, '').match(new RegExp(`<[^>]*\\slang="(${LANGS.join('|')})"[^>]*>`, 'i'));
  if (marked) throw new Error(`${where}: se ha quedado un elemento con idioma: ${marked[0]}`);

  if ((html.match(/<title\b/gi) || []).length !== 1) throw new Error(`${where}: tiene que haber un <title> y solo uno`);

  for (const m of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
    try {
      JSON.parse(m[1]);
    } catch (e) {
      throw new Error(`${where}: los datos estructurados no son JSON válido (${e.message})`);
    }
  }
}

const url = (page) => `${SITE}/${page.dir}`;

function sitemap() {
  const alternates = PAGES.map((p) => `    <xhtml:link rel="alternate" hreflang="${p.lang}" href="${url(p)}"/>`).join('\n');
  const urls = PAGES.map((p) => `  <url>\n    <loc>${url(p)}</loc>\n${alternates}\n  </url>`).join('\n');
  return (
    '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n' +
    `${urls}\n</urlset>\n`
  );
}

// `tools/` se queda fuera: ahí está la plantilla, que es la página con los dos
// idiomas mezclados y no tiene que aparecer en ningún buscador.
const robots = () => `User-agent: *\nAllow: /\nDisallow: /tools/\n\nSitemap: ${SITE}/sitemap.xml\n`;

function write(file, content) {
  const full = path.join(ROOT, file);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, content);
  console.log(file, `${(Buffer.byteLength(content) / 1024).toFixed(1)} KB`);
}

const source = fs.readFileSync(path.join(__dirname, 'pagina.html'), 'utf8');
for (const page of PAGES) {
  const html = build(source, page);
  check(html, page);
  write(`${page.dir}index.html`, html);
}
write('sitemap.xml', sitemap());
write('robots.txt', robots());
