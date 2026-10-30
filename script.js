const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];

/* loader + initial animations */
window.addEventListener('load', () => setTimeout(() => {
  $('#loader').classList.add('done');
  document.body.classList.add('loaded');
}, 700));

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

/* map: Leaflet + CARTO dark tiles, centred on the project */
const HOME = [7.880597377317534, -72.48866796931321];
const map = L.map('map', { center: HOME, zoom: 15, zoomControl: false, scrollWheelZoom: false });
L.control.zoom({ position: 'bottomright' }).addTo(map);
L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '&copy; OpenStreetMap contributors' }).addTo(map);
map.on('click', () => map.scrollWheelZoom.enable());
map.on('mouseout', () => map.scrollWheelZoom.disable());
const label = (txt, cls = '') => L.divIcon({ className: 'mk ' + cls, html: `<i></i><b>${txt}</b>`, iconSize: [0, 0] });
L.marker(HOME, { icon: label('Rivers Mall', 'main'), zIndexOffset: 1000 }).addTo(map);

/* Category points are placeholders (offsets from the project): replace with real places */
const off = (dy, dx) => [HOME[0] + dy, HOME[1] + dx];
const places = [
  [['Locales', off(.0020, .0025)], ['Zona comercial', off(-.0025, -.0030)]],
  [['Transporte', off(.0030, -.0035)], ['Parada de bus', off(-.0020, .0035)]],
  [['Mercado', off(.0018, -.0040)], ['Plaza de mercado', off(-.0030, .0020)]],
  [['Parque', off(.0035, .0020)], ['Zona verde', off(-.0015, -.0045)]],
  [['Cultura', off(.0025, -.0020)], ['Centro cultural', off(-.0028, .0030)]],
  [['Universidad', off(.0030, .0040)], ['Instituto', off(-.0022, -.0025)]],
];
const layer = L.layerGroup().addTo(map);
function drawMap(i) {
  layer.clearLayers();
  places[i].forEach(([n, ll], k) => setTimeout(() => L.marker(ll, { icon: label(n) }).addTo(layer), k * 150));
  map.flyTo(HOME, 15.5, { duration: 1.2 });
}
drawMap(0);
$$('#loc-list li').forEach(li => li.onclick = () => {
  $$('#loc-list li').forEach(x => x.classList.remove('on'));
  li.classList.add('on');
  drawMap(+li.dataset.i);
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
const avail = units.filter(u => u.s === 'a');
let shown = 0;
function more() {
  avail.slice(shown, shown + 4).forEach((u, k) => $('#cards').insertAdjacentHTML('beforeend',
    `<div class="card" style="--d:${k * .1}s"><img src="https://images.unsplash.com/photo-1472851294608-062f824d29cc?auto=format&fit=crop&w=700&q=80" alt=""><small>${buildings[u.b].name}</small><h3>Local ${u.id}</h3><p>Uso: Retail</p><p>Superficie: ${u.m2} m²</p><p>Precio: Consultar</p><a class="pill sm ink" href="#contacto"><em>Detalles</em><em>Detalles</em></a><a class="pill sm ink" href="#contacto"><em>Consultar</em><em>Consultar</em></a></div>`));
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
      const star = .74 + .26 * Math.sign(c) * Math.pow(Math.abs(c), .55);
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
