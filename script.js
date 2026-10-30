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

/* map: satellite, starts on the city and zooms in to the project; logo marker; red lot perimeter */
const HOME = [7.880597377317534, -72.48866796931321];
/* Perimeter traced from the red outline of the client's reference image (610x652 px).
   Calibrated against the earlier yellow outline: pin tip = HOME at (310,330), 0.2376 m/px. */
const RED_PX = [[275, 125], [300, 145], [380, 195], [432, 238], [440, 262], [432, 330], [412, 405], [385, 470], [335, 520], [290, 560], [226, 592], [190, 568], [150, 525], [113, 490], [110, 466], [128, 443], [165, 420], [198, 385], [215, 340], [232, 295], [246, 240], [258, 190], [268, 150]];
const MPP = 0.2376, PIN = [310, 330];
const PERIMETER = RED_PX.map(([x, y]) => [
  HOME[0] - ((y - PIN[1]) * MPP) / 111320,
  HOME[1] + ((x - PIN[0]) * MPP) / 110270,
]);

const map = L.map('map', { center: HOME, zoom: 12, maxZoom: 19, zoomControl: false, scrollWheelZoom: false });
L.control.zoom({ position: 'topleft' }).addTo(map);
L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
  maxZoom: 19, attribution: 'Tiles &copy; Esri'
}).addTo(map);
map.on('click', () => map.scrollWheelZoom.enable());
map.on('mouseout', () => map.scrollWheelZoom.disable());

const lot = L.polygon(PERIMETER, { color: '#e11d1d', weight: 4, lineJoin: 'round', fillColor: '#e11d1d', fillOpacity: .1, className: 'lot' }).addTo(map);
const logoPin = L.divIcon({
  className: 'logopin', iconSize: [64, 78], iconAnchor: [32, 74],
  html: '<div class="lp"><img src="assets/logo-mark.svg" alt="Rivers Mall"></div>'
});
L.marker(HOME, { icon: logoPin, title: 'Rivers Mall Cúcuta', zIndexOffset: 1000 }).addTo(map);

const fits = {
  0: () => map.flyTo(HOME, 12.6, { duration: 2.2 }),
  1: () => map.flyTo(HOME, 16, { duration: 2.6 }),
  2: () => map.flyToBounds(lot.getBounds().pad(.35), { duration: 3.2, maxZoom: 19 }),
};
const items = $$('#loc-list li');
function showView(i) {
  items.forEach((x, k) => x.classList.toggle('on', k === i));
  fits[i]();
}
items.forEach(li => li.onclick = () => { clearTimeout(tour); showView(+li.dataset.i); });
/* intro: city first, then closer, finally the project (starts when the map is on screen) */
let tour, toured = false;
new IntersectionObserver((es, o) => es.forEach(e => {
  if (e.isIntersecting && !toured) {
    toured = true; o.disconnect();
    items.forEach((x, k) => x.classList.toggle('on', k === 0));
    tour = setTimeout(() => { showView(1); tour = setTimeout(() => showView(2), 3200); }, 1800);
  }
}), { threshold: .5 }).observe($('#map'));

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
/* plan: real vectors from the Revit PDF (assets/plano-base.svg, already rotated 90deg clockwise: viewBox 750x615) */
const PDF = { Y1: 3180, X0: -390 };
const toPlan = ([x1, y1, x2, y2]) => [PDF.Y1 - y2, x1 - PDF.X0, y2 - y1, x2 - x1]; // x, y, w, h
const geo = {
  '5': [-316, 2741, -161, 2792], '6': [-316, 2794, -161, 2844], '7': [-316, 2846, -161, 2896], '8': [-316, 2898, -161, 2948],
  '1': [-160, 3001, -110, 3157], '2': [-107, 3001, -58, 3157], '3': [-56, 3001, -6, 3157], '4': [-3, 3001, 47, 3157],
  'cv': [50, 3001, 205, 3157],
};
function drawPlan(base) {
  let svg = '<svg viewBox="0 0 750 615" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Plano del primer piso, Edificio Norte">' + base;
  units.forEach(u => {
    const [x, y, w, h] = toPlan(geo[u.id]);
    const cx = x + w / 2, cy = y + h / 2;
    svg += '<g class="su ' + u.s + '" data-id="' + u.id + '" tabindex="0" role="button" aria-label="' + u.name + '"><rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '"/>' +
      '<circle cx="' + cx + '" cy="' + cy + '" r="11"/><text x="' + cx + '" y="' + (cy + 4) + '" text-anchor="middle">' + (u.id === 'cv' ? 'CV' : u.id) + '</text></g>';
  });
  $('#planimg').innerHTML = svg + '</svg>';
  $$('#ucards .uc, #planimg .su').forEach(el => {
    el.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); select(el.dataset.id); } });
    el.addEventListener('click', () => select(el.dataset.id));
    el.addEventListener('mouseenter', () => link(el.dataset.id, true));
    el.addEventListener('mouseleave', () => link(el.dataset.id, false));
  });
  select(units[0].id);
}
fetch('assets/plano-base.svg').then(r => r.text()).then(t => {
  const open = t.indexOf('>') + 1, close = t.lastIndexOf('</svg>');
  drawPlan(t.slice(open, close));
}).catch(() => drawPlan(''));

function select(id) {
  const u = units.find(x => x.id === id);
  $$('#ucards .uc, #planimg .su').forEach(el => el.classList.toggle('on', el.dataset.id === id));
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
