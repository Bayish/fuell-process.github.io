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
  }
})();
