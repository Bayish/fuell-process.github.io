// Füll Systembau start page – small progressive enhancements; the page works without JS.
(function () {
  var root = document.documentElement, burger = document.querySelector('.burger');
  // header shadow on scroll
  function onScroll() { root.classList.toggle('is-scrolled', window.scrollY > 10); }
  onScroll(); window.addEventListener('scroll', onScroll, { passive: true });
  // mobile menu
  if (burger) {
    burger.addEventListener('click', function () {
      var open = !root.classList.contains('nav-open');
      root.classList.toggle('nav-open', open); burger.setAttribute('aria-expanded', String(open));
    });
  }
  // dropdowns: the chevron button opens a submenu (accordion on mobile, click/keyboard on desktop); Escape and outside clicks close it
  var items = document.querySelectorAll('.menu__item');
  function closeAll(except) { items.forEach(function (li) { if (li !== except) { li.classList.remove('open'); li.querySelector('.menu__toggle').setAttribute('aria-expanded', 'false'); } }); }
  items.forEach(function (li) {
    var btn = li.querySelector('.menu__toggle');
    btn.addEventListener('click', function () {
      var open = !li.classList.contains('open');
      if (window.matchMedia('(min-width: 1081px)').matches) closeAll(li);
      li.classList.toggle('open', open); btn.setAttribute('aria-expanded', String(open));
    });
    // span headings (no own page) open their submenu too
    var top = li.querySelector('span.menu__top');
    if (top) top.addEventListener('click', function () { btn.click(); });
  });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') { closeAll(); if (burger && root.classList.contains('nav-open')) { root.classList.remove('nav-open'); burger.setAttribute('aria-expanded', 'false'); burger.focus(); } } });
  document.addEventListener('click', function (e) { if (!e.target.closest('.menu')) { if (window.matchMedia('(min-width: 1081px)').matches) closeAll(); } });
  // close the language list when clicking elsewhere
  document.addEventListener('click', function (e) { var d = document.querySelector('.langs[open]'); if (d && !d.contains(e.target)) d.removeAttribute('open'); });
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var saveData = navigator.connection && navigator.connection.saveData;
  // hero video: loaded only when visible, not with reduced motion / data saver
  var v = document.querySelector('.hero__video');
  if (v && !reduce && !saveData && 'IntersectionObserver' in window) {
    new IntersectionObserver(function (en, io) {
      if (en[0].isIntersecting) { v.src = v.getAttribute('data-src'); v.play().catch(function () {}); io.disconnect(); }
    }).observe(v);
  }
  // videos: YouTube is loaded only after a click (privacy-friendly youtube-nocookie.com)
  document.querySelectorAll('[data-yt]').forEach(function (b) {
    b.addEventListener('click', function () {
      var f = document.createElement('iframe');
      f.src = 'https://www.youtube-nocookie.com/embed/' + b.getAttribute('data-yt') + '?autoplay=1&rel=0';
      f.title = b.getAttribute('data-title');
      f.allow = 'accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture; fullscreen';
      f.allowFullscreen = true;
      b.parentNode.replaceChild(f, b);
    });
  });
  // reveal on scroll: elements marked in the HTML plus the building blocks of the sub-pages (added here, staggered per parent)
  var AUTO = '.head, .kn-prose > h2, .kn-table, .kn-cta, .pg-card, .kn-card, .pg-facts li, .pg-split__text, .pg-timeline li, .pg-dl, .pg-video, ' +
             '.kn-term, .qa, .pg-logos__group, .pg-chips li, .pg-contact__card, .pg-quote, .kn-letter h2';
  if (!reduce) {
    document.querySelectorAll(AUTO).forEach(function (el) {
      if (el.hasAttribute('data-reveal') || el.closest('[data-reveal]')) return;
      if (el.getBoundingClientRect().top < window.innerHeight * 0.92) return;      // already visible at load: no flash
      var sib = Array.prototype.indexOf.call(el.parentNode.children, el);
      el.setAttribute('data-reveal', '');
      el.style.setProperty('--d', (Math.min(sib, 6) * 0.08).toFixed(2) + 's');
    });
    document.querySelectorAll('.pg-split__media, .case__media').forEach(function (el, i) {
      if (!el.hasAttribute('data-reveal') && el.getBoundingClientRect().top > window.innerHeight * 0.92) el.setAttribute('data-reveal', i % 2 ? 'left' : 'right');
    });
  }
  // count up numbers in key figures when they come into view (integers only, years excluded)
  function countUp(el) {
    var m = el.textContent.match(/^(\D*?)(\d{1,3}(?:[.\u202f\u00a0 ,]\d{3})*|\d+)(.*)$/);
    if (!m) return;
    var raw = m[2], sep = (raw.match(/[.\u202f\u00a0 ,]/) || [''])[0], target = parseInt(raw.replace(/\D/g, ''), 10);
    if (target < 10 || (target >= 1900 && target <= 2100 && !sep)) return;
    var start = null, dur = 1400;
    function fmt(n) { var s = String(n); return sep ? s.replace(/\B(?=(\d{3})+(?!\d))/g, sep) : s; }
    function step(t) { if (!start) start = t; var k = Math.min((t - start) / dur, 1), v = Math.round(target * (1 - Math.pow(1 - k, 3)));
      el.textContent = m[1] + fmt(v) + m[3]; if (k < 1) requestAnimationFrame(step); }
    requestAnimationFrame(step);
  }
  var counters = reduce ? [] : document.querySelectorAll('[data-count], .proof strong, .pg-facts strong');
  // reveal + counters
  var revealEls = document.querySelectorAll('[data-reveal]');
  if ('IntersectionObserver' in window && !reduce) {
    var io = new IntersectionObserver(function (en) { en.forEach(function (x) { if (x.isIntersecting) { x.target.classList.add('is-in'); io.unobserve(x.target); } }); }, { rootMargin: '0px 0px -8% 0px' });
    revealEls.forEach(function (el) { io.observe(el); });
    var co = new IntersectionObserver(function (en) { en.forEach(function (x) { if (x.isIntersecting) { countUp(x.target); co.unobserve(x.target); } }); }, { threshold: 0.6 });
    counters.forEach(function (el) { co.observe(el); });
  } else revealEls.forEach(function (el) { el.classList.add('is-in'); });
  // scroll progress bar + gentle hero parallax
  if (!reduce) {
    var bar = document.createElement('div'); bar.className = 'scroll-progress'; bar.setAttribute('aria-hidden', 'true'); document.body.appendChild(bar);
    var hv = document.querySelector('.hero__video'), ticking = false;
    function onFrame() {
      var h = document.documentElement.scrollHeight - window.innerHeight;
      bar.style.transform = 'scaleX(' + (h > 0 ? Math.min(window.scrollY / h, 1) : 0) + ')';
      if (hv && window.scrollY < window.innerHeight) hv.style.transform = 'translate3d(0,' + (window.scrollY * 0.28).toFixed(1) + 'px,0) scale(1.06)';
      ticking = false;
    }
    window.addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(onFrame); } }, { passive: true });
    onFrame();
  }
})();

// Contact form: time stamp for the bot check (the form also works without it) + show the reason on the error page
(function () {
  var ts = document.querySelector('.cf input[name="ts"]');
  if (ts) ts.value = String(Date.now());
  var reason = new URLSearchParams(location.search).get('grund');
  if (reason) {
    var el = document.querySelector('.cf-reason[data-grund="' + reason.replace(/[^a-z]/g, '') + '"]');
    if (el) el.hidden = false;
    (new URLSearchParams(location.search).get('feld') || '').split(',').forEach(function (f) {   // which fields were wrong
      var li = f && document.querySelector('.cf-fields li[data-feld="' + f.replace(/[^a-z0-9]/g, '') + '"]');
      if (li) li.hidden = false;
    });
  }
})();

// Forms (contact + application): our own checks with clear messages at the wrong field, in the page language. The server checks the
// same rules (services/form/src/app.ts). With JavaScript the form is sent in the background – if the server still rejects something,
// the message appears in the form and nothing typed is lost. Without JavaScript the browser checks the HTML rules and the server pages are used.
(function () {
  var EMAIL = /^[^\s@<>"']{1,64}@[^\s@<>"']+\.[A-Za-z]{2,24}$/, PHONE = /^[0-9+()\/ .-]*$/, NUMBER = /^\d{1,6}([.,]\d{1,2})?$/, MB = 1024 * 1024;
  Array.prototype.forEach.call(document.querySelectorAll('form.cf[data-msg]'), function (form) {
    var M, L = null;
    try { M = JSON.parse(form.getAttribute('data-msg')); if (form.dataset.limits) L = JSON.parse(form.dataset.limits); } catch (e) { return; }
    form.noValidate = true;
    form.dataset.checked = '1';                                    // the GitHub preview leaves the form to this script (see site-tools/build_preview.py)
    var fmt = function (s, v) { return String(s || M.invalid).replace(/\{(\w+)\}/g, function (_, k) { return v && v[k] != null ? v[k] : ''; }); };
    var mb = function (n) { return (n / MB).toLocaleString(document.documentElement.lang || 'de', { maximumFractionDigits: 1 }); };
    var summary = document.createElement('div');
    summary.className = 'cf__summary'; summary.setAttribute('role', 'alert'); summary.tabIndex = -1; summary.hidden = true;
    form.insertBefore(summary, form.firstChild);

    // one "unit" per question: its box (.cf__f / fieldset / consent line), the controls and the field name
    var units = Array.prototype.map.call(form.querySelectorAll('.cf__f, .cf__consent'), function (box) {
      var ctl = box.querySelectorAll('input, select, textarea');
      return { box: box, ctl: ctl, name: ctl.length ? ctl[0].name : '' };
    }).filter(function (u) { return u.name && u.name !== 'website'; });
    var byName = function (n) { return units.filter(function (u) { return u.name === n; })[0]; };
    function label(u) {
      var l = u.box.querySelector('legend, label');
      return l ? l.textContent.replace(/\s*\*\s*$/, '').replace(/\s+/g, ' ').trim().slice(0, 80) : u.name;
    }

    // rules – sync; files are checked separately (reading the first bytes is async)
    function check(u) {
      var c = u.ctl[0], v = c.type === 'file' ? '' : String(c.value || '').trim();
      if (u.name === 'name') return v.length < 2 ? M.nameShort : '';
      if (u.name === 'email') return !v ? M.emailEmpty : !EMAIL.test(v) ? M.emailBad : '';
      if (u.name === 'phone') return v && !PHONE.test(v) ? M.phoneBad : '';
      if (u.name === 'consent') return c.checked ? '' : M.consent;
      if (u.name === 'message' && c.hasAttribute('minlength')) return v.length < 10 ? fmt(M.messageShort, { n: 10 - v.length }) : '';
      if (c.type === 'checkbox' || c.type === 'radio') {
        var any = Array.prototype.some.call(u.ctl, function (x) { return x.checked; });
        return !any && (u.box.dataset.required || c.required) ? M.choose || M.required : '';
      }
      if (c.type === 'number') {
        if (c.validity && c.validity.badInput) return M.number;
        if (v && !NUMBER.test(v)) return M.number;
      }
      if (c.required && !v) return c.tagName === 'SELECT' ? M.choose || M.required : M.required;
      return '';
    }
    function pdfHead(f) {                                          // a real PDF starts with "%PDF" (a renamed Word file does not)
      if (!f.slice || !window.Response) return Promise.resolve(/\.pdf$/i.test(f.name));
      return new Response(f.slice(0, 4)).text().then(function (t) { return t === '%PDF'; }).catch(function () { return true; });
    }
    function checkFiles() {                                        // → { unitName: message }
      var out = {}, cv = byName('cv'), more = byName('files');
      if (!cv || !L) return Promise.resolve(out);
      var cvFiles = Array.prototype.slice.call(cv.ctl[0].files || []), extra = more ? Array.prototype.slice.call(more.ctl[0].files || []) : [];
      if (!cvFiles.length) out.cv = M.cv;
      if (extra.length > L.maxFiles - 1) out.files = fmt(M.anzahl, { max: L.maxFiles - 1, n: extra.length });
      var all = cvFiles.map(function (f) { return ['cv', f]; }).concat(extra.map(function (f) { return ['files', f]; }));
      all.forEach(function (x) { if (!out[x[0]] && x[1].size > L.maxFileMb * MB) out[x[0]] = fmt(M.groesse, { file: x[1].name, size: mb(x[1].size), max: L.maxFileMb }); });
      var total = all.reduce(function (n, x) { return n + x[1].size; }, 0);
      if (!out.files && !out.cv && total > L.maxTotalMb * MB) out[extra.length ? 'files' : 'cv'] = fmt(M.gesamt, { size: mb(total), max: L.maxTotalMb });
      return Promise.all(all.map(function (x) { return pdfHead(x[1]); })).then(function (ok) {
        ok.forEach(function (good, i) { var x = all[i]; if (!good && !out[x[0]]) out[x[0]] = fmt(M.pdf, { file: x[1].name }); });
        return out;
      });
    }

    function mark(u, msg) {
      var err = u.box.querySelector('.cf__err');
      if (!msg) {
        if (err) err.remove();
        u.box.classList.remove('cf__f--err');
        Array.prototype.forEach.call(u.ctl, function (c) { c.removeAttribute('aria-invalid'); });
        return;
      }
      if (!err) { err = document.createElement('span'); err.className = 'cf__err'; err.id = 'err-' + u.name; u.box.appendChild(err); }
      err.textContent = msg;
      u.box.classList.add('cf__f--err');
      Array.prototype.forEach.call(u.ctl, function (c) {
        c.setAttribute('aria-invalid', 'true');
        var d = (c.getAttribute('aria-describedby') || '').split(' ').filter(Boolean);
        if (d.indexOf(err.id) < 0) { d.push(err.id); c.setAttribute('aria-describedby', d.join(' ')); }
      });
    }
    function showSummary(list, text) {                              // list: [unit, message] – links jump to the field
      summary.replaceChildren();
      if (!list.length && !text) { summary.hidden = true; return; }
      var p = document.createElement('strong'); p.textContent = text || M.summary; summary.appendChild(p);
      if (list.length) {
        var ul = document.createElement('ul');
        list.forEach(function (x) {
          var li = document.createElement('li'), a = document.createElement('a');
          a.href = '#' + (x[0].ctl[0].id || ''); a.textContent = (x[0].name === 'consent' ? '' : label(x[0]) + ': ') + x[1];   // consent: the long sentence is not repeated
          a.onclick = function (ev) { ev.preventDefault(); x[0].ctl[0].focus(); };
          li.appendChild(a); ul.appendChild(li);
        });
        summary.appendChild(ul);
      }
      summary.hidden = false;
    }
    function checkAll() {
      return checkFiles().then(function (files) {
        var list = [];
        units.forEach(function (u) {
          var msg = files.hasOwnProperty(u.name) ? files[u.name] : u.ctl[0].type === 'file' ? '' : check(u);
          mark(u, msg); if (msg) list.push([u, msg]);
        });
        return list;
      });
    }
    function fail(list, text) {
      showSummary(list, text);
      if (list.length) { list[0][0].ctl[0].focus(); list[0][0].box.scrollIntoView({ block: 'center' }); }
      else { summary.focus(); summary.scrollIntoView({ block: 'center' }); }
    }

    // while correcting: a marked field is checked again at once; a filled field is checked when leaving it. When the field is left by a
    // mouse click, the message waits until the click is over – otherwise the page would shift under the pointer and the click miss.
    var pointerDown = false, later = null;
    document.addEventListener('pointerdown', function () { pointerDown = true; }, true);
    document.addEventListener('pointerup', function () { pointerDown = false; if (later) { var f = later; later = null; setTimeout(f, 0); } }, true);
    var recheck = function (ev) {
      var u = units.filter(function (x) { return x.box.contains(ev.target); })[0];
      if (!u) return;
      if (u.ctl[0].type === 'file') { checkFiles().then(function (f) { mark(byName('cv'), f.cv || ''); if (byName('files')) mark(byName('files'), f.files || ''); }); return; }
      var run = function () { mark(u, check(u)); if (!form.querySelector('.cf__f--err')) showSummary([]); };
      if (u.box.classList.contains('cf__f--err')) run();
      else if (ev.type === 'focusout' && String(ev.target.value || '').trim() && ev.target.type !== 'checkbox' && ev.target.type !== 'radio') { if (pointerDown) later = run; else run(); }
    };
    form.addEventListener('input', recheck); form.addEventListener('change', recheck); form.addEventListener('focusout', recheck);

    var busy = false, btn = form.querySelector('button[type="submit"]'), btnHtml = btn ? btn.innerHTML : '';
    form.addEventListener('submit', function (ev) {
      ev.preventDefault();
      if (busy) return;
      busy = true;
      checkAll().then(function (list) {
        if (list.length) { busy = false; summary.classList.remove('cf__summary--ok'); return fail(list); }
        showSummary([]);
        if (form.dataset.preview) { busy = false; summary.classList.add('cf__summary--ok'); return fail([], form.dataset.preview); }   // preview copy: no server
        summary.classList.remove('cf__summary--ok');
        if (btn) { btn.disabled = true; btn.textContent = M.sending; }
        return fetch(form.action, { method: 'POST', body: new FormData(form), credentials: 'same-origin' }).then(function (r) {
          var url = new URL(r.url || location.href), q = url.searchParams, why = q.get('grund');
          if (r.ok && r.redirected && !why) { location.href = url.pathname; return; }      // thank-you page
          var fields = (q.get('feld') || '').split(',').filter(Boolean), bad = [];
          if (why === 'eingabe') fields.forEach(function (n) { var u = byName(n); if (u) { var m = check(u) || M.invalid; mark(u, m); bad.push([u, m]); } });
          if (why === 'datei') {
            var u = byName(fields[0] === 'anzahl' ? 'files' : 'cv') || byName('cv'), k = fields[0] || 'pdf';
            var m = fmt(M[k + 'Any'] || M[k], { max: k === 'anzahl' ? L.maxFiles - 1 : k === 'gesamt' || k === 'gesamtAny' ? L.maxTotalMb : L.maxFileMb, n: '' });
            if (u) { mark(u, m); bad.push([u, m]); }
          }
          fail(bad, bad.length ? '' : M[why] || M.versand);
        });
      }).catch(function () { fail([], M.network); }).then(function () {
        busy = false;
        if (btn && document.contains(btn) && !/^\/(.*\/)?(danke|thank-you|merci|gracias|tesekkurler)\/$/.test(location.pathname)) { btn.disabled = false; btn.innerHTML = btnHtml; }
      });
    });
  });
})();
