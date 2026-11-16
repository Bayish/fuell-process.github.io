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
  // reveal on scroll
  var reveal = document.querySelectorAll('[data-reveal]');
  if ('IntersectionObserver' in window && !reduce) {
    var io = new IntersectionObserver(function (en) { en.forEach(function (x) { if (x.isIntersecting) { x.target.classList.add('is-in'); io.unobserve(x.target); } }); }, { rootMargin: '0px 0px -8% 0px' });
    reveal.forEach(function (el) { io.observe(el); });
  } else reveal.forEach(function (el) { el.classList.add('is-in'); });
})();
