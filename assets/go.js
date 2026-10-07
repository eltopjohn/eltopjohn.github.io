/*
 * El enlace único de «Compartir».
 *
 * La app manda esta página, no la ficha de una tienda: quien comparte desde un
 * iPhone escribe a un grupo donde casi todos llevan Android, y el enlace de la
 * App Store los dejaba en una página donde no se puede instalar nada. Aquí
 * cada móvil salta a su tienda, y el que no tiene tienda todavía ve la página.
 *
 * Se carga en la cabecera y sin `defer`, para saltar antes de pintar. La vista
 * previa de WhatsApp no ejecuta JavaScript: lee las etiquetas `og:` y se queda
 * ahí, que es justo lo que hace falta.
 */
(function () {
  /*
   * LO QUE SE TOCA AL PUBLICAR EN UNA TIENDA: `live`. Con `false` nadie salta
   * a esa tienda y su botón sale como «muy pronto». El botón se corrige solo;
   * no hay que tocar el HTML.
   *
   * Los enlaces tienen que cuadrar con `src/services/share.ts` del juego. El
   * de iOS va sin país a propósito: Apple manda a cada uno a su tienda.
   */
  var STORES = {
    ios: {
      live: true,
      url: 'https://apps.apple.com/app/id6809137317',
    },
    android: {
      live: false,
      // `referrer` es lo que enseña Play Console en «Adquisición»: así se sabe
      // cuántas instalaciones vienen de un mensaje compartido.
      url: 'https://play.google.com/store/apps/details?id=com.gestiamigos.eltopjohn&referrer=utm_source%3Denlace',
    },
  };

  var root = document.documentElement;
  var params = new URLSearchParams(location.search);

  // El iPad se presenta como un Mac desde iPadOS 13; lo delata la pantalla táctil.
  var ua = navigator.userAgent || '';
  var os = /Android/i.test(ua)
    ? 'android'
    : /iPhone|iPad|iPod/i.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
      ? 'ios'
      : 'other';
  root.setAttribute('data-os', os);
  if (STORES.ios.live) root.setAttribute('data-live-ios', '');
  if (STORES.android.live) root.setAttribute('data-live-android', '');

  // `?stay` deja ver la página desde un móvil que saltaría: para probarla.
  // `replace` y no `href`, o el botón de atrás devolvería aquí y saltaría otra vez.
  var store = STORES[os];
  if (store && store.live && !params.has('stay')) {
    window.ELTOPJOHN_GOING = true;
    location.replace(store.url);
  }

  // --- Idioma ---
  // Las dos versiones van en el mismo fichero, como en la web de privacidad y
  // como las cartas. Español para quien tenga el móvil en una lengua de España
  // o en español; inglés para el resto.
  var KEY = 'eltopjohn.web.lang';

  function remembered() {
    try { return localStorage.getItem(KEY); } catch (e) { return null; }
  }

  function applyLang(lang, remember) {
    root.setAttribute('data-lang', lang);
    root.setAttribute('lang', lang);

    var title = document.querySelector('title');
    if (title && title.getAttribute('data-' + lang)) document.title = title.getAttribute('data-' + lang);

    Array.prototype.forEach.call(document.querySelectorAll('.langs button'), function (b) {
      b.setAttribute('aria-pressed', String(b.getAttribute('data-set-lang') === lang));
    });

    if (remember) {
      try { localStorage.setItem(KEY, lang); } catch (e) { /* modo privado */ }
    }
  }

  var browser = (navigator.language || 'es').slice(0, 2).toLowerCase();
  var guess = ['es', 'ca', 'gl', 'eu'].indexOf(browser) >= 0 ? 'es' : 'en';
  var lang = params.get('lang') || remembered() || guess;
  lang = lang === 'en' ? 'en' : 'es';
  root.setAttribute('data-lang', lang);
  root.setAttribute('lang', lang);

  // --- Lo que necesita el DOM cargado ---
  document.addEventListener('DOMContentLoaded', function () {
    applyLang(lang, false);

    // Un `<a>` sin `href` no es un enlace: así el mismo elemento vale para
    // «descárgalo» y para «muy pronto», y manda `live`, no lo escrito en el HTML.
    Array.prototype.forEach.call(document.querySelectorAll('[data-store]'), function (el) {
      var s = STORES[el.getAttribute('data-store')];
      if (!s) return;
      if (s.live) {
        el.setAttribute('href', s.url);
        el.classList.remove('soon');
      } else {
        el.removeAttribute('href');
        el.classList.add('soon');
      }
    });

    document.addEventListener('click', function (ev) {
      var btn = ev.target.closest ? ev.target.closest('.langs button') : null;
      if (btn) applyLang(btn.getAttribute('data-set-lang'), true);
    });
  });
})();
