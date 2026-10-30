const info = {
  1: "Locales de moda, comida, salud y servicios en un solo lugar.",
  2: "Acceso rápido por transporte público y vías principales.",
  3: "Mercados locales a pocos minutos a pie.",
  4: "Parques y espacios abiertos en los alrededores.",
  5: "Teatros, galerías y venues culturales cercanos.",
  6: "Universidades cercanas con miles de estudiantes.",
};
const buildings = [
  { name: "Torre Norte", text: "Torre Norte: locales de gran formato con vista a la plaza principal." },
  { name: "Plaza Central", text: "Plaza Central: el corazón del centro comercial, ideal para comida y servicios." },
  { name: "Edificio Río", text: "Edificio Río: unidades compactas para marcas independientes." },
];

function activate(group, btn) {
  document.querySelectorAll(`[data-group=${group}] button`).forEach(x => x.classList.remove('active'));
  btn.classList.add('active');
}

function showLoc(n) {
  document.getElementById('loc-img').src = `assets/loc-${n}.svg`;
  document.getElementById('loc-text').textContent = info[n];
}
showLoc(1);
document.querySelectorAll('[data-group=loc] button').forEach(b => b.onclick = () => {
  activate('loc', b);
  showLoc(b.dataset.tab);
});

const states = ['a', 'a', 'a', 'o', 'a', 'c', 'a', 'a', 'o', 'a', 'a', 'a'];
const units = [];
buildings.forEach((b, bi) => states.forEach((s, i) =>
  units.push({ b: bi, n: `${bi + 1}.${i + 1}`, s, m2: 40 + ((i * 37 + bi * 23) % 160) })));

const plan = document.getElementById('plan');
function drawBuilding(bi) {
  document.getElementById('bld-img').src = `assets/bld-${bi + 1}.svg`;
  document.getElementById('bld-text').textContent = buildings[bi].text;
  plan.innerHTML = '';
  units.filter(u => u.b === bi).forEach(u => {
    const d = document.createElement('div');
    d.className = 'unit ' + u.s;
    d.textContent = 'Local ' + u.n;
    plan.appendChild(d);
  });
}
drawBuilding(0);
document.querySelectorAll('[data-group=bld] button').forEach(b => b.onclick = () => {
  activate('bld', b);
  drawBuilding(+b.dataset.b);
});

const avail = units.filter(u => u.s === 'a');
const cards = document.getElementById('cards');
let shown = 0;
function more() {
  avail.slice(shown, shown + 4).forEach(u => cards.insertAdjacentHTML('beforeend',
    `<div class="card"><img src="assets/unit.svg" alt=""><small>${buildings[u.b].name.toUpperCase()}</small><h3>Local ${u.n}</h3><p>Uso: Retail</p><p>Superficie: ${u.m2} m²</p><p>Precio: Consultar</p><a class="btn small" href="#contacto">Consultar</a></div>`));
  shown += 4;
  if (shown >= avail.length) document.getElementById('more').hidden = true;
}
more();
document.getElementById('more').onclick = more;

document.getElementById('menu').onclick = () => document.getElementById('links').classList.toggle('open');
document.querySelectorAll('#links a').forEach(a => a.addEventListener('click', () =>
  document.getElementById('links').classList.remove('open')));

document.getElementById('form').onsubmit = e => {
  e.preventDefault();
  document.getElementById('ok').hidden = false;
  e.target.reset();
};
