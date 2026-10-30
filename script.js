const info = {
  t1: "Locales de moda, comida, salud y servicios en un solo lugar.",
  t2: "Acceso rápido por transporte público y vías principales.",
  t3: "Mercados locales a pocos minutos a pie.",
  t4: "Parques y espacios abiertos en los alrededores.",
  t5: "Teatros, galerías y venues culturales cercanos.",
  t6: "Universidades cercanas con miles de estudiantes.",
};

function activate(group, btn) {
  document.querySelectorAll(`[data-group=${group}] button`).forEach(x => x.classList.remove('active'));
  btn.classList.add('active');
}

document.querySelectorAll('[data-group=loc] button').forEach(b => b.onclick = () => {
  activate('loc', b);
  document.getElementById('loc-panel').textContent = info[b.dataset.tab];
});

const buildings = ["Torre Norte", "Plaza Central", "Edificio Río"];
const states = ['a', 'a', 'a', 'o', 'a', 'c', 'a', 'a', 'o', 'a', 'a', 'a'];
const units = [];
buildings.forEach((b, bi) => states.forEach((s, i) =>
  units.push({ b, n: `${bi + 1}.${i + 1}`, s, m2: 40 + ((i * 37 + bi * 23) % 160) })));

const plan = document.getElementById('plan');
function draw(b) {
  plan.innerHTML = '';
  units.filter(u => u.b === b).forEach(u => {
    const d = document.createElement('div');
    d.className = 'unit ' + u.s;
    d.textContent = 'Local ' + u.n;
    plan.appendChild(d);
  });
}
draw(buildings[0]);
document.querySelectorAll('[data-group=bld] button').forEach(b => b.onclick = () => {
  activate('bld', b);
  draw(b.dataset.b);
});

const avail = units.filter(u => u.s === 'a');
const cards = document.getElementById('cards');
let shown = 0;
function more() {
  avail.slice(shown, shown + 4).forEach(u => cards.insertAdjacentHTML('beforeend',
    `<div class="card"><small>${u.b.toUpperCase()}</small><h3>Local ${u.n}</h3><p>Uso: Retail</p><p>Superficie: ${u.m2} m²</p><p>Precio: Consultar</p><a class="btn small" href="#contacto">Consultar</a></div>`));
  shown += 4;
  if (shown >= avail.length) document.getElementById('more').hidden = true;
}
more();
document.getElementById('more').onclick = more;

document.getElementById('form').onsubmit = e => {
  e.preventDefault();
  document.getElementById('ok').hidden = false;
  e.target.reset();
};
