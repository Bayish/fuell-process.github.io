// Design preview only: fixed bar to switch between the five versions.
// Keeps the current page (landing, English, imprint, privacy, cookie, 404) when switching.
// Remove every <script src="/assets/js/switcher.js"> tag before going live.
(function () {
  var versions = [
    ['/v1/', '1', 'Classic'],
    ['/', '2', 'Navy'],
    ['/v3/', '3', 'Machina'],
    ['/v4/', '4', 'Re:Build'],
    ['/v5/', '5', 'Vention']
  ];
  var BASE = '/fuell-process.github.io/';
  var path = '/' + location.pathname.replace(/index\.html$/, '').slice(BASE.length);
  var match = path.match(/^\/v[1345]\//);
  var current = match ? match[0] : '/';
  var rest = path.slice(current.length);   // e.g. "en/imprint/" or "" or "404.html"

  var css = document.createElement('style');
  css.textContent =
    'html.has-vbar body{padding-top:44px}' +
    'html.has-vbar .site-header{top:44px!important}' +
    'html.has-vbar{scroll-padding-top:140px}' +
    '.vbar{position:fixed;inset:0 0 auto;z-index:1000;height:44px;display:flex;align-items:center;gap:14px;padding:0 12px;' +
    'background:#0a0a0a;color:#fff;font:600 12px/1 ui-monospace,"SF Mono",Menlo,Consolas,monospace;letter-spacing:.08em;' +
    'border-bottom:1px solid rgba(255,255,255,.12)}' +
    '.vbar__label{text-transform:uppercase;color:#9aa4ae;white-space:nowrap}' +
    '.vbar__list{display:flex;gap:4px;overflow-x:auto;scrollbar-width:none;-webkit-overflow-scrolling:touch}' +
    '.vbar__list::-webkit-scrollbar{display:none}' +
    '.vbar a{display:inline-flex;align-items:center;gap:7px;height:30px;padding:0 11px;border:1px solid rgba(255,255,255,.18);' +
    'color:#fff;text-decoration:none;white-space:nowrap;border-radius:3px;transition:background .2s,border-color .2s}' +
    '.vbar a b{display:inline-grid;place-items:center;width:18px;height:18px;border-radius:2px;background:rgba(255,255,255,.14);font-size:11px}' +
    '.vbar a:hover{border-color:#fff}' +
    '.vbar a[aria-current="page"]{background:#fff;color:#0a0a0a;border-color:#fff}' +
    '.vbar a[aria-current="page"] b{background:#0a0a0a;color:#fff}' +
    '@media (max-width:560px){.vbar__label{display:none}.vbar a span{display:none}.vbar a{padding:0 8px}}';
  document.head.appendChild(css);

  var bar = document.createElement('nav');
  bar.className = 'vbar';
  bar.setAttribute('aria-label', 'Design-Version');
  bar.innerHTML = '<span class="vbar__label">Design-Version</span><div class="vbar__list">' +
    versions.map(function (v) {
      return '<a href="' + BASE + v[0].slice(1) + rest + location.hash + '"' + (v[0] === current ? ' aria-current="page"' : '') + '><b>' + v[1] + '</b><span>' + v[2] + '</span></a>';
    }).join('') + '</div>';
  document.body.insertBefore(bar, document.body.firstChild);
  document.documentElement.classList.add('has-vbar');
})();
