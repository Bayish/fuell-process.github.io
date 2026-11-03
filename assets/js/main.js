// Füll Process Group – progressive enhancements. Every page works fully without JS.
(function () {
  var root = document.documentElement;
  var header = document.querySelector('.site-header');
  var toggle = document.querySelector('.nav-toggle');
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Header background once the page is scrolled
  function onScroll() {
    root.classList.toggle('is-scrolled', window.scrollY > 24);
  }
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  // Mobile navigation
  if (toggle && header) {
    toggle.addEventListener('click', function () {
      var open = !root.classList.contains('nav-open');
      root.classList.toggle('nav-open', open);
      toggle.setAttribute('aria-expanded', String(open));
    });
    header.querySelectorAll('.nav-mobile a').forEach(function (link) {
      link.addEventListener('click', function () {
        root.classList.remove('nav-open');
        toggle.setAttribute('aria-expanded', 'false');
      });
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && root.classList.contains('nav-open')) {
        root.classList.remove('nav-open');
        toggle.setAttribute('aria-expanded', 'false');
        toggle.focus();
      }
    });
  }

  // Count-up numbers (the final value is already in the HTML for crawlers)
  function countUp(el) {
    var target = parseInt(el.getAttribute('data-count'), 10);
    if (reduceMotion || !target) return;
    var start = performance.now();
    var duration = 1600;
    function step(now) {
      var p = Math.min((now - start) / duration, 1);
      var eased = 1 - Math.pow(1 - p, 4);
      el.textContent = String(Math.round(target * eased));
      if (p < 1) requestAnimationFrame(step);
    }
    el.textContent = '0';
    requestAnimationFrame(step);
  }

  // Reveal on scroll. Anything above the bottom of the viewport is shown, so a fast
  // scroll or an anchor jump never leaves blocks hidden.
  var pending = Array.prototype.slice.call(document.querySelectorAll('[data-reveal]'));
  var ticking = false;

  function reveal() {
    ticking = false;
    var limit = window.innerHeight * 0.94;
    pending = pending.filter(function (el) {
      if (el.getBoundingClientRect().top < limit) {
        el.classList.add('is-visible');
        el.querySelectorAll('[data-count]').forEach(countUp);
        return false;
      }
      return true;
    });
    if (!pending.length) {
      window.removeEventListener('scroll', onRevealScroll);
      window.removeEventListener('resize', onRevealScroll);
    }
  }
  function onRevealScroll() {
    if (!ticking) {
      ticking = true;
      window.requestAnimationFrame(reveal);
    }
  }
  window.addEventListener('scroll', onRevealScroll, { passive: true });
  window.addEventListener('resize', onRevealScroll);
  reveal();

  // Click-to-load YouTube (youtube-nocookie). Nothing is requested from Google before the click.
  document.querySelectorAll('[data-yt]').forEach(function (link) {
    link.addEventListener('click', function (e) {
      e.preventDefault();
      var frame = document.createElement('iframe');
      frame.src = 'https://www.youtube-nocookie.com/embed/' + link.getAttribute('data-yt') + '?autoplay=1&rel=0&modestbranding=1';
      frame.title = link.getAttribute('data-title') || 'Video';
      frame.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen';
      frame.allowFullscreen = true;
      link.replaceWith(frame);
    });
  });

  // Background videos: loaded lazily, played only while visible.
  // Reduced motion or data saver keeps the poster image only.
  var saveData = navigator.connection && navigator.connection.saveData;
  var bgVideos = document.querySelectorAll('video[data-bg]');
  if (bgVideos.length && !reduceMotion && !saveData && 'IntersectionObserver' in window) {
    var videoObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        var v = entry.target;
        if (entry.isIntersecting) {
          if (!v.dataset.loaded) {
            v.querySelectorAll('source[data-src]').forEach(function (s) { s.src = s.getAttribute('data-src'); });
            v.load();
            v.dataset.loaded = '1';
          }
          var p = v.play();
          if (p && p.catch) p.catch(function () {});
        } else {
          v.pause();
        }
      });
    }, { rootMargin: '200px 0px' });
    bgVideos.forEach(function (v) { v.muted = true; videoObserver.observe(v); });
  }

  // Text scramble (decorative copies only; the real text stays in the DOM)
  var GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789/#%&*+-=';
  function scramble(el) {
    var final = el.getAttribute('data-scramble') || el.textContent;
    if (reduceMotion) { el.textContent = final; return; }
    var frame = 0, total = 28;
    (function tick() {
      var out = '';
      for (var i = 0; i < final.length; i++) {
        var ch = final[i];
        out += (ch === ' ' || ch === '.' || frame / total > i / final.length + 0.15) ? ch : GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
      }
      el.textContent = out;
      if (frame++ < total + 4) requestAnimationFrame(tick); else el.textContent = final;
    })();
  }
  var scrambleEls = document.querySelectorAll('[data-scramble]');
  if (scrambleEls.length) {
    if ('IntersectionObserver' in window) {
      var scrambleObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) { scramble(entry.target); scrambleObserver.unobserve(entry.target); }
        });
      }, { threshold: 0.4 });
      scrambleEls.forEach(function (el) { scrambleObserver.observe(el); });
    } else {
      scrambleEls.forEach(scramble);
    }
  }

  // Words light up while a statement scrolls through the viewport
  document.querySelectorAll('[data-highlight]').forEach(function (el) {
    var words = el.textContent.trim().split(/\s+/);
    el.setAttribute('aria-label', el.textContent.trim());
    el.innerHTML = words.map(function (w) { return '<span aria-hidden="true">' + w + '</span>'; }).join(' ');
    var spans = el.querySelectorAll('span');
    if (reduceMotion) { spans.forEach(function (s) { s.classList.add('on'); }); return; }
    var queued = false;
    function update() {
      queued = false;
      var r = el.getBoundingClientRect();
      var progress = (window.innerHeight * 0.85 - r.top) / (r.height + window.innerHeight * 0.35);
      var lit = Math.round(Math.max(0, Math.min(1, progress)) * spans.length);
      spans.forEach(function (s, i) { s.classList.toggle('on', i < lit); });
    }
    window.addEventListener('scroll', function () { if (!queued) { queued = true; requestAnimationFrame(update); } }, { passive: true });
    update();
  });

  // Tabs with auto-rotation and a progress bar
  document.querySelectorAll('[data-tabs]').forEach(function (wrap) {
    var tabs = Array.prototype.slice.call(wrap.querySelectorAll('[role="tab"]'));
    var panels = tabs.map(function (t) { return document.getElementById(t.getAttribute('aria-controls')); });
    var current = 0, timer = 0, paused = false, DURATION = 7000;
    function select(i, focus) {
      current = (i + tabs.length) % tabs.length;
      tabs.forEach(function (t, k) {
        var on = k === current;
        t.setAttribute('aria-selected', String(on));
        t.tabIndex = on ? 0 : -1;
        panels[k].hidden = !on;
        t.classList.remove('run');
      });
      if (focus) tabs[current].focus();
      if (!reduceMotion && !paused) { void tabs[current].offsetWidth; tabs[current].classList.add('run'); }
      clearTimeout(timer);
      if (!reduceMotion && !paused) timer = setTimeout(function () { select(current + 1); }, DURATION);
    }
    tabs.forEach(function (t, i) {
      t.addEventListener('click', function () { paused = true; select(i); });
      t.addEventListener('keydown', function (e) {
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { e.preventDefault(); paused = true; select(current + 1, true); }
        if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { e.preventDefault(); paused = true; select(current - 1, true); }
      });
    });
    wrap.addEventListener('mouseenter', function () { paused = true; clearTimeout(timer); tabs[current].classList.remove('run'); });
    select(0);
  });

  // Smooth scrolling: eased mouse-wheel scrolling plus smooth anchor jumps.
  // Touch, keyboard and scrollbar keep their native behaviour; reduced motion disables it.
  var finePointer = window.matchMedia('(pointer: fine)').matches;
  var scroller = { target: window.scrollY, current: window.scrollY, raf: 0, running: false };

  function maxScroll() { return document.documentElement.scrollHeight - window.innerHeight; }
  function headerOffset() { return parseFloat(getComputedStyle(root).scrollPaddingTop) || 0; }

  function runScroll() {
    scroller.current += (scroller.target - scroller.current) * 0.1;
    if (Math.abs(scroller.target - scroller.current) < 0.5) scroller.current = scroller.target;
    window.scrollTo(0, scroller.current);
    if (scroller.current !== scroller.target) scroller.raf = requestAnimationFrame(runScroll);
    else scroller.running = false;
  }
  function scrollToY(y) {
    scroller.target = Math.max(0, Math.min(maxScroll(), y));
    if (!scroller.running) { scroller.running = true; scroller.current = window.scrollY; scroller.raf = requestAnimationFrame(runScroll); }
  }

  if (!reduceMotion) {
    root.style.scrollBehavior = 'auto';   // JS takes over from CSS smooth scrolling

    if (finePointer) {
      window.addEventListener('wheel', function (e) {
        if (e.ctrlKey || e.defaultPrevented || Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;
        // Let inner scroll areas (mobile menu, horizontal rows, embedded frames) scroll natively
        for (var el = e.target instanceof Element ? e.target : null; el && el !== document.body; el = el.parentElement) {
          var cs = getComputedStyle(el);
          if (/(auto|scroll)/.test(cs.overflowY) && el.scrollHeight > el.clientHeight) return;
        }
        e.preventDefault();
        var delta = e.deltaMode === 1 ? e.deltaY * 32 : e.deltaMode === 2 ? e.deltaY * window.innerHeight : e.deltaY;
        if (!scroller.running) scroller.target = window.scrollY;
        scrollToY(scroller.target + delta);
      }, { passive: false });

      // Keep in sync when the user drags the scrollbar or uses the keyboard
      window.addEventListener('scroll', function () {
        if (!scroller.running) { scroller.target = scroller.current = window.scrollY; }
      }, { passive: true });
    }

    // Smooth anchor jumps on every device, with an ease-in-out curve
    document.addEventListener('click', function (e) {
      var link = e.target.closest && e.target.closest('a[href^="#"]');
      if (!link || e.metaKey || e.ctrlKey || e.shiftKey) return;
      var id = decodeURIComponent(link.getAttribute('href').slice(1));
      var target = id ? document.getElementById(id) : null;
      if (!target) return;
      e.preventDefault();
      cancelAnimationFrame(scroller.raf); scroller.running = false;
      var start = window.scrollY;
      var end = Math.max(0, Math.min(maxScroll(), target.getBoundingClientRect().top + start - headerOffset()));
      var dist = end - start, t0 = performance.now();
      var dur = Math.min(1400, 500 + Math.abs(dist) * 0.25);
      (function step(now) {
        var p = Math.min((now - t0) / dur, 1);
        var eased = p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;
        window.scrollTo(0, start + dist * eased);
        if (p < 1) requestAnimationFrame(step);
        else { scroller.target = scroller.current = window.scrollY; history.replaceState(null, '', '#' + id); target.focus({ preventScroll: true }); }
      })(t0);
    });

    // Gentle parallax on hero media
    var parallax = document.querySelectorAll('.hero__media, .m-hero__video, .r-hero__video, .v-hero__video, .hero__grid');
    if (parallax.length) {
      var pQueued = false;
      var applyParallax = function () {
        pQueued = false;
        var y = window.scrollY;
        if (y > window.innerHeight * 1.2) return;
        parallax.forEach(function (el) { el.style.transform = 'translate3d(0,' + (y * 0.28).toFixed(1) + 'px,0)'; });
      };
      window.addEventListener('scroll', function () { if (!pQueued) { pQueued = true; requestAnimationFrame(applyParallax); } }, { passive: true });
    }
  }

  // FAQ accordions: animated open and close (works with native <details>)
  document.querySelectorAll('.faq details').forEach(function (d) {
    var summary = d.querySelector('summary');
    var body = summary && summary.nextElementSibling;
    if (!summary || !body || reduceMotion || !d.animate) return;
    var anim = null, bodyAnim = null;
    function done() {
      if (bodyAnim) { bodyAnim.cancel(); bodyAnim = null; }
      anim = null;
      d.style.overflow = '';
      d.classList.remove('is-opening', 'is-closing');
    }
    summary.addEventListener('click', function (e) {
      e.preventDefault();
      var closing = d.classList.contains('is-closing');
      var startH = d.offsetHeight;
      if (anim) anim.cancel();
      if (bodyAnim) { bodyAnim.cancel(); bodyAnim = null; }
      d.classList.remove('is-opening', 'is-closing');
      d.style.overflow = 'hidden';
      if (!d.open || closing) {
        d.open = true;
        d.classList.add('is-opening');
        var endH = d.offsetHeight;
        anim = d.animate({ height: [startH + 'px', endH + 'px'] }, { duration: 420, easing: 'cubic-bezier(.2,.7,.2,1)' });
        bodyAnim = body.animate({ opacity: [0, 1], transform: ['translateY(-8px)', 'none'] }, { duration: 420, easing: 'ease-out' });
        anim.onfinish = done;
      } else {
        d.classList.add('is-closing');
        var endH2 = summary.offsetHeight;
        anim = d.animate({ height: [startH + 'px', endH2 + 'px'] }, { duration: 340, easing: 'cubic-bezier(.4,0,.2,1)' });
        bodyAnim = body.animate({ opacity: [1, 0] }, { duration: 220, easing: 'ease-in', fill: 'forwards' });
        anim.onfinish = function () { d.open = false; done(); };
      }
    });
  });

  // Product slider: native horizontal scroll with snap, arrow buttons, progress bar and mouse drag
  document.querySelectorAll('[data-slider]').forEach(function (track) {
    var wrap = track.closest('[data-slider-wrap]') || document;
    var prev = wrap.querySelector('[data-slider-prev]');
    var next = wrap.querySelector('[data-slider-next]');
    var bar = wrap.querySelector('[data-slider-progress]');
    function step() {
      var card = track.querySelector(':scope > *');
      return card ? card.getBoundingClientRect().width + 16 : track.clientWidth * 0.8;
    }
    function update() {
      var max = track.scrollWidth - track.clientWidth;
      var p = max > 0 ? track.scrollLeft / max : 1;
      if (bar) bar.style.transform = 'scaleX(' + Math.max(0.08, Math.min(1, track.clientWidth / track.scrollWidth + p * (1 - track.clientWidth / track.scrollWidth))).toFixed(3) + ')';
      if (prev) prev.disabled = track.scrollLeft < 4;
      if (next) next.disabled = track.scrollLeft > max - 4;
    }
    if (prev) prev.addEventListener('click', function () { track.scrollBy({ left: -step(), behavior: reduceMotion ? 'auto' : 'smooth' }); });
    if (next) next.addEventListener('click', function () { track.scrollBy({ left: step(), behavior: reduceMotion ? 'auto' : 'smooth' }); });
    track.addEventListener('scroll', function () { requestAnimationFrame(update); }, { passive: true });
    window.addEventListener('resize', update);
    track.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight') { e.preventDefault(); next && next.click(); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); prev && prev.click(); }
    });

    // Drag with the mouse (touch keeps native swiping)
    var down = false, startX = 0, startLeft = 0, moved = 0;
    track.addEventListener('pointerdown', function (e) {
      if (e.pointerType !== 'mouse' || e.button !== 0) return;
      down = true; moved = 0; startX = e.clientX; startLeft = track.scrollLeft;
      track.classList.add('is-dragging');
    });
    window.addEventListener('pointermove', function (e) {
      if (!down) return;
      var dx = e.clientX - startX; moved = Math.max(moved, Math.abs(dx));
      track.scrollLeft = startLeft - dx;
    });
    window.addEventListener('pointerup', function () {
      if (!down) return;
      down = false; track.classList.remove('is-dragging');
    });
    // A drag must not open the link under the pointer
    track.addEventListener('click', function (e) { if (moved > 6) { e.preventDefault(); moved = 0; } }, true);
    track.addEventListener('dragstart', function (e) { e.preventDefault(); });
    update();
  });

  // Hero animation: a schematic point-cloud dosing plant
  var canvas = document.getElementById('plant');
  if (canvas && canvas.getContext) initPlant(canvas);

  function initPlant(canvas) {
    var ctx = canvas.getContext('2d');
    var weightEl = document.querySelector('[data-hud-weight]');
    var compEl = document.querySelector('[data-hud-comp]');
    var W = 0, H = 0, F = 1;
    var D = 15;               // camera distance
    var PITCH = 0.42;         // looking slightly down
    var mouseX = 0, yawOffset = 0;

    var pts = [];             // static point cloud {x,y,z,k}
    var segs = [];            // static line segments [[x,y,z],[x,y,z]]
    var tanks = [-3.4, 0, 3.4];
    var TZ = -1.7;            // tank row depth
    var CX = 0, CZ = 2.1;     // container / scale position

    function ring(cx, cy, cz, r, n, k) {
      for (var i = 0; i < n; i++) {
        var a = i / n * Math.PI * 2;
        pts.push({ x: cx + Math.cos(a) * r, y: cy, z: cz + Math.sin(a) * r, k: k });
      }
    }
    function box(cx, cy, cz, w, h, d) {
      var x0 = cx - w / 2, x1 = cx + w / 2, y0 = cy - h / 2, y1 = cy + h / 2, z0 = cz - d / 2, z1 = cz + d / 2;
      var c = [[x0, y0, z0], [x1, y0, z0], [x1, y1, z0], [x0, y1, z0], [x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1]];
      [[0, 1], [1, 2], [2, 3], [3, 0], [4, 5], [5, 6], [6, 7], [7, 4], [0, 4], [1, 5], [2, 6], [3, 7]].forEach(function (e) {
        segs.push([c[e[0]], c[e[1]]]);
      });
    }

    // Floor grid
    for (var gx = -6.5; gx <= 6.5; gx += 0.5) for (var gz = -4.5; gz <= 4.5; gz += 0.5) pts.push({ x: gx, y: 0, z: gz, k: 0 });

    // Tanks: cylinder, domed roof, conical bottom, legs
    tanks.forEach(function (cx) {
      for (var y = 1.1; y <= 3.7; y += 0.16) ring(cx, y, TZ, 1.0, 34, 1);
      for (var j = 1; j <= 5; j++) {
        var t = j / 6 * Math.PI / 2;
        ring(cx, 3.7 + 0.45 * Math.sin(t), TZ, Math.cos(t), Math.max(6, Math.round(34 * Math.cos(t))), 1);
      }
      for (var c = 1; c <= 4; c++) ring(cx, 1.1 - 0.4 * c / 4, TZ, 1.0 * (1 - c / 4.6), Math.max(6, Math.round(34 * (1 - c / 4.6))), 1);
      [[0.72, 0.72], [-0.72, 0.72], [0.72, -0.72], [-0.72, -0.72]].forEach(function (l) {
        segs.push([[cx + l[0], 0, TZ + l[1]], [cx + l[0], 1.2, TZ + l[1]]]);
      });
    });

    // Gantry, dosing head, scale and container
    box(CX, 3.0, CZ, 1.1, 0.45, 0.75);                       // dosing head
    segs.push([[CX - 1.5, 0, CZ - 0.6], [CX - 1.5, 3.6, CZ - 0.6]], [[CX + 1.5, 0, CZ - 0.6], [CX + 1.5, 3.6, CZ - 0.6]]);
    segs.push([[CX - 1.5, 3.6, CZ - 0.6], [CX + 1.5, 3.6, CZ - 0.6]], [[CX, 3.6, CZ - 0.6], [CX, 3.25, CZ]]);
    box(CX, 0.16, CZ, 1.4, 0.32, 1.1);                       // weighing platform
    for (var cy = 0.36; cy <= 1.16; cy += 0.1) ring(CX, cy, CZ, 0.45, 24, 2);

    // Pipes from each tank outlet to the dosing head
    var pipes = tanks.map(function (cx, i) {
      var off = (i - 1) * 0.16;
      return [
        [cx, 0.7, TZ], [cx, 0.45, TZ], [cx, 0.45, 0.55], [off, 0.45, 0.55],
        [off, 3.95, 0.55], [off, 3.95, CZ], [off, 3.25, CZ]
      ];
    });
    var pipeLen = pipes.map(function (p) {
      var L = [0];
      for (var i = 1; i < p.length; i++) {
        var a = p[i - 1], b = p[i];
        L.push(L[i - 1] + Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]));
      }
      return L;
    });
    function along(pi, s) {
      var p = pipes[pi], L = pipeLen[pi], d = s * L[L.length - 1];
      for (var i = 1; i < p.length; i++) {
        if (d <= L[i]) {
          var f = (d - L[i - 1]) / (L[i] - L[i - 1] || 1), a = p[i - 1], b = p[i];
          return [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f, a[2] + (b[2] - a[2]) * f];
        }
      }
      return p[p.length - 1];
    }

    // Dosing recipe: three components to a 25 kg batch
    var recipe = [{ name: 'A', kg: 12 }, { name: 'B', kg: 8 }, { name: 'C', kg: 5 }];
    var TOTAL = 25, RATE = 2.6;   // kg per second (simulated)
    var weight = 0, comp = 0, pause = 0;

    function resize() {
      var r = canvas.getBoundingClientRect();
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = r.width; H = r.height;
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      F = Math.min(W * 1.15, H * 2.3);
    }

    var yaw = -0.5, cyw = 0, syw = 0, cp = Math.cos(PITCH), sp = Math.sin(PITCH);
    function proj(x, y, z) {
      y -= 1.7;
      var x1 = x * cyw - z * syw, z1 = x * syw + z * cyw;
      var y2 = y * cp - z1 * sp, z2 = y * sp + z1 * cp;
      var d = D - z2, s = F / d;
      return [W / 2 + x1 * s, H * 0.56 - y2 * s, d];
    }
    function depthAlpha(d) { return Math.max(0.12, Math.min(1, 1.25 - (d - D + 6) / 13)); }

    function draw(t, dt) {
      yaw = -0.5 + Math.sin(t * 0.00011) * 0.32 + yawOffset;
      yawOffset += (mouseX * 0.25 - yawOffset) * 0.04;
      cyw = Math.cos(yaw); syw = Math.sin(yaw);
      ctx.clearRect(0, 0, W, H);

      // Simulation
      if (pause > 0) {
        pause -= dt;
        if (pause <= 0) { weight = 0; comp = 0; }
      } else {
        weight += RATE * dt;
        var cum = 0;
        for (var r = 0; r < recipe.length; r++) { cum += recipe[r].kg; if (weight < cum) { comp = r; break; } }
        if (weight >= TOTAL) { weight = TOTAL; pause = 2.2; comp = -1; }
      }
      if (weightEl) weightEl.textContent = weight.toFixed(3);
      if (compEl) compEl.textContent = comp >= 0 ? recipe[comp].name : '✓';

      // Points
      for (var i = 0; i < pts.length; i++) {
        var p = pts[i], q = proj(p.x, p.y, p.z);
        var a = depthAlpha(q[2]);
        if (p.k === 0) { ctx.fillStyle = 'rgba(143,193,255,' + (a * 0.28).toFixed(3) + ')'; ctx.fillRect(q[0], q[1], 1.2, 1.2); }
        else if (p.k === 1) { ctx.fillStyle = 'rgba(176,212,255,' + (a * 0.85).toFixed(3) + ')'; ctx.fillRect(q[0], q[1], 1.6, 1.6); }
        else {
          var filled = (p.y - 0.36) / 0.8 <= weight / TOTAL;
          ctx.fillStyle = filled ? 'rgba(245,165,36,' + (a * 0.95).toFixed(3) + ')' : 'rgba(176,212,255,' + (a * 0.7).toFixed(3) + ')';
          ctx.fillRect(q[0], q[1], 1.8, 1.8);
        }
      }

      // Structure lines
      ctx.lineWidth = 1;
      ctx.strokeStyle = 'rgba(143,193,255,0.32)';
      ctx.beginPath();
      for (var s = 0; s < segs.length; s++) {
        var a0 = proj(segs[s][0][0], segs[s][0][1], segs[s][0][2]);
        var b0 = proj(segs[s][1][0], segs[s][1][1], segs[s][1][2]);
        ctx.moveTo(a0[0], a0[1]); ctx.lineTo(b0[0], b0[1]);
      }
      ctx.stroke();

      // Pipes; the active one flows in amber
      for (var pi = 0; pi < pipes.length; pi++) {
        var active = pi === comp;
        ctx.beginPath();
        for (var k = 0; k < pipes[pi].length; k++) {
          var v = proj(pipes[pi][k][0], pipes[pi][k][1], pipes[pi][k][2]);
          if (k === 0) ctx.moveTo(v[0], v[1]); else ctx.lineTo(v[0], v[1]);
        }
        if (active) {
          ctx.strokeStyle = 'rgba(245,165,36,0.85)';
          ctx.lineWidth = 2;
          ctx.setLineDash([6, 10]);
          ctx.lineDashOffset = -t * 0.06;
        } else {
          ctx.strokeStyle = 'rgba(143,193,255,0.45)';
          ctx.lineWidth = 1.4;
          ctx.setLineDash([]);
        }
        ctx.stroke();
        ctx.setLineDash([]);

        if (active) {
          for (var n = 0; n < 9; n++) {
            var pos = along(pi, ((t * 0.00022) + n / 9) % 1);
            var g = proj(pos[0], pos[1], pos[2]);
            ctx.fillStyle = 'rgba(245,165,36,0.18)';
            ctx.beginPath(); ctx.arc(g[0], g[1], 6, 0, 6.283); ctx.fill();
            ctx.fillStyle = '#ffc861';
            ctx.beginPath(); ctx.arc(g[0], g[1], 2, 0, 6.283); ctx.fill();
          }
          // Drops from the nozzle into the container
          for (var dI = 0; dI < 4; dI++) {
            var f = ((t * 0.0012) + dI / 4) % 1;
            var dy = 2.75 - f * (2.75 - (0.4 + 0.8 * weight / TOTAL));
            var dp = proj(CX, dy, CZ);
            ctx.fillStyle = '#ffc861';
            ctx.fillRect(dp[0] - 1, dp[1] - 2, 2, 4);
          }
        }
      }
    }

    var running = false, visible = true, last = 0, raf = 0;
    function loop(now) {
      var dt = last ? Math.min((now - last) / 1000, 0.05) : 0;
      last = now;
      draw(now, dt);
      if (running) raf = requestAnimationFrame(loop);
    }
    function start() { if (!running && visible && !document.hidden) { running = true; last = 0; raf = requestAnimationFrame(loop); } }
    function stop() { running = false; cancelAnimationFrame(raf); }

    resize();
    window.addEventListener('resize', function () { resize(); if (!running) draw(performance.now(), 0); });

    if (reduceMotion) {
      weight = 15; comp = 1;
      draw(0, 0);
      return;
    }

    canvas.parentElement.addEventListener('pointermove', function (e) {
      var r = canvas.getBoundingClientRect();
      mouseX = (e.clientX - r.left) / r.width - 0.5;
    });
    canvas.parentElement.addEventListener('pointerleave', function () { mouseX = 0; });

    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        visible = entries[0].isIntersecting;
        if (visible) start(); else stop();
      }).observe(canvas);
    }
    document.addEventListener('visibilitychange', function () { if (document.hidden) stop(); else start(); });
    start();
  }
})();
