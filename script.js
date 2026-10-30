const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];

/* loader + initial animations (never wait more than 2.5s for slow images) */
let started = false;
function start() {
  if (started) return; started = true;
  $('#loader').classList.add('done');
  document.body.classList.add('loaded');
}
window.addEventListener('load', () => setTimeout(start, 500));
setTimeout(start, 2500);

/* scroll reveal */
const io = new IntersectionObserver(es => es.forEach(e => {
  if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
}), { threshold: .15 });
$$('.rv').forEach(el => io.observe(el));

/* count-up */
function countUp(el) {
  const to = +el.dataset.n, t0 = performance.now();
  (function f(t) {
    const p = Math.min((t - t0) / 1600, 1);
    el.textContent = Math.round(to * (1 - Math.pow(1 - p, 3))).toLocaleString('es-CO');
    if (p < 1) requestAnimationFrame(f);
  })(t0);
}

/* nav: hide on scroll down, solid after hero */
let lastY = 0;
addEventListener('scroll', () => {
  const y = scrollY, nav = $('#nav');
  nav.classList.toggle('hide', y > lastY && y > 200);
  nav.classList.toggle('solid', y > innerHeight * .8);
  lastY = y;
}, { passive: true });

/* burger drawer */
$('#burger').onclick = () => { $('#burger').classList.toggle('open'); $('#drawer').classList.toggle('open'); };
$$('#drawer a').forEach(a => a.addEventListener('click', () => { $('#burger').classList.remove('open'); $('#drawer').classList.remove('open'); }));

/* map: satellite view of the site with the lot perimeter */
const HOME = [7.880597377317534, -72.48866796931321];
/* Perimeter traced by eye from a reference screenshot (zoom 19, ~0.296 m/px, pin tip at 500,362).
   Replace PERIMETER with surveyed [lat, lng] points when available. */
const PX = [[523, 313], [580, 347], [563, 415], [520, 497], [458, 465], [478, 385], [497, 350]];
const M = 0.2958, REF = [500, 362];
const PERIMETER = PX.map(([x, y]) => [
  HOME[0] - ((y - REF[1]) * M) / 111320,
  HOME[1] + ((x - REF[0]) * M) / 110270,
]);

const map = L.map('map', { center: HOME, zoom: 19, maxZoom: 19, zoomControl: false, scrollWheelZoom: false });
L.control.zoom({ position: 'topleft' }).addTo(map);
L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
  maxZoom: 19, attribution: 'Tiles &copy; Esri'
}).addTo(map);
map.on('click', () => map.scrollWheelZoom.enable());
map.on('mouseout', () => map.scrollWheelZoom.disable());

const lot = L.polygon(PERIMETER, { color: '#f2b705', weight: 3, dashArray: '8 7', fillColor: '#f2b705', fillOpacity: .12, className: 'lot' }).addTo(map);
const pin = L.divIcon({
  className: 'redpin', iconSize: [30, 42], iconAnchor: [15, 40],
  html: '<svg viewBox="0 0 30 42" width="30" height="42"><path d="M15 1C7 1 1 7 1 15c0 10 14 26 14 26s14-16 14-26C29 7 23 1 15 1z" fill="#e23a3a" stroke="#fff" stroke-width="2"/><circle cx="15" cy="15" r="5" fill="#fff"/></svg>'
});
L.marker(HOME, { icon: pin, title: 'Rivers Mall Cúcuta' }).addTo(map);

const views = [[19, 'lot'], [17, 'area'], [14, 'city']];
function showView(i) {
  if (views[i][1] === 'lot') map.flyToBounds(lot.getBounds().pad(.9), { duration: 1.2, maxZoom: 19 });
  else map.flyTo(HOME, views[i][0], { duration: 1.4 });
}
map.fitBounds(lot.getBounds().pad(.9), { maxZoom: 19 });
$$('#loc-list li').forEach(li => li.onclick = () => {
  $$('#loc-list li').forEach(x => x.classList.remove('on'));
  li.classList.add('on');
  showView(+li.dataset.i);
});

/* floor plan: real units, clickable areas (rects in px of assets/plano-rot.png, 668x638) */
const PW = 668, PH = 638;
const STATE = { a: 'Disponible', o: 'Ocupado', c: 'Próximamente' };
const units = [
  { id: '5', name: 'Local 5', s: 'a', area: '105,53 m²', r: [363, 68, 400, 218] },
  { id: '6', name: 'Local 6', s: 'a', area: '105,53 m²', r: [324, 68, 363, 218] },
  { id: '7', name: 'Local 7', s: 'a', area: null, r: [286, 68, 324, 218] },
  { id: '8', name: 'Local 8', s: 'a', area: null, r: [248, 68, 286, 218] },
  { id: '1', name: 'Local 1', s: 'a', area: '102,49 m²', r: [98, 219, 211, 256] },
  { id: '2', name: 'Local 2', s: 'a', area: '102,49 m²', r: [98, 256, 211, 293] },
  { id: '3', name: 'Local 3', s: 'a', area: '102,49 m²', r: [98, 293, 211, 331] },
  { id: '4', name: 'Local 4', s: 'a', area: '102,49 m²', r: [98, 331, 211, 368] },
  { id: 'cv', name: 'Cruz Verde', s: 'o', area: '292,41 m²', r: [98, 368, 211, 480] },
];
const photos = ['1441986300917-64674bd600d8', '1472851294608-062f824d29cc', '1567401893414-76b7b1e5a7a5', '1604719312566-8912e9227c6a', '1528698827591-e19ccd7bc23d'];
const photo = i => 'https://images.unsplash.com/photo-' + photos[i % photos.length] + '?auto=format&fit=crop&w=700&q=80';
const pct = (v, t) => (v / t * 100).toFixed(3) + '%';

$('#ucards').innerHTML = units.map(u =>
  '<button class="uc ' + u.s + '" data-id="' + u.id + '"><strong>' + u.name + '</strong><span class="tag">' + STATE[u.s] + '</span></button>').join('');
$('#planimg').insertAdjacentHTML('beforeend', units.map(u => {
  const [x1, y1, x2, y2] = u.r;
  return '<button class="hot ' + u.s + '" data-id="' + u.id + '" aria-label="' + u.name + '" style="left:' + pct(x1, PW) + ';top:' + pct(y1, PH) + ';width:' + pct(x2 - x1, PW) + ';height:' + pct(y2 - y1, PH) + '"><span>' + (u.id === 'cv' ? 'CV' : u.id) + '</span></button>';
}).join(''));

function select(id) {
  const u = units.find(x => x.id === id);
  $$('#ucards .uc, #planimg .hot').forEach(el => el.classList.toggle('on', el.dataset.id === id));
  $('#uinfo').innerHTML =
    '<div><small>Edificio Norte · Primer piso</small><h3>' + u.name + '</h3></div>' +
    '<dl><div><dt>Estado</dt><dd class="st ' + u.s + '">' + STATE[u.s] + '</dd></div>' +
    '<div><dt>Superficie</dt><dd>' + (u.area || 'Consultar') + '</dd></div>' +
    '<div><dt>Uso</dt><dd>Retail</dd></div></dl>' +
    (u.s === 'a' ? '<a class="pill sm" href="#contacto"><em>Consultar este local</em><em>Consultar este local</em></a>' : '') +
    '<a class="pill sm" href="assets/brochure.pdf" download><em>Descargar brochure</em><em>Descargar brochure</em></a>';
  $('#uinfo').classList.remove('pop'); void $('#uinfo').offsetWidth; $('#uinfo').classList.add('pop');
}
function link(id, on) { $$('[data-id="' + id + '"]').forEach(el => el.classList.toggle('hl', on)); }
$$('#ucards .uc, #planimg .hot').forEach(el => {
  el.addEventListener('click', () => select(el.dataset.id));
  el.addEventListener('mouseenter', () => link(el.dataset.id, true));
  el.addEventListener('mouseleave', () => link(el.dataset.id, false));
});
select(units[0].id);

/* tilt on images */
$$('.tilt').forEach(img => {
  img.addEventListener('mousemove', e => {
    const r = img.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
    img.style.transform = 'perspective(800px) rotateY(' + (x * 10) + 'deg) rotateX(' + (-y * 10) + 'deg) scale(1.03)';
  });
  img.addEventListener('mouseleave', () => img.style.transform = '');
});

/* available units */
const avail = units.filter(u => u.s === 'a');
let shown = 0;
function more() {
  avail.slice(shown, shown + 4).forEach((u, k) => $('#cards').insertAdjacentHTML('beforeend',
    '<div class="card" style="--d:' + (k * .1) + 's"><img src="' + photo(shown + k) + '" alt=""><small>Edificio Norte · Primer piso</small><h3>' + u.name + '</h3><p>Uso: Retail</p><p>Superficie: ' + (u.area || 'Consultar') + '</p><p>Precio: Consultar</p><a class="pill sm ink" href="#plano" data-go="' + u.id + '"><em>Ver en plano</em><em>Ver en plano</em></a><a class="pill sm ink" href="#contacto"><em>Consultar</em><em>Consultar</em></a></div>'));
  shown += 4;
  if (shown >= avail.length) $('#more').hidden = true;
  $$('[data-go]').forEach(el => el.onclick = () => select(el.dataset.go));
}
more();
$('#more').onclick = more;

/* stats count-up when visible */
$$('.stats b, [data-n]').forEach(el => {
  new IntersectionObserver((es, o) => es.forEach(e => { if (e.isIntersecting) { countUp(el); o.disconnect(); } })).observe(el);
});

/* form */
$('#form').onsubmit = e => { e.preventDefault(); $('#ok').hidden = false; e.target.reset(); };

/* scroll story: sticky stage, step by scroll progress, star -> scallop morph */
(() => {
  const sec = $('#story'), stage = $('.stage', sec), shape = $('#shape');
  const N = 220, STEPS = 4;
  let target = 0, m = 0, rot = 0, rotT = 0;
  const poly = (m, rot) => {
    const pts = [];
    for (let k = 0; k < N; k++) {
      const t = k / N * Math.PI * 2 + rot;
      const c = Math.cos(8 * t);
      const star = .82 + .15 * Math.sign(c) * Math.pow(Math.abs(c), .85);
      const cloud = .86 + .14 * Math.pow(Math.abs(Math.sin(6 * t)), .6);
      const r = (star + (cloud - star) * m) * .5;
      pts.push((50 + 100 * r * Math.cos(t - rot)).toFixed(2) + '% ' + (50 + 100 * r * Math.sin(t - rot)).toFixed(2) + '%');
    }
    return 'polygon(' + pts.join(',') + ')';
  };
  const ease = x => x * x * (3 - 2 * x);
  function onScroll() {
    const p = Math.min(Math.max((scrollY - sec.offsetTop) / (sec.offsetHeight - innerHeight), 0), .9999);
    const step = Math.floor(p * STEPS);
    stage.dataset.step = step;
    target = ease(Math.min(Math.max((p * STEPS - .55) / .5, 0), 1));
    rotT = p * Math.PI * .6;
  }
  function frame() {
    m += (target - m) * .09;
    rot += (rotT - rot) * .09;
    shape.style.clipPath = poly(m, rot);
    shape.style.transform = 'rotate(' + (-rot * 20).toFixed(2) + 'deg) scale(' + (1 + m * .08).toFixed(3) + ')';
    requestAnimationFrame(frame);
  }
  addEventListener('scroll', onScroll, { passive: true });
  onScroll(); frame();
})();
