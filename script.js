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

/* buildings, units, plan */
const buildings = [
  { name: 'Torre Norte', text: 'Torre Norte: locales de gran formato con vista a la plaza principal. Ideal para marcas ancla y restaurantes.' },
  { name: 'Plaza Central', text: 'Plaza Central: el corazón del centro comercial, con gran flujo peatonal para comida y servicios.' },
  { name: 'Edificio Río', text: 'Edificio Río: unidades compactas para marcas independientes, salones y tiendas de especialidad.' },
  { name: 'Patio Sur', text: 'Patio Sur: espacios abiertos pensados para gastronomía y ocio.' },
];
const pattern = ['a', 'a', 'o', 'a', 'a', 'c', 'a', 'a', 'o', 'a', 'a', 'a'];
const names = { a: 'DISPONIBLE', o: 'OCUPADO', c: 'PRÓXIMAMENTE' };
const units = [];
buildings.forEach((b, bi) => pattern.forEach((s, i) =>
  units.push({ b: bi, id: `${bi + 1}.${i + 1}`, i: i + 1, s, m2: 40 + ((i * 37 + bi * 23) % 160) })));

let current = 0;
const bt = $('#btabs');
buildings.forEach((b, i) => {
  const btn = document.createElement('button');
  btn.textContent = b.name;
  btn.onclick = () => { current = i; render(true); };
  bt.appendChild(btn);
});

function render(animate) {
  const wrap = $('.plan-wrap');
  const go = () => {
    $$('#btabs button').forEach((b, i) => b.classList.toggle('on', i === current));
    $('#bld-text').textContent = buildings[current].text;
    const list = units.filter(u => u.b === current);
    $('#ucards').innerHTML = list.map(u =>
      `<div class="uc ${u.s}" data-id="${u.id}"><span class="n">${u.i}</span><strong>Local ${u.id}</strong><span class="tag">${names[u.s]}</span></div>`).join('');
    $('#plan').innerHTML = list.map(u =>
      `<div class="cell ${u.s}" data-id="${u.id}">${u.i}</div>`).join('');
    $$('#ucards .uc, #plan .cell').forEach(el => {
      el.addEventListener('mouseenter', () => link(el.dataset.id, true));
      el.addEventListener('mouseleave', () => link(el.dataset.id, false));
      el.addEventListener('click', () => { location.hash = ''; $('#contacto').scrollIntoView(); });
    });
    wrap.classList.remove('fade');
  };
  if (animate) { wrap.classList.add('fade'); setTimeout(go, 400); } else go();
}
function link(id, on) {
  $$(`[data-id="${id}"]`).forEach(e => e.classList.toggle('hl', on));
}
render(false);

/* 3D tilt on plan */
const p3 = $('.plan3d'), plan = $('#plan');
p3.addEventListener('mousemove', e => {
  const r = p3.getBoundingClientRect();
  const x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
  plan.style.transform = `rotateX(${22 - y * 12}deg) rotateZ(${-x * 14}deg)`;
});
p3.addEventListener("mouseleave", () => plan.style.transform = "rotateX(22deg)");
plan.style.transform = "rotateX(22deg)";
plan.style.transformOrigin = 'center';

/* tilt on images */
$$('.tilt').forEach(img => {
  img.addEventListener('mousemove', e => {
    const r = img.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
    img.style.transform = `perspective(800px) rotateY(${x * 10}deg) rotateX(${-y * 10}deg) scale(1.03)`;
  });
  img.addEventListener('mouseleave', () => img.style.transform = '');
});

/* unit cards */
const UNIT_IMGS = ["https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=700&q=80","https://images.unsplash.com/photo-1472851294608-062f824d29cc?auto=format&fit=crop&w=700&q=80","https://images.unsplash.com/photo-1567401893414-76b7b1e5a7a5?auto=format&fit=crop&w=700&q=80","https://images.unsplash.com/photo-1604719312566-8912e9227c6a?auto=format&fit=crop&w=700&q=80","https://images.unsplash.com/photo-1528698827591-e19ccd7bc23d?auto=format&fit=crop&w=700&q=80"];
const avail = units.filter(u => u.s === 'a');
let shown = 0;
function more() {
  avail.slice(shown, shown + 4).forEach((u, k) => $('#cards').insertAdjacentHTML('beforeend',
    `<div class="card" style="--d:${k * .1}s"><img src="${UNIT_IMGS[(shown + k) % UNIT_IMGS.length]}" alt=""><small>${buildings[u.b].name}</small><h3>Local ${u.id}</h3><p>Uso: Retail</p><p>Superficie: ${u.m2} m²</p><p>Precio: Consultar</p><a class="pill sm ink" href="#contacto"><em>Detalles</em><em>Detalles</em></a><a class="pill sm ink" href="#contacto"><em>Consultar</em><em>Consultar</em></a></div>`));
  shown += 4;
  if (shown >= avail.length) $('#more').hidden = true;
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
