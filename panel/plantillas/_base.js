/* =========================================================================
   CHASIS DE COMPORTAMIENTO — PANEL CS PARACHIQUE
   Utilidades comunes a los cuatro tableros: formato, ventanas flotantes,
   insignias de estado, tablas, graficos y tooltips.

   REGLA DE NAVEGACION: ningun documento abre en otra pestana. Todo detalle
   se muestra en una ventana flotante dentro del propio tablero.
   ========================================================================= */

/* ---------- Formato ---------- */
const SOLES = new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN', minimumFractionDigits: 2 });
const NUM = new Intl.NumberFormat('es-PE');
const soles = (n) => SOLES.format(n || 0).replace('PEN', 'S/');
const num = (n) => NUM.format(n || 0);

const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'set', 'oct', 'nov', 'dic'];
function fecha(iso) {
  if (!iso) return '—';
  const [a, m, d] = iso.split('-').map(Number);
  return `${String(d).padStart(2, '0')} ${MESES[m - 1]} ${a}`;
}
function fechaCorta(iso) {
  if (!iso) return '—';
  const [a, m, d] = iso.split('-');
  return `${d}/${m}/${a}`;
}
function diasEntre(isoA, isoB) {
  return Math.round((new Date(isoB) - new Date(isoA)) / 86400000);
}
const esc = (s) => String(s == null ? '' : s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

/* ---------- Iconos de estado (el color nunca va solo) ---------- */
const ICONOS = {
  bien: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 8.5l3.2 3.2L13 5"/></svg>',
  aviso: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M8 2.5L15 14H1z"/><path d="M8 6.6v3.2"/><path d="M8 12h.01"/></svg>',
  serio: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="8" cy="8" r="6.3"/><path d="M8 4.8v3.7"/><path d="M8 11.1h.01"/></svg>',
  critico: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><circle cx="8" cy="8" r="6.3"/><path d="M10.2 5.8L5.8 10.2"/><path d="M5.8 5.8l4.4 4.4"/></svg>',
  neutro: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="8" cy="8" r="6.3"/><path d="M5.2 8h5.6"/></svg>',
  info: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="8" cy="8" r="6.3"/><path d="M8 7.4v3.6"/><path d="M8 5h.01"/></svg>',
  reloj: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="8" cy="8" r="6.3"/><path d="M8 4.6V8l2.3 1.6"/></svg>'
};

function insignia(texto, clase, icono) {
  return `<span class="insignia i-${clase}">${ICONOS[icono] || ICONOS.neutro}<span>${esc(texto)}</span></span>`;
}

/* Traduce el estado de un documento a insignia */
const MAPA_ESTADO = {
  'ENTREGADA':            ['bien', 'bien'],
  'ACEPTADA':             ['bien', 'bien'],
  'ATENDIDA':             ['bien', 'bien'],
  'COBRADA':              ['bien', 'bien'],
  'COBRADA PARCIALMENTE': ['aviso', 'aviso'],
  'EN PROCESO':           ['info', 'reloj'],
  'PENDIENTE':            ['serio', 'serio'],
  'OBSERVADA':            ['critico', 'critico'],
  'VENCIDA':              ['critico', 'critico'],
  'NO INICIADA':          ['neutro', 'neutro'],
  'PARCIAL':              ['aviso', 'aviso']
};
function insigniaEstado(estado) {
  const [clase, icono] = MAPA_ESTADO[estado] || ['neutro', 'neutro'];
  return insignia(estado, clase, icono);
}

/* El membrete solo es exigible a los INFORMES que emite la Supervision.
   Un documento recibido es externo, y una carta personal (propuesta,
   liquidacion) no se construye sobre el membrete del Consorcio. */
function insigniaMembrete(d, compacto) {
  if (d.flujo === 'RECIBIDA') return insignia(compacto ? 'n/a' : 'No aplica — documento externo', 'neutro', 'neutro');
  if (d.membrete) return insignia(compacto ? 'Si' : 'Incluido', 'bien', 'bien');
  if (d.clase === 'CARTA') return insignia(compacto ? 'n/a' : 'No aplica — carta personal', 'neutro', 'neutro');
  return insignia(compacto ? 'No' : 'Sin membrete', 'critico', 'critico');
}

const MAPA_NIVEL = { CRITICA: ['critico', 'critico'], SUSTANCIAL: ['serio', 'serio'], LEVE: ['aviso', 'aviso'] };

/* ---------- Ventana flotante ---------- */
function montarChasis() {
  if (document.getElementById('velo')) return;
  const velo = document.createElement('div');
  velo.className = 'velo';
  velo.id = 'velo';
  velo.innerHTML =
    '<div class="ventana" role="dialog" aria-modal="true" aria-labelledby="vtitulo">' +
      '<div class="ventana-cab">' +
        '<div><h3 id="vtitulo"></h3><div class="meta" id="vmeta"></div></div>' +
        '<button class="cerrar" id="vcerrar" aria-label="Cerrar ventana">&times;</button>' +
      '</div>' +
      '<div class="ventana-cuerpo" id="vcuerpo"></div>' +
    '</div>';
  document.body.appendChild(velo);

  const tostada = document.createElement('div');
  tostada.className = 'tostada';
  tostada.id = 'tostada';
  document.body.appendChild(tostada);

  const tip = document.createElement('div');
  tip.className = 'tip';
  tip.id = 'tip';
  document.body.appendChild(tip);

  document.getElementById('vcerrar').addEventListener('click', cerrarVentana);
  velo.addEventListener('click', (e) => { if (e.target === velo) cerrarVentana(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') cerrarVentana(); });
}

function abrirVentana(titulo, meta, cuerpoHtml) {
  montarChasis();
  document.getElementById('vtitulo').textContent = titulo;
  document.getElementById('vmeta').innerHTML = meta || '';
  document.getElementById('vcuerpo').innerHTML = cuerpoHtml;
  document.getElementById('velo').dataset.abierto = '1';
  document.getElementById('vcuerpo').scrollTop = 0;
}

function cerrarVentana() {
  const v = document.getElementById('velo');
  if (v) v.dataset.abierto = '0';
}

function tostar(texto) {
  montarChasis();
  const t = document.getElementById('tostada');
  t.textContent = texto;
  t.dataset.ver = '1';
  clearTimeout(t._t);
  t._t = setTimeout(() => { t.dataset.ver = '0'; }, 2200);
}

function copiar(texto) {
  navigator.clipboard?.writeText(texto)
    .then(() => tostar('Ruta copiada al portapapeles'))
    .catch(() => tostar('No se pudo copiar. Selecciónela manualmente.'));
}

/* Bloque comun: como llegar al archivo fisico o verlo incrustado */
function bloqueArchivo(archivo, ruta, url) {
  if (!archivo && !url) return '';
  if (url) {
    return `<div style="margin-top:16px">
      <div class="cifra-rotulo" style="margin-bottom:8px">Documento</div>
      <iframe class="visor" src="${esc(url)}" title="${esc(archivo || 'Documento')}"></iframe>
    </div>`;
  }
  const rutaCompleta = (ruta || '') + (archivo || '');
  return `<div style="margin-top:16px">
    <div class="cifra-rotulo" style="margin-bottom:8px">Archivo fuente</div>
    <div class="aviso-caja">
      <b>${esc(archivo)}</b>
      <div class="ruta" id="ruta-${btoa(unescape(encodeURIComponent(rutaCompleta))).slice(0, 10)}">${esc(rutaCompleta)}</div>
      <div style="margin-top:10px;display:flex;gap:8px;flex-wrap:wrap">
        <button class="btn" onclick="copiar('${esc(rutaCompleta).replace(/\\/g, '\\\\')}')">Copiar ruta</button>
      </div>
      <div style="margin-top:10px;font-size:.78rem">
        El archivo vive en la unidad de trabajo, no en el portafolio. Para verlo aquí dentro,
        súbalo a <code>public/docs/</code> del repositorio y anote su ruta en el campo
        <code>url</code> del registro dentro de <code>datos-parachique.json</code>.
      </div>
    </div>
  </div>`;
}

/* ---------- Ficha de documento (ventana flotante) ---------- */
function fichaDocumento(d, etapas) {
  d._etapa = etapas ? ((etapas.find((e) => e.id === d.etapa) || {}).nombre || '') : '';
  const filas = [
    ['Código', `<span class="cod">${esc(d.codigo)}</span>`],
    ['Clase', esc(d.clase)],
    ['Flujo', d.flujo === 'RECIBIDA' ? 'Recibida — requiere pronunciamiento' : 'Emitida por la Supervisión'],
    ['Fecha', fecha(d.fecha)],
    ['Contraparte', esc(d.contraparte)],
    ['Asunto', esc(d.asunto)],
    ['Estado', insigniaEstado(d.estado)],
    ['Etapa de supervisión', esc(d._etapa || '—')]
  ];
  // En el build compartido el importe no viaja: se muestra solo el numeral.
  if (d.numeral) filas.push(['Numeral aplicable', esc(d.numeral) +
    (typeof d.honorarioNeto === 'number' ? ` — ${soles(d.honorarioNeto)} netos` : '')]);
  if (d.responde) filas.push(['Responde a', `<span class="cod">${esc(d.responde)}</span>`]);
  if (d.respondidaPor) filas.push(['Atendida por', `<span class="cod">${esc(d.respondidaPor)}</span>`]);
  filas.push(['Membrete oficial', insigniaMembrete(d, false)]);

  const dl = filas.map(([k, v]) => `<dt>${k}</dt><dd>${v}</dd>`).join('');

  abrirVentana(
    d.codigo,
    `${esc(d.clase)} · ${fechaCorta(d.fecha)}`,
    `<dl class="dl">${dl}</dl>
     <div style="margin-top:18px">
       <div class="cifra-rotulo" style="margin-bottom:8px">Contenido</div>
       <p style="margin:0;font-size:.86rem;color:var(--tinta-suave)">${esc(d.detalle)}</p>
     </div>
     ${bloqueDocumentos(d)}`
  );
  activarPestanasDoc();
}

/* ---------- Grafico de barras horizontales (una serie, con rotulo directo) ---------- */
function barrasH(contenedor, datos, opciones) {
  const o = Object.assign({ color: 'var(--serie-1)', formato: num, alto: 30, sufijo: '' }, opciones || {});
  const max = Math.max(...datos.map((d) => d.valor), 1);
  const html = datos.map((d) => {
    const pct = Math.max((d.valor / max) * 100, d.valor > 0 ? 1.5 : 0);
    const color = d.color || o.color;
    return `<div style="display:grid;grid-template-columns:minmax(120px,26%) 1fr auto;gap:12px;align-items:center;margin-bottom:9px"
                 data-tip="${esc(d.etiqueta)}|${esc(o.formato(d.valor))}${esc(d.nota ? ' · ' + d.nota : '')}">
      <span style="font-size:.79rem;color:var(--tinta-suave);text-align:right">${esc(d.etiqueta)}</span>
      <span style="display:block;background:var(--superficie-2);border-radius:4px;height:${o.alto - 12}px">
        <span style="display:block;width:${pct}%;height:100%;background:${color};border-radius:0 4px 4px 0"></span>
      </span>
      <span style="font-size:.8rem;font-weight:700;font-variant-numeric:tabular-nums;min-width:74px;text-align:right">${esc(o.formato(d.valor))}${o.sufijo}</span>
    </div>`;
  }).join('');
  contenedor.innerHTML = html;
  activarTips(contenedor);
}

/* ---------- Tooltips ---------- */
function activarTips(raiz) {
  montarChasis();
  const tip = document.getElementById('tip');
  raiz.querySelectorAll('[data-tip]').forEach((el) => {
    el.addEventListener('mouseenter', () => {
      const [t, s] = el.dataset.tip.split('|');
      tip.innerHTML = `<b>${esc(t)}</b>${esc(s || '')}`;
      tip.dataset.ver = '1';
    });
    el.addEventListener('mousemove', (e) => {
      const r = tip.getBoundingClientRect();
      let x = e.clientX + 14;
      let y = e.clientY - r.height - 10;
      if (x + r.width > innerWidth - 8) x = e.clientX - r.width - 14;
      if (y < 8) y = e.clientY + 18;
      tip.style.left = x + 'px';
      tip.style.top = y + 'px';
    });
    el.addEventListener('mouseleave', () => { tip.dataset.ver = '0'; });
  });
}

/* ---------- Filtro de tabla ---------- */
function filtrarTabla(inputId, tablaId, chipsId) {
  const input = document.getElementById(inputId);
  const filas = () => Array.from(document.querySelectorAll(`#${tablaId} tbody tr`));
  let chipActivo = 'TODOS';

  function aplicar() {
    const q = (input?.value || '').toLowerCase().trim();
    filas().forEach((tr) => {
      const texto = tr.textContent.toLowerCase();
      const grupo = tr.dataset.grupo || '';
      const okTexto = !q || texto.includes(q);
      const okChip = chipActivo === 'TODOS' || grupo === chipActivo;
      tr.style.display = okTexto && okChip ? '' : 'none';
    });
  }

  input?.addEventListener('input', aplicar);
  if (chipsId) {
    document.querySelectorAll(`#${chipsId} .chip`).forEach((c) => {
      c.addEventListener('click', () => {
        document.querySelectorAll(`#${chipsId} .chip`).forEach((x) => x.setAttribute('aria-pressed', 'false'));
        c.setAttribute('aria-pressed', 'true');
        chipActivo = c.dataset.valor;
        aplicar();
      });
    });
  }
  aplicar();
}

/* ---------- Pie comun ---------- */
function pie(D) {
  return `<div class="pie">
    <span>${esc(D.meta.supervisor)} · CIP ${esc(D.meta.cip)} · Especialista en Equipamiento Médico</span>
    <span>Datos al ${fechaCorta(D.meta.actualizado)} · CUI ${esc(D.meta.cui)}</span>
  </div>`;
}

/* ---------- Sello de cabecera comun ---------- */
function sello(D) {
  return `<div class="sello">
    <b>${esc(D.meta.supervision)}</b> · Supervisión<br>
    ${esc(D.meta.entidad)} · Entidad<br>
    CUI ${esc(D.meta.cui)} · Nivel ${esc(D.meta.nivelEESS)}<br>
    Actualizado: <b>${fechaCorta(D.meta.actualizado)}</b>
  </div>`;
}

document.addEventListener('DOMContentLoaded', montarChasis);
