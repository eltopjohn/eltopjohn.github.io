/*
 * El enlace único de «Compartir».
 *
 * La app manda esta página, no la ficha de una tienda: quien comparte desde un
 * iPhone escribe a un grupo donde casi todos llevan Android, y el enlace de la
 * App Store los dejaba en una página donde no se puede instalar nada. Aquí
 * cada móvil salta a su tienda, y el que no tiene tienda ve la página.
 *
 * Se carga en la cabecera y sin `defer`, para saltar antes de pintar. La vista
 * previa de WhatsApp no ejecuta JavaScript: lee las etiquetas `og:` y se queda
 * ahí, que es justo lo que hace falta.
 */
(function () {
  /*
   * `live` es el interruptor de cada tienda. Con `false` nadie salta a ella y
   * su botón se apaga y dice «muy pronto»: es lo que se toca si la app deja de
   * estar publicada en una.
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
      live: true,
      url: 'https://play.google.com/store/apps/details?id=com.gestiamigos.eltopjohn',
    },
  };

  var SOON = { es: 'Muy pronto en', en: 'Coming soon to' };

  var root = document.documentElement;
  var params = new URLSearchParams(location.search);
  var ua = navigator.userAgent || '';

  // --- Robots ---
  // Un buscador lee la página con un navegador de verdad que se presenta como
  // un móvil Android (Googlebot y Bingbot lo hacen). Sin esto saltaría a Google
  // Play como cualquier teléfono y apuntaría la página como una redirección: no
  // la indexaría nunca. A un robot no se le mueve de donde ha entrado.
  //
  // `bot/` y no `bot` a secas: hay móviles de marca Cubot, y su dueño sí salta.
  var robot =
    /bot\/|crawler|spider|headlesschrome|lighthouse|google-inspectiontool|googleother|adsbot|bingpreview|chatgpt-user|perplexity-user|claude-user|facebookexternalhit/i.test(ua) ||
    navigator.webdriver === true;

  // --- De dónde viene la visita ---
  // `?c=reddit` en los enlaces que ponemos nosotros, o el `utm_source` que
  // añaden por su cuenta sitios como ChatGPT. Sin nada es un mensaje compartido
  // desde la app, que manda la dirección pelada. Viaja en `referrer`, que es lo
  // que enseña Play Console en «Adquisición»; la App Store no tiene nada
  // parecido que sirva con pocas descargas.
  var channel = (params.get('c') || params.get('utm_source') || '').toLowerCase().replace(/[^a-z0-9._-]/g, '').slice(0, 40) || 'enlace';
  STORES.android.url += '&referrer=' + encodeURIComponent('utm_source=' + channel);

  // El iPad se presenta como un Mac desde iPadOS 13; lo delata la pantalla táctil.
  var os = /Android/i.test(ua)
    ? 'android'
    : /iPhone|iPad|iPod/i.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
      ? 'ios'
      : 'other';

  // Cada idioma es una página: `/` en español y `/en/` en inglés.
  var here = root.getAttribute('lang') === 'en' ? 'en' : 'es';

  // `?stay` deja ver la página desde un móvil que saltaría: para probarla.
  var stay = params.has('stay');

  // --- Contar la visita ---
  // Una cuenta por día, canal, sistema e idioma en la base de datos del juego
  // (`supabase/card_link_hits_schema.sql` de su repo), y nada de quien visita:
  // ni identificador, ni cookie. Es lo que dice de dónde llega la gente cuando
  // la App Store no lo dice. `sendBeacon` y no `fetch`: es lo único que el
  // navegador promete entregar aunque la página ya se haya ido, que es justo lo
  // que pasa cuando un móvil salta a la tienda. La clave es la pública, la
  // misma que viaja dentro de la app.
  var HITS = 'https://skrbslpfkicshybkxfzu.supabase.co/rest/v1/rpc/track_link_hit?apikey=sb_publishable_X8O1pIJ5cRa3i8CM0n2eew_Tk8pQzEF';

  function count(event) {
    // Ni robots ni pruebas: en local se sirve por http, y `?stay` es para mirar.
    if (robot || stay || location.protocol !== 'https:') return;
    try { navigator.sendBeacon(HITS, [channel, os, here, event].join('|')); } catch (e) { /* sin contar no pasa nada */ }
  }

  // `replace` y no `href`, o el botón de atrás devolvería aquí y saltaría otra vez.
  var store = STORES[os];
  var going = !!(store && store.live && !stay && !robot);
  if (going) {
    count('jump');
    location.replace(store.url);
  }

  // --- Idioma ---
  // La página inglesa no mueve a nadie —quien recibe ese enlace lo recibe en
  // inglés—; la española pasa a la inglesa a quien la eligió antes, y a quien no
  // tiene el navegador en una lengua de España. `?lang=en` es como se pedía
  // antes de separarlas.
  var KEY = 'eltopjohn.web.lang';

  function remembered() {
    try { return localStorage.getItem(KEY); } catch (e) { return null; }
  }

  var hopping = false;
  if (here === 'es' && !going && !robot) {
    var asked = params.get('lang');
    var browser = (navigator.language || 'es').slice(0, 2).toLowerCase();
    var guess = ['es', 'ca', 'gl', 'eu'].indexOf(browser) >= 0 ? 'es' : 'en';
    var want = asked === 'es' || asked === 'en' ? asked : remembered() || guess;
    if (want === 'en') {
      // Lo demás de la dirección se conserva: `?stay`, y de dónde viene la visita.
      hopping = true;
      params.delete('lang');
      var rest = params.toString();
      location.replace('en/' + (rest ? '?' + rest : ''));
    }
  }

  // Quien se queda viendo la página. Quien pasa a la inglesa cuenta allí.
  if (!going && !hopping) count('view');

  // --- Lo que necesita el DOM cargado ---
  document.addEventListener('DOMContentLoaded', function () {
    // El enlace que vale es el de aquí, que lleva de dónde viene la visita. Y
    // un `<a>` sin `href` no es un enlace: así se apaga el de una tienda en la
    // que la app no está.
    Array.prototype.forEach.call(document.querySelectorAll('[data-store]'), function (el) {
      var name = el.getAttribute('data-store');
      var s = STORES[name];
      if (!s) return;
      if (s.live) {
        el.setAttribute('href', s.url);
        el.addEventListener('click', function () { count('click_' + name); });
        return;
      }
      el.removeAttribute('href');
      el.classList.add('soon');
      var label = el.querySelector('small');
      if (label) label.textContent = SOON[here];
    });

    Array.prototype.forEach.call(document.querySelectorAll('[data-set-lang]'), function (el) {
      // Para poder probar las dos páginas desde un móvil sin que salte.
      if (stay) el.setAttribute('href', el.getAttribute('href') + '?stay');
      // Lo elegido a mano manda sobre lo que adivine la página la próxima vez.
      el.addEventListener('click', function () {
        try { localStorage.setItem(KEY, el.getAttribute('data-set-lang')); } catch (e) { /* modo privado */ }
      });
    });
  });
})();
