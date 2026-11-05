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

L.polygon(PERIMETER, { color: '#ffffff', weight: 7, opacity: .95, fill: false, lineJoin: 'round', interactive: false }).addTo(map);
const lot = L.polygon(PERIMETER, { color: '#2f7fc4', weight: 3.5, lineJoin: 'round', fillColor: '#3b76a8', fillOpacity: .18, className: 'lot' }).addTo(map);
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

let tour, toured = false;
new IntersectionObserver((es, o) => es.forEach(e => {
  if (e.isIntersecting && !toured) {
    toured = true; o.disconnect();
    items.forEach((x, k) => x.classList.toggle('on', k === 0));
    tour = setTimeout(() => { showView(1); tour = setTimeout(() => showView(2), 3200); }, 1800);
  }
}), { threshold: .5 }).observe($('#map'));

/* MULTI-LEVEL DATA: SÓTANO, PRIMER PISO, OFICINAS */
const STATE = { a: 'Disponible', o: 'Ocupado', c: 'Próximamente' };

const PDF = { Y1: 3180, X0: -390 };
const toPlan = ([x1, y1, x2, y2]) => [PDF.Y1 - y2, x1 - PDF.X0, y2 - y1, x2 - x1];
const geoP1 = {
  '5': [-316, 2741, -161, 2792], '6': [-316, 2794, -161, 2844], '7': [-316, 2846, -161, 2896], '8': [-316, 2898, -161, 2948],
  '1': [-160, 3001, -110, 3157], '2': [-107, 3001, -58, 3157], '3': [-56, 3001, -6, 3157], '4': [-3, 3001, 47, 3157],
  'cv': [50, 3001, 205, 3157],
};

let cachedBaseP1 = '';

const LEVELS = {
  'sotano': {
    name: 'Sótano',
    eyebrow: 'Edificio Norte · Nivel Sótano (-1)',
    title: 'Estacionamiento & Salud',
    lead: 'Explora la distribución del sótano: parqueaderos subterráneos, zonas de movilidad eléctrica y gimnasio de alto rendimiento.',
    units: [
      {
        id: 's1',
        name: 'Parqueadero Principal',
        s: 'a',
        area: '45+ Celdas',
        use: 'Estacionamiento Vehicular',
        photo: 'assets/sotano-parqueadero.webp',
        desc: 'Bahías de estacionamiento subterráneo con columnas numeradas, demarcación vial de alta visibilidad, circuito cerrado de TV e iluminación LED continua.'
      },
      {
        id: 's2',
        name: 'Movilidad Eléctrica & Bicis',
        s: 'a',
        area: '24 Puestos',
        use: 'Carga EV & Cicloparqueadero',
        photo: 'assets/sotano-bici.png',
        desc: 'Estaciones de recarga rápida para autos y motos eléctricas, y zona segura de bici-parking con estación de aire y herramientas.'
      },
      {
        id: 's3',
        name: 'Gimnasio de Alto Rendimiento',
        s: 'c',
        area: '185,00 m²',
        use: 'Salud & Fitness',
        photo: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=700&q=80',
        desc: 'Espacio deportivo equipado con zona de musculación, área de cardio y vestieres de primer nivel para ejecutivos y visitantes.'
      },
      {
        id: 's4',
        name: 'Rampa de Acceso & Control',
        s: 'o',
        area: 'Doble Carril',
        use: 'Circulación & Seguridad',
        photo: 'assets/sotano-acceso.webp',
        desc: 'Ingreso y salida vehicular automatizados con lectura digital de placas LPR, barreras de tráfico y guardas de seguridad 24/7.'
      },
      {
        id: 's5',
        name: 'Cuartos Técnicos & Subestación',
        s: 'o',
        area: '68,00 m²',
        use: 'Infraestructura & Redes',
        photo: 'assets/hero.webp',
        desc: 'Infraestructura técnica central: subestación eléctrica, planta de suplencia del 100%, bombas de presión constante y tanques de reserva hídrica.'
      }
    ],
    getSvg: function(units) {
      return `<svg viewBox="0 0 750 615" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Plano de distribución del Sótano">
        <defs>
          <pattern id="sotGrid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.03)" stroke-width="1"/>
          </pattern>
          <pattern id="parkingLines" width="22" height="38" patternUnits="userSpaceOnUse">
            <line x1="0" y1="0" x2="0" y2="38" stroke="rgba(255,255,255,0.22)" stroke-width="1.2" stroke-dasharray="2 2"/>
          </pattern>
          <pattern id="rampStripe" width="16" height="16" patternTransform="rotate(45)" patternUnits="userSpaceOnUse">
            <line x1="0" y1="0" x2="0" y2="16" stroke="rgba(255,255,255,0.12)" stroke-width="4"/>
          </pattern>
        </defs>
        <rect width="750" height="615" fill="#171f22"/>
        <rect x="15" y="15" width="720" height="585" fill="url(#sotGrid)"/>
        
        <!-- Perimeter Wall Outline -->
        <polygon points="20,40 530,40 530,210 725,210 725,495 530,495 530,580 20,580" fill="#1d262a" stroke="#4d5b62" stroke-width="2"/>
        
        <!-- Structural Columns Grid -->
        ${[60, 160, 260, 360, 460, 560, 660].map(cx => 
          [80, 180, 280, 380, 480, 550].map(cy => 
            (cx <= 530 || cy >= 210) ? `<rect x="${cx-4}" y="${cy-4}" width="8" height="8" fill="#61747d" stroke="#8da0a8" stroke-width="1"/>` : ''
          ).join('')
        ).join('')}

        <!-- Circulation Drive Aisles -->
        <path d="M 210,130 L 210,480 L 530,480" fill="none" stroke="rgba(255,255,255,0.18)" stroke-width="2.5" stroke-dasharray="8 6"/>
        <path d="M 370,130 L 370,480" fill="none" stroke="rgba(255,255,255,0.15)" stroke-width="2" stroke-dasharray="6 6"/>
        <path d="M 530,350 L 710,350" fill="none" stroke="rgba(255,255,255,0.2)" stroke-width="2.5" stroke-dasharray="8 6"/>

        <!-- Ramp Pattern Overlay & Text -->
        <rect x="545" y="225" width="165" height="255" fill="url(#rampStripe)" opacity="0.6"/>
        <text x="627" y="325" fill="#8da0a8" font-size="11" font-weight="700" letter-spacing="3" text-anchor="middle" transform="rotate(-90 627 325)">RAMPA VEHICULAR (IN/OUT)</text>

        <!-- Parking Stalls Pattern -->
        <rect x="235" y="235" width="270" height="210" fill="url(#parkingLines)" opacity="0.5"/>

        <!-- Interactive Units -->
        <g class="su a" data-id="s1" tabindex="0" role="button" aria-label="Parqueadero Principal">
          <rect x="230" y="225" width="280" height="230" rx="4"/>
          <circle cx="370" cy="340" r="13"/>
          <text x="370" y="344" text-anchor="middle">S1</text>
        </g>

        <g class="su a" data-id="s2" tabindex="0" role="button" aria-label="Movilidad Eléctrica & Bicis">
          <rect x="35" y="225" width="155" height="165" rx="4"/>
          <circle cx="112" cy="307" r="13"/>
          <text x="112" y="311" text-anchor="middle">S2</text>
        </g>

        <g class="su c" data-id="s3" tabindex="0" role="button" aria-label="Gimnasio Equipado">
          <rect x="230" y="55" width="280" height="145" rx="4"/>
          <circle cx="370" cy="127" r="13"/>
          <text x="370" y="131" text-anchor="middle">S3</text>
        </g>

        <g class="su o" data-id="s4" tabindex="0" role="button" aria-label="Rampa de Acceso & Control">
          <rect x="545" y="225" width="165" height="255" rx="4"/>
          <circle cx="627" cy="352" r="13"/>
          <text x="627" y="356" text-anchor="middle">S4</text>
        </g>

        <g class="su o" data-id="s5" tabindex="0" role="button" aria-label="Cuartos Técnicos & Subestación">
          <rect x="35" y="410" width="155" height="155" rx="4"/>
          <circle cx="112" cy="487" r="13"/>
          <text x="112" y="491" text-anchor="middle">S5</text>
        </g>
      </svg>`;
    }
  },

  'primer-piso': {
    name: 'Primer Piso',
    eyebrow: 'Edificio Norte · Primer piso',
    title: 'Donde tu marca pertenece',
    lead: 'Explora el plano del primer piso y presiona cada área para ver su detalle, estado y superficie.',
    units: [
      { id: '5', name: 'Local 5', s: 'a', area: '105,53 m²', use: 'Retail / Comercio', photo: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=700&q=80', desc: 'Local comercial en corredor principal con doble vitrina de exposición y acceso directo desde la plaza peatonal.' },
      { id: '6', name: 'Local 6', s: 'a', area: '105,53 m²', use: 'Retail / Comercio', photo: 'https://images.unsplash.com/photo-1472851294608-062f824d29cc?auto=format&fit=crop&w=700&q=80', desc: 'Espacio ideal para tiendas de moda o calzado con punto hidráulico y excelente iluminación natural.' },
      { id: '7', name: 'Local 7', s: 'a', area: '104,20 m²', use: 'Retail / Comercio', photo: 'https://images.unsplash.com/photo-1567401893414-76b7b1e5a7a5?auto=format&fit=crop&w=700&q=80', desc: 'Ubicación contigua al núcleo comercial con alto flujo peatonal y facilidades de adecuación inmediata.' },
      { id: '8', name: 'Local 8', s: 'a', area: '104,20 m²', use: 'Retail / Comercio', photo: 'https://images.unsplash.com/photo-1604719312566-8912e9227c6a?auto=format&fit=crop&w=700&q=80', desc: 'Local en esquina interior frente a la circulación central con visibilidad de 180 grados.' },
      { id: '1', name: 'Local 1', s: 'a', area: '102,49 m²', use: 'Retail / Comercio', photo: 'https://images.unsplash.com/photo-1528698827591-e19ccd7bc23d?auto=format&fit=crop&w=700&q=80', desc: 'Espacio comercial sobre bulevar principal, ideal para marca ancla o concepto insignia.' },
      { id: '2', name: 'Local 2', s: 'a', area: '102,49 m²', use: 'Retail / Comercio', photo: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=700&q=80', desc: 'Local regular con frente acristalado de piso a techo y altura libre de 4,20 metros para mezzanine.' },
      { id: '3', name: 'Local 3', s: 'a', area: '102,49 m²', use: 'Retail / Comercio', photo: 'https://images.unsplash.com/photo-1472851294608-062f824d29cc?auto=format&fit=crop&w=700&q=80', desc: 'Unidad comercial optimizada para marcas de retail, telefonía, óptica o servicios financieros.' },
      { id: '4', name: 'Local 4', s: 'a', area: '102,49 m²', use: 'Retail / Comercio', photo: 'https://images.unsplash.com/photo-1567401893414-76b7b1e5a7a5?auto=format&fit=crop&w=700&q=80', desc: 'Excelente ubicación vecina a Cruz Verde y acceso a baterías de baños de visitantes.' },
      { id: 'cv', name: 'Cruz Verde', s: 'o', area: '292,41 m²', use: 'Farmacia & Salud', photo: 'https://images.unsplash.com/photo-1576602976047-174e57a47881?auto=format&fit=crop&w=700&q=80', desc: 'Sede consolidada de farmacia y productos de salud y bienestar con atención ininterrumpida.' },
    ],
    getSvg: function(units) {
      let svg = '<svg viewBox="0 0 750 615" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Plano del primer piso, Edificio Norte">' + cachedBaseP1;
      units.forEach(u => {
        const [x, y, w, h] = toPlan(geoP1[u.id]);
        const cx = x + w / 2, cy = y + h / 2;
        svg += '<g class="su ' + u.s + '" data-id="' + u.id + '" tabindex="0" role="button" aria-label="' + u.name + '"><rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '"/>' +
          '<circle cx="' + cx + '" cy="' + cy + '" r="11"/><text x="' + cx + '" y="' + (cy + 4) + '" text-anchor="middle">' + (u.id === 'cv' ? 'CV' : u.id) + '</text></g>';
      });
      return svg + '</svg>';
    }
  },

  'oficinas': {
    name: 'Oficinas',
    eyebrow: 'Edificio Norte · Piso 3 & Oficinas Corporativas',
    title: 'Espacios de Trabajo & Coworking',
    lead: 'Explora las oficinas corporativas amobladas (5-10 personas), sala de juntas, cafetería y terraza panorámica.',
    units: [
      {
        id: 'of1',
        name: 'Oficina Privada 1',
        s: 'a',
        area: '42,50 m²',
        use: 'Oficina Corporativa (5-10 pers.)',
        photo: 'assets/oficinas-privada.jpg',
        desc: 'Módulo corporativo privado completamente amoblado, con cielo raso alistonado en madera natural, amplios ventanales y conectividad de alta velocidad.'
      },
      {
        id: 'of2',
        name: 'Oficina Privada 2',
        s: 'a',
        area: '38,20 m²',
        use: 'Oficina Corporativa (4-8 pers.)',
        photo: 'assets/oficinas-trabajo.webp',
        desc: 'Espacio privado de trabajo con luz natural, mobiliario ergonómico integrado, aire acondicionado independiente y cerradura electrónica.'
      },
      {
        id: 'of3',
        name: 'Sala de Juntas Corporativa',
        s: 'a',
        area: '34,80 m²',
        use: 'Reuniones & Directorio',
        photo: 'assets/oficinas-juntas.jpg',
        desc: 'Equipada con pantalla de 85 pulgadas para videoconferencias, mesa ejecutiva para 12 directivos y tratamiento acústico de panel ranurado WPC.'
      },
      {
        id: 'of4',
        name: 'Terraza & Deck Lounge',
        s: 'a',
        area: '85,00 m²',
        use: 'Terraza Panorámica Común',
        photo: 'assets/oficinas-terraza.png',
        desc: 'Deck al aire libre con cielo raso de madera, zonas lounge, vegetación paisajística y vista abierta hacia los cerros de Cúcuta.'
      },
      {
        id: 'of5',
        name: 'Cafetería & Barra Mirador',
        s: 'a',
        area: '48,00 m²',
        use: 'Breakout & Cafetería Comunal',
        photo: 'assets/oficinas-cafeteria.jpg',
        desc: 'Área comunal de descanso con barra lineal de ventanales, isla de servicio de café, estación de microondas y mesas comunales.'
      },
      {
        id: 'of6',
        name: 'Cabinas Acústicas',
        s: 'a',
        area: '12,00 m²',
        use: 'Phone Booths Privados',
        photo: 'assets/oficinas-cabinas.webp',
        desc: 'Módulos insonorizados para llamadas telefónicas confidenciales y videollamadas individuales sin interrupciones.'
      },
      {
        id: 'of7',
        name: 'Batería Sanitaria & PMR',
        s: 'o',
        area: '32,00 m²',
        use: 'Baños de Oficinas & Accesibilidad',
        photo: 'assets/oficinas-comun.webp',
        desc: 'Núcleo sanitario contemporáneo con mesones flotantes, acabados de madera, espejos retroiluminados y baño accesible PMR bajo norma universal.'
      }
    ],
    getSvg: function(units) {
      return `<svg viewBox="0 0 750 615" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Plano de distribución de Oficinas Piso 3">
        <defs>
          <pattern id="ofGrid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.03)" stroke-width="1"/>
          </pattern>
          <pattern id="woodDeck" width="12" height="12" patternUnits="userSpaceOnUse">
            <line x1="0" y1="0" x2="12" y2="0" stroke="rgba(229,178,90,0.25)" stroke-width="2"/>
          </pattern>
        </defs>
        <rect width="750" height="615" fill="#171f22"/>
        <rect x="15" y="15" width="720" height="585" fill="url(#ofGrid)"/>

        <!-- Perimeter Wall Outline (Piso 3 + Terraza) -->
        <polygon points="20,40 580,40 580,210 710,210 710,580 20,580" fill="#1d262a" stroke="#4d5b62" stroke-width="2"/>

        <!-- Structural Columns Grid -->
        ${[60, 160, 260, 360, 460, 560, 660].map(cx => 
          [80, 180, 280, 380, 480, 550].map(cy => 
            (cx <= 580 || cy >= 210) ? `<rect x="${cx-4}" y="${cy-4}" width="8" height="8" fill="#61747d" stroke="#8da0a8" stroke-width="1"/>` : ''
          ).join('')
        ).join('')}

        <!-- Deck Texture for Terraza -->
        <rect x="35" y="235" width="165" height="185" fill="url(#woodDeck)"/>
        <text x="117" y="325" fill="#e5b25a" font-size="10.5" font-weight="700" letter-spacing="2" text-anchor="middle">DECK PANORÁMICO</text>

        <!-- Circulation Lines -->
        <path d="M 210,130 L 210,480" fill="none" stroke="rgba(255,255,255,0.2)" stroke-width="2" stroke-dasharray="6 6"/>
        <path d="M 210,220 L 570,220" fill="none" stroke="rgba(255,255,255,0.2)" stroke-width="2" stroke-dasharray="6 6"/>

        <!-- Interactive Units -->
        <g class="su a" data-id="of1" tabindex="0" role="button" aria-label="Oficina Ejecutiva 1">
          <rect x="230" y="55" width="105" height="150" rx="4"/>
          <circle cx="282" cy="130" r="13"/>
          <text x="282" y="134" text-anchor="middle">OF1</text>
        </g>

        <g class="su a" data-id="of2" tabindex="0" role="button" aria-label="Oficina Ejecutiva 2">
          <rect x="345" y="55" width="105" height="150" rx="4"/>
          <circle cx="397" cy="130" r="13"/>
          <text x="397" y="134" text-anchor="middle">OF2</text>
        </g>

        <g class="su a" data-id="of3" tabindex="0" role="button" aria-label="Sala de Juntas Corporativa">
          <rect x="460" y="55" width="110" height="150" rx="4"/>
          <circle cx="515" cy="130" r="13"/>
          <text x="515" y="134" text-anchor="middle">OF3</text>
        </g>

        <g class="su a" data-id="of4" tabindex="0" role="button" aria-label="Terraza & Deck Lounge">
          <rect x="35" y="230" width="165" height="190" rx="4"/>
          <circle cx="117" cy="345" r="13"/>
          <text x="117" y="349" text-anchor="middle">OF4</text>
        </g>

        <g class="su a" data-id="of5" tabindex="0" role="button" aria-label="Cafetería & Barra Mirador">
          <rect x="35" y="435" width="165" height="135" rx="4"/>
          <circle cx="117" cy="502" r="13"/>
          <text x="117" y="506" text-anchor="middle">OF5</text>
        </g>

        <g class="su a" data-id="of6" tabindex="0" role="button" aria-label="Cabinas Acústicas">
          <rect x="230" y="240" width="130" height="110" rx="4"/>
          <circle cx="295" cy="295" r="13"/>
          <text x="295" y="299" text-anchor="middle">OF6</text>
        </g>

        <g class="su o" data-id="of7" tabindex="0" role="button" aria-label="Batería Sanitaria & PMR">
          <rect x="375" y="240" width="195" height="110" rx="4"/>
          <circle cx="472" cy="295" r="13"/>
          <text x="472" y="299" text-anchor="middle">OF7</text>
        </g>
      </svg>`;
    }
  }
};

let activeLevel = 'primer-piso';
let currentUnits = LEVELS[activeLevel].units;

function renderLevel(lvlKey, targetUnitId = null) {
  if (!LEVELS[lvlKey]) return;
  activeLevel = lvlKey;
  const lvl = LEVELS[lvlKey];
  currentUnits = lvl.units;

  // Update tabs UI
  $$('#levelTabs .ltab').forEach(b => {
    const isThis = b.dataset.lvl === lvlKey;
    b.classList.toggle('on', isThis);
    b.setAttribute('aria-selected', isThis ? 'true' : 'false');
  });

  // Update header text
  if ($('#planEyebrow')) $('#planEyebrow').textContent = lvl.eyebrow;
  if ($('#planTitle')) $('#planTitle').textContent = lvl.title;
  if ($('#planLead')) $('#planLead').textContent = lvl.lead;
  if ($('#unitsCount')) $('#unitsCount').textContent = currentUnits.length + ' unidades';

  // Render left unit cards
  $('#ucards').innerHTML = currentUnits.map(u => `
    <button class="uc ${u.s}" data-id="${u.id}">
      <div class="uc-top">
        <strong>${u.name}</strong>
        <span class="tag">${STATE[u.s]}</span>
      </div>
      <div class="uc-bottom">
        <span>${u.area || 'Consultar'}</span>
        <span class="uc-btn-hint">Ver plano ↗</span>
      </div>
    </button>
  `).join('');

  // Render floor plan SVG
  $('#planimg').innerHTML = lvl.getSvg(currentUnits);

  // Bind interactive events for cards and SVG rooms
  $$('#ucards .uc, #planimg .su').forEach(el => {
    el.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openUnitModal(el.dataset.id);
      }
    });
    el.addEventListener('click', () => {
      openUnitModal(el.dataset.id);
    });
    el.addEventListener('mouseenter', () => link(el.dataset.id, true));
    el.addEventListener('mouseleave', () => link(el.dataset.id, false));
  });

  // Highlight initial space on plan
  const selectId = targetUnitId && currentUnits.some(u => u.id === targetUnitId) ? targetUnitId : currentUnits[0].id;
  highlightUnit(selectId);

  // If explicitly requested via data-go, also open the modal
  if (targetUnitId) {
    openUnitModal(targetUnitId);
  }
}

function highlightUnit(id) {
  $$('#ucards .uc, #planimg .su').forEach(el => el.classList.toggle('on', el.dataset.id === id));
}

function link(id, on) {
  $$('[data-id="' + id + '"]').forEach(el => el.classList.toggle('hl', on));
}

function openUnitModal(id) {
  const u = currentUnits.find(x => x.id === id);
  if (!u) return;

  highlightUnit(id);

  const lvl = LEVELS[activeLevel];
  if ($('#umEyebrow')) $('#umEyebrow').textContent = lvl.eyebrow;
  if ($('#umTitle')) $('#umTitle').textContent = u.name;

  if ($('#umStateBadge')) {
    $('#umStateBadge').className = 'um-state-badge ' + u.s;
    $('#umStateBadge').textContent = STATE[u.s];
  }
  if ($('#umAreaBadge')) $('#umAreaBadge').textContent = u.area || 'Consultar superficie';
  if ($('#umAreaVal')) $('#umAreaVal').textContent = u.area || 'Consultar';

  const defaultUse = activeLevel === 'oficinas' ? 'Oficinas / Corporativo' :
                     activeLevel === 'sotano' ? 'Parqueadero & Servicios' : 'Retail / Comercio';
  if ($('#umUse')) $('#umUse').textContent = u.use || defaultUse;

  if ($('#umHeightVal')) {
    $('#umHeightVal').textContent = activeLevel === 'sotano' ? '3,60 m altura libre' :
                                    activeLevel === 'oficinas' ? '3,80 m altura libre' : '4,20 m (Apto Mezzanine)';
  }
  if ($('#umFacadeVal')) {
    $('#umFacadeVal').textContent = activeLevel === 'oficinas' ? 'Ventanal panorámico continuo' :
                                    activeLevel === 'sotano' ? 'Acceso vehicular y peatonal' : 'Vitrina piso a techo';
  }

  if ($('#umDesc')) {
    $('#umDesc').textContent = u.desc || (u.name + ' ubicado en ' + lvl.eyebrow + '. Espacio comercial estratégico con excelente visibilidad y flujo peatonal constante dentro del complejo Rivers Mall Cúcuta.');
  }

  if ($('#umPhotoImg')) {
    const fallbackPhoto = 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=900&q=80';
    $('#umPhotoImg').src = u.photo || fallbackPhoto;
    $('#umPhotoImg').alt = u.name;
  }

  if ($('#umPlanWrap')) {
    // Show architectural plan highlighting current unit
    $('#umPlanWrap').innerHTML = lvl.getSvg(currentUnits);
    const activeEl = $('#umPlanWrap [data-id="' + id + '"]');
    if (activeEl) activeEl.classList.add('on');
  }

  // Switch to default tab
  switchUmTab('plan');

  const modal = $('#unitModal');
  if (modal) {
    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }
}

function closeUnitModal() {
  const modal = $('#unitModal');
  if (modal) {
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }
}

function switchUmTab(viewName) {
  $$('.um-tab').forEach(t => t.classList.toggle('on', t.dataset.view === viewName));
  if ($('#umViewPlan')) $('#umViewPlan').classList.toggle('on', viewName === 'plan');
  if ($('#umViewPhoto')) $('#umViewPhoto').classList.toggle('on', viewName === 'photo');
}

// Setup Unit Modal Event Handlers
(() => {
  const closeBtn = $('#unitModalClose');
  const overlay = $('#unitModalOverlay');
  if (closeBtn) closeBtn.onclick = closeUnitModal;
  if (overlay) overlay.onclick = closeUnitModal;

  window.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeUnitModal();
  });

  // Tab switching inside modal
  $$('.um-tab').forEach(t => {
    t.addEventListener('click', () => switchUmTab(t.dataset.view));
  });



  const contactBtn = $('#umContactBtn');
  if (contactBtn) {
    contactBtn.addEventListener('click', () => closeUnitModal());
  }
})();

// Bind level selector tabs
$$('#levelTabs .ltab').forEach(b => {
  b.onclick = () => renderLevel(b.dataset.lvl);
});

// Load Primer Piso SVG base and initialize
fetch('assets/plano-base.svg').then(r => r.text()).then(t => {
  const open = t.indexOf('>') + 1, close = t.lastIndexOf('</svg>');
  cachedBaseP1 = t.slice(open, close);
  renderLevel('primer-piso');
}).catch(() => {
  cachedBaseP1 = '';
  renderLevel('primer-piso');
});

/* tilt on images */
$$('.tilt').forEach(img => {
  img.addEventListener('mousemove', e => {
    const r = img.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
    img.style.transform = 'perspective(800px) rotateY(' + (x * 10) + 'deg) rotateX(' + (-y * 10) + 'deg) scale(1.03)';
  });
  img.addEventListener('mouseleave', () => img.style.transform = '');
});

/* available units cards section */
const photos = ['1441986300917-64674bd600d8', '1472851294608-062f824d29cc', '1567401893414-76b7b1e5a7a5', '1604719312566-8912e9227c6a', '1528698827591-e19ccd7bc23d'];
const photo = i => 'https://images.unsplash.com/photo-' + photos[i % photos.length] + '?auto=format&fit=crop&w=700&q=80';

// Combine featured available units across levels
const allAvail = [
  ...LEVELS['primer-piso'].units.filter(u => u.s === 'a').map(u => ({ ...u, lvl: 'primer-piso', lvlLabel: 'Primer piso' })),
  ...LEVELS['oficinas'].units.filter(u => u.s === 'a').map(u => ({ ...u, lvl: 'oficinas', lvlLabel: 'Piso 3 · Oficinas' })),
  ...LEVELS['sotano'].units.filter(u => u.s === 'a').map(u => ({ ...u, lvl: 'sotano', lvlLabel: 'Nivel Sótano' })),
];

let shown = 0;
function more() {
  allAvail.slice(shown, shown + 4).forEach((u, k) => {
    const cardImg = u.photo || photo(shown + k);
    $('#cards').insertAdjacentHTML('beforeend',
      '<div class="card" style="--d:' + (k * .1) + 's"><img src="' + cardImg + '" alt="' + u.name + '"><small>Edificio Norte · ' + u.lvlLabel + '</small><h3>' + u.name + '</h3><p>Uso: ' + (u.use || 'Retail') + '</p><p>Superficie: ' + (u.area || 'Consultar') + '</p><p>Precio: Consultar</p><a class="pill sm ink" href="#plano" data-go="' + u.id + '" data-lvl="' + u.lvl + '"><em>Ver en plano</em><em>Ver en plano</em></a><a class="pill sm ink" href="#contacto"><em>Consultar</em><em>Consultar</em></a></div>'
    );
  });
  shown += 4;
  if (shown >= allAvail.length) $('#more').hidden = true;
  $$('[data-go]').forEach(el => {
    el.onclick = () => {
      const lvl = el.dataset.lvl || 'primer-piso';
      renderLevel(lvl, el.dataset.go);
    };
  });
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
