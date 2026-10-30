const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];

/* loader + initial animations */
window.addEventListener('load', () => setTimeout(() => {
  $('#loader').classList.add('done');
  document.body.classList.add('ready');
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

/* map list */
const places = [
  [['Centro', 30, 40], ['Mall Norte', 70, 30], ['Plaza', 60, 70], ['Terminal', 25, 72]],
  [['Estación 1', 35, 35], ['Estación 2', 68, 62], ['Terminal', 20, 70]],
  [['Mercado Central', 30, 30], ['Mercado Sur', 72, 70]],
  [['Parque Norte', 70, 28], ['Parque Río', 28, 68], ['Bosque', 75, 72]],
  [['Teatro', 32, 32], ['Museo', 66, 38], ['Galería', 50, 78]],
  [['Universidad A', 28, 36], ['Universidad B', 74, 60], ['Instituto', 40, 78]],
];
function drawMap(i) {
  $$('#map .pin:not(.main)').forEach(p => p.remove());
  places[i].forEach(([n, x, y], k) => {
    const p = document.createElement('span');
    p.className = 'pin';
    p.style.cssText = `left:${x}%;top:${y}%;animation-delay:${k * .12}s`;
    p.innerHTML = `<b>${n}</b>`;
    $('#map').appendChild(p);
  });
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
    `<div class="card" style="--d:${k * .1}s"><img src="assets/unit.svg" alt=""><small>${buildings[u.b].name}</small><h3>Local ${u.id}</h3><p>Uso: Retail</p><p>Superficie: ${u.m2} m²</p><p>Precio: Consultar</p><a class="pill sm dark" href="#contacto"><em>Detalles</em><em>Detalles</em></a><a class="pill sm dark" href="#contacto"><em>Consultar</em><em>Consultar</em></a></div>`));
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
