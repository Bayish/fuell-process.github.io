// Füll Systembau – how a dispensing system is built, and six systems from simple to complex.
// Point-cloud schematics in the style of the hero animation. Values in the CALIPSO panel are a
// simulation with example values, not technical data. Pages work without JS (static fallback text).
(function () {
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var AMBER = '245,165,36', SKY = '176,212,255', GRID = '143,193,255', GREEN = '99,214,140';

  // ======================================================================= geometry
  function Scene() { this.pts = []; this.segs = []; this.pipes = []; this.layer = ''; }
  Scene.prototype.ring = function (cx, cy, cz, r, n, k) {
    for (var i = 0; i < n; i++) { var a = i / n * 6.2832; this.pts.push([cx + Math.cos(a) * r, cy, cz + Math.sin(a) * r, k === undefined ? 1 : k, this.layer]); }
  };
  Scene.prototype.cyl = function (cx, cz, r, y0, y1, step, n) { for (var y = y0; y <= y1 + 1e-6; y += step) this.ring(cx, y, cz, r, n); };
  Scene.prototype.line = function (a, b) { this.segs.push([a, b, this.layer]); };
  Scene.prototype.box = function (cx, cy, cz, w, h, d) {
    var x0 = cx - w / 2, x1 = cx + w / 2, y0 = cy - h / 2, y1 = cy + h / 2, z0 = cz - d / 2, z1 = cz + d / 2;
    var c = [[x0, y0, z0], [x1, y0, z0], [x1, y1, z0], [x0, y1, z0], [x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1]];
    [[0, 1], [1, 2], [2, 3], [3, 0], [4, 5], [5, 6], [6, 7], [7, 4], [0, 4], [1, 5], [2, 6], [3, 7]].forEach(function (e) { this.line(c[e[0]], c[e[1]]); }, this);
  };
  Scene.prototype.floor = function (w, d) {
    for (var x = -w; x <= w; x += 0.5) for (var z = -d; z <= d; z += 0.5) this.pts.push([x, 0, z, 0, '']);
  };
  Scene.prototype.tank = function (cx, cz, r, h, y0) {
    y0 = y0 === undefined ? 1.1 : y0;
    var n = Math.max(14, Math.round(30 * r));
    this.cyl(cx, cz, r, y0, y0 + h, 0.18, n);
    for (var j = 1; j <= 4; j++) { var t = j / 5 * 1.5708; this.ring(cx, y0 + h + 0.4 * r * Math.sin(t), cz, r * Math.cos(t), Math.max(6, Math.round(n * Math.cos(t)))); }
    for (var c = 1; c <= 3; c++) this.ring(cx, y0 - 0.35 * r * c / 3, cz, r * (1 - c / 4), Math.max(8, Math.round(n * 0.6)));
    if (y0 > 0.3) { var l = r * 0.7, self = this; [[l, l], [-l, l], [l, -l], [-l, -l]].forEach(function (o) { self.line([cx + o[0], 0, cz + o[1]], [cx + o[0], y0 + 0.05, cz + o[1]]); }); }
  };
  Scene.prototype.pipe = function (path) {
    var L = [0];
    for (var i = 1; i < path.length; i++) { var a = path[i - 1], b = path[i]; L.push(L[i - 1] + Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2])); }
    this.pipes.push({ p: path, L: L, layer: this.layer });
    return this.pipes.length - 1;
  };
  function along(pipe, s) {
    var d = s * pipe.L[pipe.L.length - 1];
    for (var i = 1; i < pipe.p.length; i++) {
      if (d <= pipe.L[i]) { var f = (d - pipe.L[i - 1]) / (pipe.L[i] - pipe.L[i - 1] || 1), a = pipe.p[i - 1], b = pipe.p[i]; return [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f, a[2] + (b[2] - a[2]) * f]; }
    }
    return pipe.p[pipe.p.length - 1];
  }
  function phase(t, period) { return (t % period) / period; }

  // ======================================================================= renderer (one per canvas)
  function Engine(canvas, fit) {
    var e = this, ctx = canvas.getContext('2d');
    e.canvas = canvas; e.ctx = ctx; e.fade = 1; e.hl = ''; e.hlA = {};
    var W = 0, H = 0, F = 1, D = 16, CY = 0.5, cp = Math.cos(0.42), sp = Math.sin(0.42), cyw = 1, syw = 0;
    e.yaw = -0.45;
    e.resize = function () {
      var r = canvas.getBoundingClientRect(), dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = r.width; H = r.height;
      canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      var f = fit(W, H); F = f[0]; CY = f[1];
    };
    function proj(x, y, z) {
      y -= 1.7;
      var x1 = x * cyw - z * syw, z1 = x * syw + z * cyw, y2 = y * cp - z1 * sp, z2 = y * sp + z1 * cp, d = D - z2, s = F / d;
      return [W / 2 + x1 * s, H * CY - y2 * s, d];
    }
    function depthAlpha(d) { return Math.max(0.12, Math.min(1, 1.25 - (d - D + 6) / 13)); }
    function la(layer) { return e.hlA[layer] === undefined ? 1 : e.hlA[layer]; }   // layer highlight factor
    e.proj = proj;
    e.dot = function (x, y, z, r, rgb, a, layer) {
      var q = proj(x, y, z); ctx.fillStyle = 'rgba(' + rgb + ',' + (a * e.fade * la(layer || '')).toFixed(3) + ')';
      ctx.beginPath(); ctx.arc(q[0], q[1], r, 0, 6.2832); ctx.fill();
    };
    e.flow = function (pipe, t, n, speed, strength) {
      var k = strength === undefined ? 1 : strength;
      for (var i = 0; i < n; i++) {
        var pos = along(pipe, ((t * speed) + i / n) % 1);
        e.dot(pos[0], pos[1], pos[2], 6, AMBER, 0.16 * k, pipe.layer);
        e.dot(pos[0], pos[1], pos[2], 2, AMBER, 0.95 * k, pipe.layer);
      }
    };
    e.drops = function (x, z, yTop, yBottom, t, layer) {
      for (var i = 0; i < 4; i++) {
        var f = ((t * 0.0012) + i / 4) % 1, q = proj(x, yTop - f * (yTop - yBottom), z);
        ctx.fillStyle = 'rgba(255,200,97,' + (e.fade * la(layer || '')).toFixed(3) + ')'; ctx.fillRect(q[0] - 1, q[1] - 2, 2, 4);
      }
    };
    e.container = function (x, z, r, fill, layer, y0, y1) {
      y0 = y0 || 0.36; y1 = y1 || 1.0;
      for (var y = y0; y <= y1; y += 0.09) {
        var filled = (y - y0) / (y1 - y0) <= fill;
        for (var i = 0; i < 20; i++) {
          var a = i / 20 * 6.2832, q = proj(x + Math.cos(a) * r, y, z + Math.sin(a) * r);
          ctx.fillStyle = 'rgba(' + (filled ? AMBER : SKY) + ',' + (depthAlpha(q[2]) * (filled ? 0.95 : 0.6) * e.fade * la(layer || '')).toFixed(3) + ')';
          ctx.fillRect(q[0], q[1], 1.7, 1.7);
        }
      }
    };
    e.seg = function (a, b, rgb, alpha, w, layer, dash) {
      var p = proj(a[0], a[1], a[2]), q = proj(b[0], b[1], b[2]);
      ctx.strokeStyle = 'rgba(' + rgb + ',' + (alpha * e.fade * la(layer || '')).toFixed(3) + ')'; ctx.lineWidth = w || 1;
      if (dash) ctx.setLineDash(dash);
      ctx.beginPath(); ctx.moveTo(p[0], p[1]); ctx.lineTo(q[0], q[1]); ctx.stroke();
      if (dash) ctx.setLineDash([]);
    };
    e.draw = function (s, t) {
      e.yaw = -0.45 + Math.sin(t * 0.0001) * 0.26;
      cyw = Math.cos(e.yaw); syw = Math.sin(e.yaw);
      // ease layer highlight
      ['storage', 'lines', 'head', 'scale', 'control'].forEach(function (L) {
        var target = !e.hl || e.hl === L ? 1 : 0.14, cur = e.hlA[L] === undefined ? 1 : e.hlA[L];
        e.hlA[L] = cur + (target - cur) * 0.15;
      });
      ctx.clearRect(0, 0, W, H);
      var i, p, q;
      for (i = 0; i < s.pts.length; i++) {
        p = s.pts[i]; q = proj(p[0], p[1], p[2]);
        var a = depthAlpha(q[2]) * e.fade * la(p[4]);
        if (p[3] === 0) { ctx.fillStyle = 'rgba(' + GRID + ',' + (a * 0.26).toFixed(3) + ')'; ctx.fillRect(q[0], q[1], 1.2, 1.2); }
        else { ctx.fillStyle = 'rgba(' + SKY + ',' + (a * 0.85).toFixed(3) + ')'; ctx.fillRect(q[0], q[1], 1.6, 1.6); }
      }
      ctx.lineWidth = 1;
      for (i = 0; i < s.segs.length; i++) {
        var a0 = proj(s.segs[i][0][0], s.segs[i][0][1], s.segs[i][0][2]), b0 = proj(s.segs[i][1][0], s.segs[i][1][1], s.segs[i][1][2]);
        ctx.strokeStyle = 'rgba(' + GRID + ',' + (0.36 * e.fade * la(s.segs[i][2])).toFixed(3) + ')';
        ctx.beginPath(); ctx.moveTo(a0[0], a0[1]); ctx.lineTo(b0[0], b0[1]); ctx.stroke();
      }
      ctx.lineWidth = 1.3;
      for (i = 0; i < s.pipes.length; i++) {
        ctx.strokeStyle = 'rgba(' + GRID + ',' + (0.48 * e.fade * la(s.pipes[i].layer)).toFixed(3) + ')';
        ctx.beginPath();
        for (var m = 0; m < s.pipes[i].p.length; m++) {
          var v = proj(s.pipes[i].p[m][0], s.pipes[i].p[m][1], s.pipes[i].p[m][2]);
          if (m === 0) ctx.moveTo(v[0], v[1]); else ctx.lineTo(v[0], v[1]);
        }
        ctx.stroke();
      }
    };
  }

  // Animation runs only while its area (canvas or whole section) is visible
  function animate(area, frame) {
    var running = false, visible = true, last = 0, raf = 0;
    function loop(now) { var dt = last ? Math.min((now - last) / 1000, 0.05) : 0; last = now; frame(now, dt); if (running) raf = requestAnimationFrame(loop); }
    function start() { if (!running && visible && !document.hidden && !reduceMotion) { running = true; last = 0; raf = requestAnimationFrame(loop); } }
    function stop() { running = false; cancelAnimationFrame(raf); }
    if ('IntersectionObserver' in window) new IntersectionObserver(function (en) { visible = en[0].isIntersecting; if (visible) start(); else stop(); }).observe(area);
    document.addEventListener('visibilitychange', function () { if (document.hidden) stop(); else start(); });
    start();
    return { running: function () { return running; } };
  }

  // ======================================================================= 1) build-up of a dispensing system + CALIPSO
  (function () {
    var canvas = document.getElementById('build');
    var panel = document.querySelector('[data-calipso]');
    if (!canvas || !canvas.getContext || !panel) return;
    var e = new Engine(canvas, function (W, H) { return H > W * 0.9 ? [W * 0.98, 0.56] : [Math.min(W * 1.05, H * 1.75), 0.5]; });
    var recipe = JSON.parse(panel.getAttribute('data-recipe'));
    var L = JSON.parse(panel.getAttribute('data-labels'));
    var cycles = JSON.parse(panel.getAttribute('data-cycles') || '[]');
    var unitEls = Array.prototype.slice.call(panel.querySelectorAll('[data-cal-units] li')).map(function (li) {
      return { li: li, state: li.querySelector('[data-u-state]'), time: li.querySelector('[data-u-time]') };
    });
    var simT = 0, unitAngle = [];
    var lang = document.documentElement.lang.slice(0, 2);

    // --- scene: tank farm (large tanks), small containers with stirrers, pipes, dosing head, scale, control
    var s = new Scene(), H0 = [0, 3.35, 1.7];
    s.floor(7, 4);
    s.layer = 'storage';
    var big = [[-5.6, -2.6], [-3.6, -2.6], [-1.6, -2.6]];
    big.forEach(function (b) { s.tank(b[0], b[1], 0.85, 2.3); s.box(b[0] + 0.9, 0.3, b[1] + 0.9, 0.5, 0.6, 0.5); });       // tank + pump
    s.box(3.0, 0.85, -2.5, 4.4, 0.08, 1.4);                                                                                   // table for small containers
    s.line([0.85, 0, -3.15], [0.85, 0.85, -3.15]); s.line([5.15, 0, -3.15], [5.15, 0.85, -3.15]); s.line([0.85, 0, -1.85], [0.85, 0.85, -1.85]); s.line([5.15, 0, -1.85], [5.15, 0.85, -1.85]);
    var small = [[1.6, -2.5], [2.6, -2.5], [3.6, -2.5], [4.6, -2.5]];
    small.forEach(function (c) { s.cyl(c[0], c[1], 0.36, 0.95, 1.75, 0.13, 16); s.box(c[0], 2.05, c[1], 0.32, 0.3, 0.32); s.line([c[0], 1.9, c[1]], [c[0], 1.2, c[1]]); });
    s.layer = 'lines';
    var srcPipe = {};
    big.forEach(function (b, i) {
      var vx = H0[0] - 0.45 + i * 0.3;
      srcPipe['L' + (i + 1)] = s.pipe([[b[0] + 0.9, 0.3, b[1] + 0.9], [b[0] + 0.9, 0.3, 0.2], [b[0] + 0.9, 4.25, 0.2], [vx, 4.25, 0.2], [vx, 4.25, H0[2]], [vx, H0[1] + 0.1, H0[2]]]);
      s.pipe([[b[0] + 0.9, 0.3, b[1] + 0.9], [b[0] + 0.5, 0.3, b[1] + 0.5], [b[0], 3.6, b[1]]]);                       // recirculation loop
    });
    small.forEach(function (c, i) {
      var vx = H0[0] + 0.5 + (i % 2) * 0.25, vz = H0[2] - 0.2 + Math.floor(i / 2) * 0.4;
      srcPipe['S' + (i + 1)] = s.pipe([[c[0], 0.95, c[1]], [c[0], 0.6, c[1]], [c[0], 0.6, -1.0], [c[0], 4.0, -1.0], [vx, 4.0, -1.0], [vx, 4.0, vz], [vx, H0[1] + 0.1, vz]]);
    });
    s.layer = 'head';
    s.box(H0[0], H0[1], H0[2], 1.6, 0.5, 1.2);
    for (var v = 0; v < 8; v++) { var a = v / 8 * 6.2832; s.box(H0[0] + Math.cos(a) * 0.45, H0[1] - 0.45, H0[2] + Math.sin(a) * 0.35, 0.12, 0.35, 0.12); }
    s.line([-1.9, 0, H0[2] - 0.7], [-1.9, 4.4, H0[2] - 0.7]); s.line([1.9, 0, H0[2] - 0.7], [1.9, 4.4, H0[2] - 0.7]); s.line([-1.9, 4.4, H0[2] - 0.7], [1.9, 4.4, H0[2] - 0.7]);
    s.layer = 'scale';
    s.box(H0[0], 0.16, H0[2], 1.5, 0.32, 1.2);
    s.layer = 'control';
    s.box(5.4, 1.4, 1.6, 1.0, 2.8, 0.8); s.box(5.4, 2.3, 2.02, 0.75, 0.55, 0.04);                                             // cabinet + CALIPSO screen
    s.box(3.6, 1.15, 2.6, 0.9, 0.06, 0.6); s.line([3.6, 0, 2.6], [3.6, 1.12, 2.6]);                                           // operator terminal

    // --- simulation state
    var step = 0, amount = 0, elapsed = 0, stepTime = 0, done = false, hold = 0, times = [];
    var rowEls = [], totalEl = panel.querySelector('[data-cal-total]'), barEl = panel.querySelector('[data-cal-bar]');
    var statusEl = panel.querySelector('[data-cal-status]'), scaleEl = panel.querySelector('[data-cal-scale]'), activeEl = panel.querySelector('[data-cal-active]');
    var tbody = panel.querySelector('tbody');
    var nf = function (v, unit) {
      var dec = unit === 'kg' || unit === 'L' ? 3 : (unit === 'g' || unit === 'ml' ? 1 : 0);
      return v.toLocaleString(lang === 'de' ? 'de-DE' : 'en-GB', { minimumFractionDigits: dec, maximumFractionDigits: dec });
    };
    function mmss(sec) { sec = Math.max(0, sec); var m = Math.floor(sec / 60), x = Math.floor(sec % 60); return (m < 10 ? '0' : '') + m + ':' + (x < 10 ? '0' : '') + x; }
    tbody.innerHTML = '';
    recipe.forEach(function (r, i) {
      var tr = document.createElement('tr');
      tr.innerHTML = '<td class="c-n">' + (i + 1) + '</td><td><strong>' + r.name + '</strong><small>' + r.src + '</small></td>' +
        '<td class="c-num">' + nf(r.target, r.unit) + ' ' + r.unit + '</td><td class="c-num" data-ist>0 ' + r.unit + '</td>' +
        '<td class="c-num" data-time>' + mmss(r.target / r.rate) + '</td><td><span class="chip" data-state>' + L.wait + '</span></td>';
      tbody.appendChild(tr);
      rowEls.push({ tr: tr, ist: tr.querySelector('[data-ist]'), time: tr.querySelector('[data-time]'), state: tr.querySelector('[data-state]') });
    });
    var totalPlanned = recipe.reduce(function (t, r) { return t + r.target / r.rate; }, 0);

    function setRow(i, state) {
      var el = rowEls[i]; el.tr.className = state;
      el.state.textContent = state === 'is-run' ? L.run : state === 'is-done' ? L.done : L.wait;
    }
    function reset() { step = 0; amount = 0; elapsed = 0; stepTime = 0; done = false; times = []; rowEls.forEach(function (_, i) { setRow(i, ''); rowEls[i].ist.textContent = '0 ' + recipe[i].unit; rowEls[i].time.textContent = mmss(recipe[i].target / recipe[i].rate); }); }
    var uiTick = 0;
    // Pump / stirrer state: runs in its cycle (on / off seconds); always runs while its source is being dosed
    function unitState(c) {
      if (!done && hold <= 0 && recipe[step].pipe === c.id) return { on: true, t: stepTime, feed: true };
      var per = c.on + c.off, ph = (simT + c.offset) % per;
      return ph < c.on ? { on: true, t: ph } : { on: false, t: ph - c.on };
    }
    function simulate(dt) {
      simT += dt;
      if (hold > 0) { hold -= dt; if (hold <= 0) reset(); return; }
      if (done) return;
      var r = recipe[step];
      if (stepTime === 0) setRow(step, 'is-run');
      stepTime += dt; elapsed += dt;
      amount = Math.min(r.target, amount + r.rate * dt);
      if (amount >= r.target) {
        times[step] = stepTime; rowEls[step].time.textContent = mmss(stepTime); rowEls[step].ist.textContent = nf(r.target, r.unit) + ' ' + r.unit;
        setRow(step, 'is-done'); step++; amount = 0; stepTime = 0;
        if (step >= recipe.length) { done = true; hold = 4; step = recipe.length - 1; }
      }
    }
    function updateUI() {
      var r = recipe[step], running = !done;
      if (running) { rowEls[step].ist.textContent = nf(amount, r.unit) + ' ' + r.unit; rowEls[step].time.textContent = mmss(stepTime); }
      statusEl.textContent = done ? L.finished : L.running; statusEl.className = 'cal-status ' + (done ? 'is-done' : 'is-run');
      scaleEl.textContent = done ? L.remove : (r.method === 'vol' ? L.vol : L.grav);
      activeEl.textContent = done ? '—' : r.name + ' · ' + r.src;
      totalEl.textContent = mmss(elapsed) + ' / ' + mmss(totalPlanned);
      var prog = (recipe.slice(0, done ? recipe.length : step).reduce(function (t, x) { return t + x.target / x.rate; }, 0) + (done ? 0 : amount / r.rate)) / totalPlanned;
      barEl.style.transform = 'scaleX(' + Math.min(1, prog).toFixed(3) + ')';
      cycles.forEach(function (c, i) {
        var st = unitState(c), el = unitEls[i]; if (!el) return;
        el.li.className = 'unit unit--' + c.type + (st.on ? ' is-on' : '') + (st.feed ? ' is-feed' : '');
        el.state.textContent = st.feed ? L.feed : st.on ? L.on : L.off;
        el.time.textContent = mmss(st.t);
      });
    }

    function frame(t, dt) {
      simulate(dt);
      if ((uiTick += dt) > 0.1 || dt === 0) { uiTick = 0; updateUI(); }
      e.draw(s, t);
      var r = recipe[step], active = !done && hold <= 0;
      // large tanks: liquid only circulates while the pump runs; the pump lights up green
      big.forEach(function (b, i) {
        var st = cycles[i] ? unitState(cycles[i]) : { on: true };
        if (st.on) e.flow(s.pipes[i * 2 + 1], t, 4, 0.0002, 0.8);
        e.dot(b[0] + 0.9, 0.65, b[1] + 0.9, st.on ? 5 + Math.sin(t * 0.01) : 2.5, st.on ? GREEN : SKY, st.on ? 0.95 : 0.45, 'storage');
      });
      // small containers: the stirrer only turns while it is on
      small.forEach(function (c, i) {
        var st = cycles[3 + i] ? unitState(cycles[3 + i]) : { on: false };
        unitAngle[i] = (unitAngle[i] || 0) + (st.on ? 0.22 : 0);
        for (var b = 0; b < 2; b++) e.seg([c[0], 1.3, c[1]], [c[0] + Math.cos(unitAngle[i] + b * 3.1416) * 0.28, 1.3, c[1] + Math.sin(unitAngle[i] + b * 3.1416) * 0.28], st.on ? AMBER : SKY, st.on ? 0.95 : 0.45, st.on ? 2 : 1, 'storage');
        if (st.on) e.dot(c[0], 2.05, c[1], 4, GREEN, 0.85, 'storage');
      });
      // total fill of the container across the whole order
      var prog = (recipe.slice(0, done ? recipe.length : step).reduce(function (tt, x) { return tt + x.share; }, 0) + (done ? 0 : r.share * amount / r.target));
      e.container(H0[0], H0[2], 0.5, prog, 'scale', 0.36, 1.2);
      if (active) {
        e.flow(s.pipes[srcPipe[r.pipe]], t, 8, 0.0003);
        e.drops(H0[0], H0[2], H0[1] - 0.6, 0.45 + 0.75 * prog, t, 'head');
        e.dot(H0[0], H0[1] - 0.62, H0[2], 5, AMBER, 0.8, 'head');
      }
      // signal line CALIPSO -> dosing head
      e.seg([5.4, 2.85, 1.6], [5.4, 4.6, 1.6], GREEN, 0.5, 1, 'control', [3, 5]);
      e.seg([5.4, 4.6, 1.6], [H0[0] + 0.8, 4.6, H0[2]], GREEN, 0.5, 1, 'control', [3, 5]);
      e.dot(5.4, 2.3, 2.05, 4 + Math.sin(t * 0.008) * 1.5, done ? GREEN : AMBER, 0.9, 'control');
    }

    // layer buttons: highlight one part of the system
    var buttons = Array.prototype.slice.call(document.querySelectorAll('[data-layer]'));
    buttons.forEach(function (b) {
      b.addEventListener('click', function () {
        var l = b.getAttribute('data-layer'), on = e.hl !== l;
        e.hl = on ? l : '';
        buttons.forEach(function (x) { x.setAttribute('aria-pressed', String(x === b && on)); });
        if (!anim.running()) { for (var k = 0; k < 30; k++) e.draw(s, 0); frame(0, 0); }
      });
    });

    e.resize();
    window.addEventListener('resize', function () { e.resize(); if (!anim.running()) frame(performance.now(), 0); });
    if (reduceMotion) { step = 2; amount = recipe[2].target * 0.5; recipe.slice(0, 2).forEach(function (_, i) { setRow(i, 'is-done'); rowEls[i].ist.textContent = nf(recipe[i].target, recipe[i].unit) + ' ' + recipe[i].unit; }); setRow(2, 'is-run'); }
    var anim = animate(canvas.closest('.build') || canvas, frame);   // panel keeps running while it is on screen
    frame(performance.now(), 0);
  })();

  // ======================================================================= 2) six systems from simple to complex
  (function () {
    var canvas = document.getElementById('journey');
    var steps = Array.prototype.slice.call(document.querySelectorAll('[data-step]'));
    if (!canvas || !canvas.getContext || !steps.length) return;
    var e = new Engine(canvas, function (W, H) { return H > W * 1.1 ? [W * 1.3, 0.5] : [Math.min(W * 0.95, H * 1.55), 0.47]; });
    var levelEl = document.querySelector('[data-stage-level]'), nameEl = document.querySelector('[data-stage-name]');
    var meter = Array.prototype.slice.call(document.querySelectorAll('[data-stage-meter] span'));
    var ladder = Array.prototype.slice.call(document.querySelectorAll('[data-ladder] a'));
    var SC = [];

    (function () {   // 01 FS MS – valves in one row; the scale moves the container from valve to valve
      var s = new Scene(), xs = []; s.floor(6, 3.5);
      for (var i = 0; i < 8; i++) xs.push(-4.2 + i * 1.2);
      s.box(0, 2.9, 0, 10.2, 0.35, 0.6);
      xs.forEach(function (x) { s.box(x, 2.45, 0, 0.32, 0.55, 0.32); s.ring(x, 3.3, 0, 0.18, 10); });
      s.line([-5.1, 0, 0.3], [-5.1, 3.1, 0.3]); s.line([5.1, 0, 0.3], [5.1, 3.1, 0.3]);
      s.box(0, 0.08, 0.2, 10.4, 0.16, 1.2);
      s.dyn = function (t) {
        var p = phase(t, 11000), sg = p * xs.length, k = Math.min(xs.length - 1, Math.floor(sg)), f = sg - k, prev = xs[Math.max(0, k - 1)];
        var x = f < 0.35 ? prev + (xs[k] - prev) * (f / 0.35) : xs[k];
        e.seg([x - 0.7, 0.2, 0.2], [x + 0.7, 0.2, 0.2], SKY, 0.6, 1.2);
        e.container(x, 0.2, 0.4, (k + Math.max(0, (f - 0.35) / 0.65)) / xs.length);
        if (f >= 0.35) e.drops(xs[k], 0, 2.15, 1.0, t);
      };
      SC.push(s);
    })();
    (function () {   // 02 FS XS – compact centre, components recirculated through the valves
      var s = new Scene(), V = []; s.floor(5, 3.5);
      s.box(0, 1.9, 0, 3.4, 3.8, 2.6);
      for (var i = 0; i < 8; i++) { var a = i / 8 * 6.2832; V.push([Math.cos(a) * 0.65, Math.sin(a) * 0.65]); s.box(V[i][0], 2.9, V[i][1], 0.18, 0.4, 0.18); }
      for (var j = 0; j < 4; j++) {
        var cx = -3.6 + (j % 2) * 0.9, cz = -1.0 + Math.floor(j / 2) * 1.6;
        s.cyl(cx, cz, 0.35, 0.1, 1.0, 0.15, 16);
        s.pipe([[cx, 1.0, cz], [cx, 3.6, cz], [V[j][0], 3.6, V[j][1]], [V[j][0], 3.1, V[j][1]]]);
        s.pipe([[V[j][0], 3.1, V[j][1]], [cx + 0.2, 3.3, cz + 0.2], [cx + 0.2, 1.0, cz + 0.2]]);
      }
      s.dyn = function (t) {
        var p = phase(t, 8000), k = Math.floor(p * 4), f = (p * 4) % 1;
        for (var i = 0; i < s.pipes.length; i += 2) e.flow(s.pipes[i + 1], t, 4, 0.00018, 0.7);
        e.flow(s.pipes[k * 2], t, 6, 0.00028);
        e.container(0, 0, 0.45, (k + f) / 4);
        e.drops(V[k][0] * 0.6, V[k][1] * 0.6, 2.65, 1.0, t);
      };
      SC.push(s);
    })();
    (function () {   // 03 LX5 – laboratory: shelves with dozens of components, a dosing head serves them
      var s = new Scene(), cells = []; s.floor(6, 3.5);
      for (var row = 0; row < 3; row++) {
        s.box(0, 1.0 + row, -1.4, 9.6, 0.06, 1.0);
        for (var c = 0; c < 10; c++) { var x = -4.3 + c * 0.95; s.cyl(x, -1.4, 0.2, 1.05 + row, 1.55 + row, 0.12, 10); cells.push([x, 1.55 + row, -1.4]); }
      }
      s.line([-4.9, 0, -0.9], [-4.9, 3.6, -0.9]); s.line([4.9, 0, -0.9], [4.9, 3.6, -0.9]);
      s.box(0, 3.75, 0.2, 10.0, 0.12, 0.12); s.box(2.8, 0.5, 1.6, 1.0, 1.0, 1.0);
      s.dyn = function (t) {
        var p = phase(t, 12000), k = Math.floor(p * 6), f = (p * 6) % 1, target = cells[(k * 7) % cells.length];
        var hx = f < 0.5 ? target[0] : target[0] * (1 - (f - 0.5) * 2);
        e.seg([hx, 3.75, 0.2], [hx, 3.0, 0.2], AMBER, 0.9, 2);
        e.dot(hx, 2.95, 0.2, 5, AMBER, 0.9);
        e.dot(target[0], target[1] + 0.15, target[2], 7, AMBER, 0.35 + 0.4 * Math.sin(t * 0.006));
        e.container(0, 0.2, 0.35, (k + f) / 6);
        if (f > 0.5) e.drops(0, 0.2, 2.9, 0.95, t);
      };
      SC.push(s);
    })();
    (function () {   // 04 FS 2005.2 – dispensing centre with roller conveyor
      var s = new Scene(); s.floor(6.5, 3.5);
      s.box(0, 2.0, 0, 3.0, 4.0, 2.4);
      for (var i = 0; i < 12; i++) { var a = i / 12 * 6.2832; s.box(Math.cos(a) * 0.8, 3.2, Math.sin(a) * 0.8, 0.16, 0.42, 0.16); }
      for (var x = -6; x <= 6; x += 0.5) s.line([x, 0.3, 0.9], [x, 0.3, -0.9]);
      s.line([-6, 0.3, 0.9], [6, 0.3, 0.9]); s.line([-6, 0.3, -0.9], [6, 0.3, -0.9]);
      s.tank(-4.4, -2.4, 0.7, 1.6); s.tank(4.4, -2.4, 0.7, 1.6);
      s.pipe([[-4.4, 0.8, -2.4], [-4.4, 4.3, -2.4], [-0.3, 4.3, -0.3], [-0.3, 3.4, -0.3]]);
      s.pipe([[4.4, 0.8, -2.4], [4.4, 4.3, -2.4], [0.3, 4.3, 0.3], [0.3, 3.4, 0.3]]);
      s.dyn = function (t) {
        var p = phase(t, 9000), x, fill;
        if (p < 0.25) { x = -6 + p / 0.25 * 6; fill = 0; } else if (p < 0.75) { x = 0; fill = (p - 0.25) / 0.5; } else { x = (p - 0.75) / 0.25 * 6; fill = 1; }
        e.container(x, 0, 0.42, fill);
        if (p >= 0.25 && p < 0.75) { e.flow(s.pipes[p < 0.5 ? 0 : 1], t, 7, 0.0003); e.drops(0, 0, 2.9, 0.4 + 0.6 * fill, t); }
      };
      SC.push(s);
    })();
    (function () {   // 05 FS 182.2 – larger centre fed from a tank farm, two weighing stations
      var s = new Scene(), tx = [-4.8, -2.4, 0, 2.4, 4.8]; s.floor(7, 4);
      s.box(0, 2.1, 0.6, 5.6, 4.2, 2.4);
      [-1.3, 1.3].forEach(function (cx) {
        for (var i = 0; i < 10; i++) { var a = i / 10 * 6.2832; s.box(cx + Math.cos(a) * 0.6, 3.3, 0.6 + Math.sin(a) * 0.6, 0.14, 0.38, 0.14); }
        s.box(cx, 0.12, 0.6, 1.2, 0.24, 1.0);
      });
      tx.forEach(function (x, i) {
        s.tank(x, -3.0, 0.75, 1.9);
        var target = i < 3 ? -1.3 : 1.3, off = (i % 3 - 1) * 0.25;
        s.pipe([[x, 0.8, -3.0], [x, 0.5, -3.0], [x, 0.5, -1.4], [x, 4.6, -1.4], [target + off, 4.6, 0.6], [target + off, 3.5, 0.6]]);
      });
      s.dyn = function (t) {
        var p = phase(t, 10000), k = Math.floor(p * 5);
        e.flow(s.pipes[k], t, 8, 0.00026); e.flow(s.pipes[(k + 2) % 5], t, 5, 0.0002);
        e.container(-1.3, 0.6, 0.42, (p * 2) % 1); e.container(1.3, 0.6, 0.42, (p * 2 + 0.5) % 1);
        e.drops(-1.3, 0.6, 2.9, 1.0, t); e.drops(1.3, 0.6, 2.9, 1.0, t + 300);
      };
      SC.push(s);
    })();
    (function () {   // 06 FS 188 – reactive components dosed and mixed, fed continuously into a following process
      var s = new Scene(); s.floor(7, 4);
      [-5, -3, -1].forEach(function (x) { s.tank(x, -2.4, 0.7, 2.0); });
      s.tank(2.0, -0.4, 1.0, 1.4);
      s.line([2.0, 3.1, -0.4], [2.0, 4.4, -0.4]); s.box(2.0, 4.6, -0.4, 0.6, 0.4, 0.6);
      s.box(5.3, 0.9, 1.8, 3.0, 1.0, 2.2);
      for (var x = 4.0; x <= 6.6; x += 0.35) s.line([x, 1.42, 0.8], [x, 1.42, 2.8]);
      [-5, -3, -1].forEach(function (tx, i) { s.pipe([[tx, 0.8, -2.4], [tx, 0.45, -2.4], [tx, 0.45, -1.0], [tx, 4.0, -1.0], [1.6 + i * 0.4, 4.0, -0.4], [1.6 + i * 0.4, 3.0, -0.4]]); });
      s.pipe([[2.0, 0.75, -0.4], [2.0, 0.35, -0.4], [2.0, 0.35, 1.8], [3.8, 0.35, 1.8], [3.8, 1.5, 1.8], [4.2, 1.5, 1.8]]);
      s.dyn = function (t) {
        var k = Math.floor(phase(t, 7500) * 3), a = t * 0.004;
        e.flow(s.pipes[k], t, 7, 0.00028); e.flow(s.pipes[3], t, 10, 0.00022);
        for (var b = 0; b < 3; b++) { var ang = a + b * 2.094; e.seg([2.0, 1.6, -0.4], [2.0 + Math.cos(ang) * 0.75, 1.6, -0.4 + Math.sin(ang) * 0.75], AMBER, 0.9, 2); }
        for (var y = 1.2; y <= 2.4; y += 0.2) e.dot(2.0 + Math.cos(a * 1.5 + y * 3) * 0.6, y, -0.4 + Math.sin(a * 1.5 + y * 3) * 0.6, 1.6, AMBER, 0.8);
        var m = phase(t, 2600);
        for (var r = 0; r < 6; r++) { var xx = 4.0 + ((m + r / 6) % 1) * 2.6; e.seg([xx, 1.46, 0.9], [xx, 1.46, 2.7], AMBER, 0.55, 1.5); }
      };
      SC.push(s);
    })();

    var current = 0, next = -1, fadeDir = 0;
    function frame(t, dt) {
      if (fadeDir === -1) { e.fade -= dt * 4; if (e.fade <= 0) { e.fade = 0; current = next; fadeDir = 1; } }
      else if (fadeDir === 1) { e.fade += dt * 4; if (e.fade >= 1) { e.fade = 1; fadeDir = 0; } }
      e.draw(SC[current], t); SC[current].dyn(t);
    }
    function setStep(i) {
      if (i < 0 || i === next) return;
      next = i;
      if (!anim || !anim.running()) { current = i; e.fade = 1; fadeDir = 0; frame(performance.now(), 0); } else fadeDir = -1;
      if (levelEl) levelEl.textContent = (i < 9 ? '0' : '') + (i + 1);
      if (nameEl) nameEl.textContent = steps[i].getAttribute('data-name');
      meter.forEach(function (el, k) { el.classList.toggle('on', k <= i); });
      ladder.forEach(function (el, k) { el.classList.toggle('is-active', k === i); });
    }
    var anim = null;
    e.resize();
    window.addEventListener('resize', function () { e.resize(); if (!anim.running()) frame(performance.now(), 0); });
    // ?step=fs-188 opens the page on one system (direct links, presentations)
    var wanted = (location.search.match(/[?&]step=([a-z0-9-]+)/) || [])[1];
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (en) {
        en.forEach(function (x) { if (x.isIntersecting && (scrollY > 0 || !wanted)) setStep(steps.indexOf(x.target)); });
      }, { rootMargin: '-45% 0px -45% 0px' });
      steps.forEach(function (el) { io.observe(el); });
    }
    setStep(wanted ? Math.max(0, steps.findIndex(function (el) { return el.id === wanted; })) : 0);
    anim = animate(canvas, frame);
  })();
})();
