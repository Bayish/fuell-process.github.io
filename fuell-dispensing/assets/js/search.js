// Search in the header: Ratgeber and Glossar of the page language (index /search/<lang>.json, built with the site).
// No library: words are normalised (case, accents, ä = ae …), matched as whole word, prefix, part of a compound word or with
// one typo, and weighted – title before headings and definition before body text. Results show a highlighted excerpt.
(function () {
  var btn = document.querySelector('.header__search');
  if (!btn) return;
  var L = JSON.parse(btn.getAttribute('data-labels'));
  var src = btn.getAttribute('data-src'), base = src.slice(0, src.indexOf('search/'));   // '/' – or the GitHub preview folder
  var docs = null, loading = null, dlg, input, list, status, hits = [], active = -1, lastFocus, timer;

  // ---------------------------------------------------------------- text helpers
  function norm(s) {
    return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/ß/g, 'ss').replace(/ı/g, 'i')
      .replace(/ae/g, 'a').replace(/oe/g, 'o').replace(/ue/g, 'u');   // Rührwerk = ruehrwerk = ruhrwerk
  }
  var WORD = /[\p{L}\p{N}]+/gu;
  function words(s) { return (s.match(WORD) || []).map(norm); }
  function uniq(a) { var o = {}, r = []; a.forEach(function (w) { if (!o[w]) { o[w] = 1; r.push(w); } }); return r; }
  function lev1(a, b) {                       // true when a and b differ by one typo: one letter wrong, missing, extra or two swapped
    if (Math.abs(a.length - b.length) > 1) return false;
    if (a.length === b.length) {                // two neighbouring letters swapped (retrofti → retrofit)
      for (var s = 0; s < a.length - 1; s++) if (a[s] !== b[s]) { if (a[s] === b[s + 1] && a[s + 1] === b[s] && a.slice(s + 2) === b.slice(s + 2)) return true; break; }
    }
    var i = 0, j = 0, d = 0;
    while (i < a.length && j < b.length) {
      if (a[i] === b[j]) { i++; j++; continue; }
      if (++d > 1) return false;
      if (a.length > b.length) i++; else if (b.length > a.length) j++; else { i++; j++; }
    }
    return d + (a.length - i) + (b.length - j) <= 1;
  }
  function match(w, q) {                      // 3 whole word · 2 beginning · 1 inside a compound word or one typo · 0 no
    if (w === q) return 3;
    if (w.indexOf(q) === 0) return 2;
    if (q.length >= 4 && w.indexOf(q) > 0) return 1;
    if (q.length >= 5 && (lev1(w, q) || lev1(w.slice(0, q.length), q))) return 1;
    return 0;
  }
  function best(list, q) { var b = 0, n = 0; for (var i = 0; i < list.length; i++) { var m = match(list[i], q); if (m) { n++; if (m > b) b = m; } } return [b, n]; }

  // ---------------------------------------------------------------- index
  function load() {
    if (docs) return Promise.resolve(docs);
    if (!loading) loading = fetch(src).then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); }).then(function (d) {
      docs = d.items.map(function (it) {
        return { it: it, t: uniq(words(it.t)), tn: norm(it.t), h: uniq(words(it.h.join(' '))), d: uniq(words(it.d + ' ' + it.c)), x: uniq(words(it.x)) };
      });
      return docs;
    });
    return loading;
  }
  function search(q) {
    var qs = uniq(words(q).filter(function (w) { return w.length >= 2; }));
    if (!qs.length) return null;
    var phrase = norm(q.trim()), out = [];
    docs.forEach(function (d) {
      var score = 0;
      for (var i = 0; i < qs.length; i++) {
        var t = best(d.t, qs[i]), h = best(d.h, qs[i]), de = best(d.d, qs[i]), x = best(d.x, qs[i]);
        if (!t[0] && !h[0] && !de[0] && !x[0]) return;          // every word has to occur somewhere
        score += 10 * t[0] + 5 * h[0] + 4 * de[0] + 1.5 * x[0] + Math.min(x[1], 6) * 0.5;
      }
      if (d.tn === phrase) score += 60;                         // exact name of a glossary term / article comes first
      else if (d.tn.indexOf(phrase) >= 0) score += 12;
      out.push({ d: d, score: score });
    });
    out.sort(function (a, b) { return b.score - a.score; });
    return { qs: qs, list: out.slice(0, 12) };
  }

  // ---------------------------------------------------------------- excerpt with highlighted words (built as DOM, never as HTML)
  function isHit(nw, qs) { return qs.some(function (q) { return match(nw, q) >= (q.length >= 4 ? 1 : 2); }); }
  function marked(text, qs, el) {
    var last = 0, m; WORD.lastIndex = 0;
    while ((m = WORD.exec(text))) {
      if (!isHit(norm(m[0]), qs)) continue;
      if (m.index > last) el.appendChild(document.createTextNode(text.slice(last, m.index)));
      var mk = document.createElement('mark'); mk.textContent = m[0]; el.appendChild(mk);
      last = m.index + m[0].length;
    }
    if (last < text.length) el.appendChild(document.createTextNode(text.slice(last)));
    return el;
  }
  function excerpt(it, qs) {
    var fields = [it.d, it.x];
    for (var f = 0; f < fields.length; f++) {
      var text = fields[f], m; WORD.lastIndex = 0;
      while ((m = WORD.exec(text))) {
        if (!isHit(norm(m[0]), qs)) continue;
        var a = Math.max(0, m.index - 70), b = Math.min(text.length, m.index + 150);
        if (a > 0) a = text.indexOf(' ', a) + 1;
        if (b < text.length) b = text.lastIndexOf(' ', b);
        return (a > 0 ? '… ' : '') + text.slice(a, b) + (b < text.length ? ' …' : '');
      }
    }
    return it.d.length > 200 ? it.d.slice(0, it.d.lastIndexOf(' ', 200)) + ' …' : it.d;
  }

  // ---------------------------------------------------------------- dialog
  function build() {
    dlg = document.createElement('div');
    dlg.className = 'search'; dlg.hidden = true;
    dlg.innerHTML = '<div class="search__panel" role="dialog" aria-modal="true" aria-labelledby="search-title">'
      + '<h2 class="vh" id="search-title"></h2>'
      + '<div class="search__bar"><svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="11" cy="11" r="7" stroke="currentColor" stroke-width="2"/><path d="m16.5 16.5 4 4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>'
      + '<input type="search" autocomplete="off" spellcheck="false" aria-controls="search-results">'
      + '<button type="button" class="search__close"><span aria-hidden="true">Esc</span></button></div>'
      + '<p class="search__status" role="status" aria-live="polite"></p>'
      + '<ul class="search__results" id="search-results"></ul></div>';
    document.body.appendChild(dlg);
    dlg.querySelector('#search-title').textContent = L.open;
    input = dlg.querySelector('input'); list = dlg.querySelector('ul'); status = dlg.querySelector('.search__status');
    input.placeholder = L.placeholder; input.setAttribute('aria-label', L.placeholder);
    var close = dlg.querySelector('.search__close'); close.setAttribute('aria-label', L.close); close.title = L.close;
    close.addEventListener('click', hide);
    dlg.addEventListener('mousedown', function (ev) { if (ev.target === dlg) hide(); });
    input.addEventListener('input', function () { clearTimeout(timer); timer = setTimeout(run, 80); });
    dlg.addEventListener('keydown', function (ev) {
      if (ev.key === 'Escape') { ev.preventDefault(); hide(); }
      else if (ev.key === 'ArrowDown' || ev.key === 'ArrowUp') { ev.preventDefault(); move(ev.key === 'ArrowDown' ? 1 : -1); }
      else if (ev.key === 'Enter' && document.activeElement === input && hits.length) { ev.preventDefault(); location.href = hits[Math.max(0, active)].href; }
      else if (ev.key === 'Tab') {                           // keep the focus inside the dialog
        var f = [input, close].concat(hits), i = f.indexOf(document.activeElement);
        ev.preventDefault(); f[(i + (ev.shiftKey ? -1 : 1) + f.length) % f.length].focus();
      }
    });
  }
  function select(i) {
    active = i;
    hits.forEach(function (h, k) { h.classList.toggle('is-active', k === active); h.setAttribute('aria-selected', String(k === active)); });
    if (hits[active]) hits[active].scrollIntoView({ block: 'nearest' });
  }
  function move(step) { if (hits.length) select((active + step + hits.length) % hits.length); }
  function run() {
    var q = input.value;
    load().then(function () {
      if (q !== input.value) return;
      var r = search(q);
      list.replaceChildren(); hits = []; active = -1;
      if (!r) { status.textContent = L.hint; return; }
      if (!r.list.length) { status.textContent = L.none; return; }
      status.textContent = L.count.replace('{n}', r.list.length);
      r.list.forEach(function (x, i) {
        var it = x.d.it, li = document.createElement('li'), a = document.createElement('a');
        a.className = 'search__hit'; a.href = base + it.u.slice(1); a.setAttribute('aria-selected', 'false');
        var k = document.createElement('span'); k.className = 'search__kind search__kind--' + it.k; k.textContent = L[it.k];
        var t = marked(it.t, r.qs, document.createElement('strong'));
        var p = marked(excerpt(it, r.qs), r.qs, document.createElement('span')); p.className = 'search__text';
        a.append(k, t, p); li.appendChild(a); list.appendChild(li); hits.push(a);
        a.addEventListener('mousemove', function () { if (active !== i) select(i); });
      });
      select(0);
    }).catch(function () { status.textContent = L.error; });
  }
  function show() {
    if (!dlg) build();
    lastFocus = document.activeElement;
    dlg.hidden = false; document.documentElement.classList.add('search-open');
    input.focus(); input.select();
    status.textContent = input.value ? '' : L.hint;
    load().then(function () { if (input.value) run(); }).catch(function () { status.textContent = L.error; });
  }
  function hide() {
    dlg.hidden = true; document.documentElement.classList.remove('search-open');
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }
  btn.addEventListener('click', show);
  document.addEventListener('keydown', function (ev) {        // "/" or Ctrl/Cmd + K opens the search
    var tag = (ev.target.tagName || '').toLowerCase(), typing = tag === 'input' || tag === 'textarea' || tag === 'select' || ev.target.isContentEditable;
    if ((ev.key === '/' && !typing) || ((ev.ctrlKey || ev.metaKey) && ev.key.toLowerCase() === 'k')) {
      if (dlg && !dlg.hidden) return;
      ev.preventDefault(); show();
    }
  });
})();
