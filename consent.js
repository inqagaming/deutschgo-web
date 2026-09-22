/*
 * Cookie consent for deutsch-go.com.
 *
 * Nothing that sets cookies loads until the visitor says yes: Google
 * Analytics on every page, and the AppsFlyer smart banner on pages whose
 * <script src="/consent.js"> tag carries data-appsflyer. The choice is kept in
 * localStorage; "Cookie settings" links ([data-consent-open]) reopen the
 * banner. Withdrawing consent reloads the page so the trackers are gone.
 */
(function () {
  var KEY = 'dg-consent';
  var GA_ID = 'G-W44N10VTQL';
  var AF_KEY = '004eb0ab-52e6-4ed5-814a-1c4b01a2ece7';
  var PRIVACY = 'https://inqagaming.github.io/deutschgo-legal/privacy-policy.html';
  var wantsAppsFlyer = !!(document.currentScript && document.currentScript.hasAttribute('data-appsflyer'));

  var TEXT = {
    tr: {
      label: 'Çerez tercihleri',
      body: 'Sitenin nasıl kullanıldığını ölçmek için Google Analytics, uygulama indirme bağlantılarını ölçmek için AppsFlyer kullanıyoruz. İkisi de ancak izin verirsen çerez kullanır.',
      policy: 'Gizlilik Politikası',
      accept: 'Kabul et',
      reject: 'Reddet'
    },
    en: {
      label: 'Cookie preferences',
      body: 'We use Google Analytics to see how the site is used and AppsFlyer to measure app download links. Both set cookies only if you allow it.',
      policy: 'Privacy Policy',
      accept: 'Accept',
      reject: 'Reject'
    }
  };

  function read() {
    try { return localStorage.getItem(KEY); } catch (e) { return null; }
  }
  function write(value) {
    try { localStorage.setItem(KEY, value); } catch (e) { /* private mode: ask again next time */ }
  }
  function lang() {
    return (document.documentElement.lang || 'tr').slice(0, 2) === 'en' ? 'en' : 'tr';
  }

  // ── Trackers ──────────────────────────────────────────────────────────────
  var loaded = false;
  function loadTrackers() {
    if (loaded) return;
    loaded = true;

    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag('js', new Date());
    window.gtag('config', GA_ID);
    var ga = document.createElement('script');
    ga.async = true;
    ga.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA_ID;
    document.head.appendChild(ga);

    if (wantsAppsFlyer) {
      // AppsFlyer's own loader, unchanged apart from running on consent.
      !function(t,e,n,s,a,c,i,o,p){t.AppsFlyerSdkObject=a,t.AF=t.AF||function(){(t.AF.q=t.AF.q||[]).push([Date.now()].concat(Array.prototype.slice.call(arguments)))},t.AF.id=t.AF.id||i,t.AF.plugins={},o=e.createElement(n),p=e.getElementsByTagName(n)[0],o.async=1,o.src="https://websdk.appsflyersdk.com?"+(c.length>0?"st="+c.split(",").sort().join(",")+"&":"")+(i.length>0?"af_id="+i:""),p.parentNode.insertBefore(o,p)}(window,document,"script",0,"AF","banners",{banners: {key: AF_KEY}});
      window.AF('banners', 'showBanner');
    }
  }

  // Store-link clicks, reported only once Analytics is running.
  document.addEventListener('click', function (e) {
    var link = e.target.closest && e.target.closest('a[href*="onelink.me"]');
    if (!link || !loaded || typeof window.gtag !== 'function') return;
    window.gtag('event', 'app_store_click', {
      link_location: link.className || 'unknown',
      link_label: (link.getAttribute('aria-label') || link.textContent || '').trim(),
      page_path: window.location.pathname
    });
  });

  // ── Banner ────────────────────────────────────────────────────────────────
  var banner = null;

  function style() {
    if (document.getElementById('dg-consent-style')) return;
    var css = document.createElement('style');
    css.id = 'dg-consent-style';
    css.textContent =
      '.dg-consent{position:fixed;z-index:1000;left:16px;right:16px;bottom:16px;max-width:520px;' +
      'background:#111418;color:#fff;border-radius:20px;padding:20px 22px;' +
      'box-shadow:0 20px 50px rgba(17,20,24,.28);font-family:Outfit,system-ui,-apple-system,"Segoe UI",sans-serif}' +
      '.dg-consent h2{font-size:1rem;font-weight:700;margin:0 0 6px}' +
      '.dg-consent p{font-size:.92rem;line-height:1.55;color:rgba(255,255,255,.78);margin:0}' +
      '.dg-consent a{color:#5EEAD4;font-weight:600}' +
      '.dg-consent-actions{display:flex;gap:10px;margin-top:16px}' +
      '.dg-consent button{flex:1;font:700 .95rem Outfit,system-ui,sans-serif;border-radius:999px;padding:11px 16px;cursor:pointer;border:2px solid #fff}' +
      '.dg-consent .dg-reject{background:transparent;color:#fff}' +
      '.dg-consent .dg-accept{background:#fff;color:#111418}' +
      '.dg-consent button:focus-visible{outline:3px solid #00D1B2;outline-offset:2px}' +
      '[data-consent-open]{background:none;border:0;padding:0;font:inherit;color:inherit;cursor:pointer;text-decoration:underline;text-underline-offset:3px}';
    document.head.appendChild(css);
  }

  function render() {
    if (!banner) return;
    var t = TEXT[lang()];
    banner.setAttribute('aria-label', t.label);
    banner.querySelector('h2').textContent = t.label;
    var p = banner.querySelector('p');
    p.textContent = t.body + ' ';
    var a = document.createElement('a');
    a.href = PRIVACY;
    a.target = '_blank';
    a.rel = 'noopener';
    a.textContent = t.policy;
    p.appendChild(a);
    banner.querySelector('.dg-reject').textContent = t.reject;
    banner.querySelector('.dg-accept').textContent = t.accept;
  }

  function open() {
    if (banner) return;
    style();
    banner = document.createElement('section');
    banner.className = 'dg-consent';
    banner.setAttribute('role', 'region');
    banner.innerHTML = '<h2></h2><p></p><div class="dg-consent-actions">' +
      '<button type="button" class="dg-reject"></button>' +
      '<button type="button" class="dg-accept"></button></div>';
    render();
    banner.querySelector('.dg-accept').addEventListener('click', function () { decide('granted'); });
    banner.querySelector('.dg-reject').addEventListener('click', function () { decide('denied'); });
    document.body.appendChild(banner);
  }

  function close() {
    if (banner) banner.remove();
    banner = null;
  }

  function decide(value) {
    var before = read();
    write(value);
    close();
    if (value === 'granted') loadTrackers();
    // Scripts already running cannot be unloaded; a reload drops them.
    else if (before === 'granted' || loaded) location.reload();
  }

  // The homepage and blog index switch language in place: keep the banner in step.
  new MutationObserver(render).observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });

  document.addEventListener('click', function (e) {
    var trigger = e.target.closest && e.target.closest('[data-consent-open]');
    if (!trigger) return;
    e.preventDefault();
    open();
  });

  window.dgConsent = { open: open };

  var choice = read();
  if (choice === 'granted') loadTrackers();
  else if (choice !== 'denied') {
    if (document.body) open();
    else document.addEventListener('DOMContentLoaded', open);
  }
})();
