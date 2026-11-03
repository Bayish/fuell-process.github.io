// Cookie / consent banner (same categories and texts as the Complianz banner on the live fuell-process.com).
// The visitor has to choose before using the page. The choice is kept in localStorage ("fpg-consent").
// Other scripts ask:  window.fpgConsent.has('marketing')  and can reopen it with  window.fpgConsent.open().
(function () {
  var KEY = 'fpg-consent', VERSION = 1;
  var root = document.documentElement;
  var lang = (root.lang || 'de').slice(0, 2) === 'en' ? 'en' : 'de';
  var T = {
    de: {
      title: 'Zustimmung verwalten',
      text: 'Um dir ein optimales Erlebnis zu bieten, verwenden wir Technologien wie Cookies, um Geräteinformationen zu speichern und/oder darauf zuzugreifen. Wenn du diesen Technologien zustimmst, können wir Daten wie das Surfverhalten oder eindeutige IDs auf dieser Website verarbeiten. Wenn du deine Zustimmung nicht erteilst oder zurückziehst, können bestimmte Merkmale und Funktionen beeinträchtigt werden.',
      functional: 'Funktional', always: 'Immer aktiv',
      functionalText: 'Die technische Speicherung oder der Zugang ist unbedingt erforderlich für den rechtmäßigen Zweck, die Nutzung eines bestimmten Dienstes zu ermöglichen, der vom Teilnehmer oder Nutzer ausdrücklich gewünscht wird, oder für den alleinigen Zweck, die Übertragung einer Nachricht über ein elektronisches Kommunikationsnetz durchzuführen.',
      statistics: 'Statistiken',
      statisticsText: 'Die technische Speicherung oder der Zugriff, der ausschließlich zu statistischen Zwecken erfolgt.',
      marketing: 'Marketing',
      marketingText: 'Die technische Speicherung oder der Zugriff ist erforderlich, um Nutzerprofile zu erstellen, um Werbung zu versenden oder um den Nutzer auf einer Website oder über mehrere Websites hinweg zu ähnlichen Marketingzwecken zu verfolgen.',
      services: 'Dienste: YouTube (Videos)',
      accept: 'Akzeptieren', deny: 'Ablehnen', prefs: 'Einstellungen ansehen', save: 'Einstellungen speichern',
      cookie: 'Cookie-Richtlinie', imprint: 'Impressum', privacy: 'Datenschutzerklärung', manage: 'Zustimmung verwalten'
    },
    en: {
      title: 'Manage Consent',
      text: 'To provide the best experiences, we use technologies like cookies to store and/or access device information. Consenting to these technologies will allow us to process data such as browsing behavior or unique IDs on this site. Not consenting or withdrawing consent, may adversely affect certain features and functions.',
      functional: 'Functional', always: 'Always active',
      functionalText: 'The technical storage or access is strictly necessary for the legitimate purpose of enabling the use of a specific service explicitly requested by the subscriber or user, or for the sole purpose of carrying out the transmission of a communication over an electronic communications network.',
      statistics: 'Statistics',
      statisticsText: 'The technical storage or access that is used exclusively for statistical purposes.',
      marketing: 'Marketing',
      marketingText: 'The technical storage or access is required to create user profiles to send advertising, or to track the user on a website or across several websites for similar marketing purposes.',
      services: 'Services: YouTube (videos)',
      accept: 'Accept', deny: 'Deny', prefs: 'View preferences', save: 'Save preferences',
      cookie: 'Cookie Policy', imprint: 'Imprint', privacy: 'Privacy policy', manage: 'Manage consent'
    }
  }[lang];

  function read() {
    try {
      var v = JSON.parse(localStorage.getItem(KEY) || 'null');
      return v && v.v === VERSION ? v : null;
    } catch (e) { return null; }
  }
  var state = read();
  var listeners = [];
  function save(statistics, marketing) {
    state = { v: VERSION, statistics: !!statistics, marketing: !!marketing, date: new Date().toISOString() };
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {}
    close();
    listeners.forEach(function (fn) { try { fn(state); } catch (e) {} });
  }

  // Links: reuse the legal links in the page footer, so every version and language points to its own pages
  function linkTo() {
    for (var i = 0; i < arguments.length; i++) {
      var a = document.querySelector('.site-footer a[href*="' + arguments[i] + '"]');
      if (a) return a.getAttribute('href');
    }
    return '#';
  }

  var css = document.createElement('style');
  css.textContent =
    '.fpgc-backdrop{position:fixed;inset:0;z-index:2000;background:rgba(10,14,20,.55);display:flex;align-items:flex-end;justify-content:center;padding:16px}' +
    '@media (min-width:700px){.fpgc-backdrop{align-items:center}}' +
    '.fpgc{width:100%;max-width:560px;max-height:calc(100vh - 32px);overflow:auto;background:#fff;color:#1b1f23;border-radius:14px;box-shadow:0 24px 70px rgba(0,0,0,.35);' +
    'font:15px/1.55 Inter,system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;padding:24px 24px 18px;text-align:left}' +
    '.fpgc h2{margin:0 0 10px;font-size:19px;font-weight:600;letter-spacing:0;text-transform:none;font-family:inherit;color:#1b1f23}' +
    '.fpgc p{margin:0 0 14px;color:#474e55;font-size:14px}' +
    '.fpgc details{border:1px solid #e2dfd8;border-radius:10px;margin:0 0 8px;background:#fafafa}' +
    '.fpgc summary{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:11px 14px;cursor:pointer;list-style:none;font-weight:600;font-size:14px;color:#1b1f23;font-family:inherit;text-transform:none}' +
    '.fpgc summary::-webkit-details-marker{display:none}' +
    '.fpgc details p{padding:0 14px 12px;margin:0;font-size:13px}' +
    '.fpgc .fpgc-always{font-size:12.5px;font-weight:600;color:#2e7d32}' +
    '.fpgc input[type=checkbox]{width:18px;height:18px;accent-color:#043f71;cursor:pointer}' +
    '.fpgc-prefs{display:none;margin-top:6px}.fpgc.show-prefs .fpgc-prefs{display:block}' +
    '.fpgc-buttons{display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin:16px 0 12px}' +
    '.fpgc-buttons button{padding:11px 8px;border-radius:8px;font:600 14px/1.2 Inter,system-ui,sans-serif;cursor:pointer;border:1px solid #043f71;letter-spacing:0;text-transform:none}' +
    '.fpgc .fpgc-primary{background:#043f71;color:#fff}.fpgc .fpgc-secondary{background:#fff;color:#043f71}' +
    '.fpgc button:focus-visible,.fpgc a:focus-visible{outline:3px solid #f5a524;outline-offset:2px}' +
    '.fpgc-links{display:flex;flex-wrap:wrap;gap:6px 16px;font-size:13px}.fpgc-links a{color:#043f71}' +
    '@media (max-width:480px){.fpgc-buttons{grid-template-columns:1fr}}' +
    '.fpgc-manage{background:none;border:0;padding:0;font:inherit;color:inherit;text-decoration:underline;cursor:pointer;opacity:.85}' +
    'html.fpgc-open{overflow:hidden}';
  document.head.appendChild(css);

  var wrap = null;
  function open() {
    if (wrap) return;
    wrap = document.createElement('div');
    wrap.className = 'fpgc-backdrop';
    wrap.innerHTML =
      '<div class="fpgc" role="dialog" aria-modal="true" aria-labelledby="fpgc-title" lang="' + lang + '">' +
        '<h2 id="fpgc-title">' + T.title + '</h2>' +
        '<p>' + T.text + '</p>' +
        '<div class="fpgc-prefs">' +
          '<details><summary>' + T.functional + '<span class="fpgc-always">' + T.always + '</span></summary><p>' + T.functionalText + '</p></details>' +
          '<details><summary>' + T.statistics + '<input type="checkbox" data-cat="statistics" aria-label="' + T.statistics + '"></summary><p>' + T.statisticsText + '</p></details>' +
          '<details><summary>' + T.marketing + '<input type="checkbox" data-cat="marketing" aria-label="' + T.marketing + '"></summary><p>' + T.marketingText + '<br><strong>' + T.services + '</strong></p></details>' +
        '</div>' +
        '<div class="fpgc-buttons">' +
          '<button type="button" class="fpgc-primary" data-act="accept">' + T.accept + '</button>' +
          '<button type="button" class="fpgc-primary" data-act="deny">' + T.deny + '</button>' +
          '<button type="button" class="fpgc-secondary" data-act="prefs">' + T.prefs + '</button>' +
        '</div>' +
        '<div class="fpgc-links">' +
          '<a href="' + linkTo('cookie-policy') + '">' + T.cookie + '</a>' +
          '<a href="' + linkTo('datenschutz', 'data-protection') + '">' + T.privacy + '</a>' +
          '<a href="' + linkTo('impressum', 'imprint') + '">' + T.imprint + '</a>' +
        '</div>' +
      '</div>';
    document.body.appendChild(wrap);
    root.classList.add('fpgc-open');
    var box = wrap.querySelector('.fpgc');
    box.querySelectorAll('input[data-cat]').forEach(function (b) {
      b.checked = !!(state && state[b.getAttribute('data-cat')]);
      b.addEventListener('click', function (e) { e.stopPropagation(); });
    });
    box.addEventListener('click', function (e) {
      var act = e.target.getAttribute && e.target.getAttribute('data-act');
      if (act === 'accept') save(true, true);
      if (act === 'deny') save(false, false);
      if (act === 'prefs') {
        if (!box.classList.contains('show-prefs')) { box.classList.add('show-prefs'); e.target.textContent = T.save; }
        else save(box.querySelector('[data-cat=statistics]').checked, box.querySelector('[data-cat=marketing]').checked);
      }
    });
    // keep keyboard focus inside the dialog
    box.addEventListener('keydown', function (e) {
      if (e.key !== 'Tab') return;
      var f = box.querySelectorAll('button, a, input, summary');
      var first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    });
    box.querySelector('[data-act=accept]').focus();
  }
  function close() {
    if (!wrap) return;
    wrap.remove(); wrap = null;
    root.classList.remove('fpgc-open');
  }

  window.fpgConsent = {
    has: function (cat) { return cat === 'functional' || !!(state && state[cat]); },
    open: open,
    grant: function (cat) {   // e.g. "Accept and play" on a video
      save(cat === 'statistics' || !!(state && state.statistics), cat === 'marketing' || !!(state && state.marketing));
    },
    onChange: function (fn) { listeners.push(fn); }
  };

  function init() {
    // "Zustimmung verwalten" in the footer: the choice can be changed or withdrawn at any time
    var bottom = document.querySelector('.footer-bottom');
    if (bottom && !bottom.querySelector('.fpgc-manage')) {
      var b = document.createElement('button');
      b.type = 'button'; b.className = 'fpgc-manage'; b.textContent = T.manage;
      b.addEventListener('click', open);
      bottom.appendChild(b);
    }
    if (!state) open();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
