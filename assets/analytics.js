/* GA4 events + Consent Mode v2 banner for funkeyvillas.com. */
(function () {
  var KEY = 'fv_cookie_consent';
  var RTID = {
    '1': 'Adriatic at Funkey',
    '2': 'Atlantic at Funkey',
    '3': 'Apostle at Funkey',
    '4': 'Atlantic Studio'
  };
  var PATHS = {
    '/rooms/one-bedroom-villa-with-private-pool': 'Adriatic at Funkey',
    '/rooms/two-bedroom-villa-with-private-pool': 'Apostle at Funkey',
    '/rooms/three-bedroom-villa-with-private-pool': 'Atlantic at Funkey',
    '/rooms/standard-studio': 'Atlantic Studio',
    '/pages/istrian-country-villa': 'Villa Afrika',
    '/rooms/4-bedroom-apartment-metropolitan': 'Belgrade Metropolitan'
  };

  function stored() {
    try { return localStorage.getItem(KEY); } catch (e) { return null; }
  }
  function store(v) {
    try { localStorage.setItem(KEY, v); } catch (e) {}
  }
  function gtagFn() {
    return typeof window.gtag === 'function' ? window.gtag : function () {};
  }
  function updateConsent(granted) {
    gtagFn()('consent', 'update', {
      analytics_storage: granted ? 'granted' : 'denied',
      ad_storage: 'denied',
      ad_user_data: 'denied',
      ad_personalization: 'denied'
    });
  }
  function track(name, params) {
    params = params || {};
    gtagFn()('event', name, params);
  }
  function pageVilla() {
    var path = (location.pathname || '/').replace(/\/+$/, '') || '/';
    for (var p in PATHS) if (path === p || path.indexOf(p + '/') === 0) return PATHS[p];
    return '';
  }
  function villaFromHref(href) {
    try {
      var u = new URL(href, location.href);
      var id = u.searchParams.get('rtid');
      if (id) return RTID[id] || id;
    } catch (e) {}
    return pageVilla();
  }
  function villaFromForm(form) {
    var input = form.querySelector('input[name="rtid"]');
    if (input && input.value) return RTID[input.value] || input.value;
    return pageVilla();
  }
  function linkSpot(el) {
    if (el.closest('.mobile-bar')) return 'mobile_bar';
    if (el.closest('.wa-float')) return 'whatsapp_float';
    if (el.closest('.site-header') || el.closest('header')) return 'header';
    if (el.closest('.bookbar')) return 'bookbar';
    if (el.closest('.hero')) return 'hero';
    if (el.closest('.book-card')) return 'book_card';
    if (el.closest('.card-ctas')) return 'villa_card';
    if (el.closest('.cta-band')) return 'cta_band';
    if (el.closest('.site-footer') || el.closest('footer')) return 'footer';
    return 'page';
  }

  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href]');
    if (!a) return;
    var href = a.href || '';
    if (/book\.nightsbridge\.com/i.test(href)) {
      track('book_direct_click', {
        link_url: href,
        villa: villaFromHref(href),
        location: linkSpot(a),
        transport_type: 'beacon'
      });
    } else if (/wa\.me|api\.whatsapp\.com/i.test(href)) {
      track('whatsapp_click', {
        link_url: href,
        location: linkSpot(a),
        transport_type: 'beacon'
      });
    } else if (/^mailto:/i.test(href)) {
      track('email_click', {
        link_url: href,
        location: linkSpot(a),
        transport_type: 'beacon'
      });
    }
  }, true);

  document.addEventListener('submit', function (e) {
    var form = e.target;
    if (!form || form.tagName !== 'FORM') return;
    var action = form.getAttribute('action') || form.action || '';
    if (form.hasAttribute('data-dates') && /nightsbridge\.com|lodgify\.com/i.test(action)) {
      var start = form.querySelector('[data-start], [name="startdate"], [name="arrival"]');
      var end = form.querySelector('[data-end], [name="enddate"], [name="departure"]');
      var params = { villa: villaFromForm(form), transport_type: 'beacon' };
      if (start && start.value) params.check_in = start.value;
      if (end && end.value) params.check_out = end.value;
      track('check_availability_submit', params);
    } else if ((form.classList && form.classList.contains('newsletter')) || /list-manage\.com/i.test(action)) {
      track('newsletter_signup', { transport_type: 'beacon' });
    }
  }, true);

  function css() {
    var s = document.createElement('style');
    s.textContent =
      '.fv-consent{position:fixed;left:16px;right:16px;bottom:16px;z-index:90;display:flex;align-items:center;justify-content:space-between;gap:12px 16px;flex-wrap:wrap;box-sizing:border-box;max-width:920px;margin:0 auto;padding:12px 16px;background:#fff;color:var(--ink,#1e2a36);font-family:var(--sans,"Jost",system-ui,sans-serif);font-size:.92rem;line-height:1.45;border-radius:var(--r,4px);box-shadow:0 12px 36px rgba(15,43,74,.18),0 0 0 1px rgba(15,43,74,.08)}' +
      '.fv-consent p{margin:0;flex:1 1 200px}' +
      '.fv-consent-actions{display:flex;align-items:center;gap:8px;flex:0 0 auto}' +
      '.fv-consent button{font-family:inherit;font-size:.78rem;font-weight:500;letter-spacing:.14em;text-transform:uppercase;line-height:1;border-radius:var(--r,4px);padding:.7rem 1.1rem;min-height:44px;cursor:pointer}' +
      '.fv-consent-accept{background:var(--navy,#1F548F);color:#fff;border:1px solid var(--navy,#1F548F)}' +
      '.fv-consent-accept:hover{background:var(--navy-d,#173f6b)}' +
      '.fv-consent-decline{background:transparent;color:var(--navy,#1F548F);border:1px solid rgba(31,84,143,.35)}' +
      '.fv-consent-decline:hover{background:var(--sand,#F7F3EE)}' +
      '.fv-consent button:focus-visible{outline:2px solid var(--gold,#b08d57);outline-offset:3px}' +
      '@media (max-width:760px){.fv-consent{left:8px;right:8px;bottom:calc(76px + env(safe-area-inset-bottom,0px));padding:10px 12px;font-size:.88rem}}';
    document.head.appendChild(s);
  }

  function showBanner() {
    if (stored() === 'granted' || stored() === 'denied') return;
    css();
    var bar = document.createElement('div');
    bar.className = 'fv-consent';
    bar.setAttribute('role', 'dialog');
    bar.setAttribute('aria-label', 'Cookie consent');
    bar.setAttribute('aria-describedby', 'fv-consent-msg');
    bar.innerHTML =
      '<p id="fv-consent-msg">We use analytics cookies to improve the site.</p>' +
      '<div class="fv-consent-actions">' +
      '<button type="button" class="fv-consent-accept">Accept</button>' +
      '<button type="button" class="fv-consent-decline">Decline</button>' +
      '</div>';
    function finish(granted) {
      store(granted ? 'granted' : 'denied');
      updateConsent(granted);
      if (bar.parentNode) bar.parentNode.removeChild(bar);
    }
    bar.querySelector('.fv-consent-accept').addEventListener('click', function () { finish(true); });
    bar.querySelector('.fv-consent-decline').addEventListener('click', function () { finish(false); });
    (document.body || document.documentElement).appendChild(bar);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', showBanner);
  else showBanner();
})();
