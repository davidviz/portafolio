/* =========================================================================
   INTERRUPTORES DE ETAPA Y RANGO DE FECHAS
   ------------------------------------------------------------------------
   Varios controles filtran la misma tabla a la vez. Para que no se pisen, cada
   uno registra un criterio en REGISTRO_FILTROS y cualquier cambio vuelve a
   evaluar todos los criterios sobre todas las filas.
   ========================================================================= */

const REGISTRO_FILTROS = {};   // idTabla -> { criterios: {}, alAplicar: [] }

function registro(idTabla) {
  if (!REGISTRO_FILTROS[idTabla]) {
    REGISTRO_FILTROS[idTabla] = { criterios: {}, alAplicar: [] };
  }
  return REGISTRO_FILTROS[idTabla];
}

/* Evalúa todos los criterios registrados sobre la tabla y avisa a quien escuche. */
function aplicarFiltros(idTabla) {
  const tabla = document.getElementById(idTabla);
  if (!tabla) return [];
  const reg = registro(idTabla);
  const criterios = Object.values(reg.criterios);
  const visibles = [];

  Array.from(tabla.querySelectorAll('tbody tr')).forEach(function (tr) {
    const pasa = criterios.every(function (c) { return c(tr); });
    tr.style.display = pasa ? '' : 'none';
    if (pasa) visibles.push(tr);
  });

  reg.alAplicar.forEach(function (fn) { fn(visibles); });
  return visibles;
}

function ponerCriterio(idTabla, nombre, fn) {
  registro(idTabla).criterios[nombre] = fn;
}

function alAplicarFiltros(idTabla, fn) {
  registro(idTabla).alAplicar.push(fn);
}

/* ---------------------------------------------------------------- etapas
   crearInterruptores({
     contenedor, tabla, campo:'etapa',
     opciones:[{valor, etiqueta, detalle, cuenta}],
   })
   Cada etapa es un interruptor: encendido muestra sus documentos. Empiezan
   todos encendidos, que es lo que se espera al abrir el tablero.
------------------------------------------------------------------------- */
function crearInterruptores(cfg) {
  const caja = document.getElementById(cfg.contenedor);
  const tabla = document.getElementById(cfg.tabla);
  if (!caja || !tabla) return null;

  const encendidas = new Set(cfg.opciones.map(function (o) { return o.valor; }));

  caja.className = 'interruptores';
  caja.innerHTML = cfg.opciones.map(function (o) {
    return '<label class="interruptor" data-valor="' + esc(o.valor) + '">' +
      '<input type="checkbox" checked>' +
      '<span class="palanca" aria-hidden="true"></span>' +
      '<span class="txt"><b>' + esc(o.etiqueta) + '</b>' +
      (o.detalle ? '<span class="detalle">' + esc(o.detalle) + '</span>' : '') + '</span>' +
      '<span class="cuenta">' + (o.cuenta != null ? o.cuenta : '') + '</span></label>';
  }).join('') +
    '<button type="button" class="chip" id="' + cfg.contenedor + '-todas">Todas</button>';

  function sincronizar() {
    caja.querySelectorAll('.interruptor').forEach(function (l) {
      l.dataset.encendido = encendidas.has(l.dataset.valor) ? '1' : '0';
    });
    ponerCriterio(cfg.tabla, 'interruptores', function (tr) {
      const v = tr.getAttribute('data-f-' + cfg.campo) || '';
      return encendidas.has(v);
    });
    aplicarFiltros(cfg.tabla);
  }

  caja.querySelectorAll('.interruptor').forEach(function (l) {
    l.querySelector('input').addEventListener('change', function (e) {
      const v = l.dataset.valor;
      if (e.target.checked) encendidas.add(v); else encendidas.delete(v);
      sincronizar();
    });
    // Doble clic sobre la etiqueta: dejar solo esa etapa
    l.querySelector('.txt').addEventListener('dblclick', function (e) {
      e.preventDefault();
      encendidas.clear();
      encendidas.add(l.dataset.valor);
      caja.querySelectorAll('.interruptor input').forEach(function (i, k) {
        i.checked = cfg.opciones[k].valor === l.dataset.valor;
      });
      sincronizar();
    });
  });

  document.getElementById(cfg.contenedor + '-todas').addEventListener('click', function () {
    cfg.opciones.forEach(function (o) { encendidas.add(o.valor); });
    caja.querySelectorAll('.interruptor input').forEach(function (i) { i.checked = true; });
    sincronizar();
  });

  sincronizar();
  return { encendidas: encendidas };
}

/* ------------------------------------------------------------ rango de fechas
   crearRangoFechas({ contenedor, tabla, campo:'fecha' })
   El atributo data-f-<campo> de cada fila debe traer la fecha en AAAA-MM-DD.
------------------------------------------------------------------------- */
function crearRangoFechas(cfg) {
  const caja = document.getElementById(cfg.contenedor);
  const tabla = document.getElementById(cfg.tabla);
  if (!caja || !tabla) return null;

  const fechas = Array.from(tabla.querySelectorAll('tbody tr'))
    .map(function (tr) { return tr.getAttribute('data-f-' + cfg.campo); })
    .filter(Boolean).sort();
  const minima = fechas[0] || '';
  const maxima = fechas[fechas.length - 1] || '';

  const id = cfg.contenedor;
  caja.className = 'rango-fechas';
  caja.innerHTML =
    '<span class="rotulo">Periodo</span>' +
    '<input type="date" id="' + id + '-desde" min="' + minima + '" max="' + maxima + '" aria-label="Desde">' +
    '<span class="sep">a</span>' +
    '<input type="date" id="' + id + '-hasta" min="' + minima + '" max="' + maxima + '" aria-label="Hasta">' +
    '<button type="button" class="chip" data-rango="mes">Último mes</button>' +
    '<button type="button" class="chip" data-rango="todo">Todo</button>';

  const desde = document.getElementById(id + '-desde');
  const hasta = document.getElementById(id + '-hasta');

  function sincronizar() {
    const d = desde.value, h = hasta.value;
    caja.dataset.activo = (d || h) ? '1' : '0';
    ponerCriterio(cfg.tabla, 'fechas', function (tr) {
      const f = tr.getAttribute('data-f-' + cfg.campo) || '';
      if (!f) return true;
      if (d && f < d) return false;
      if (h && f > h) return false;
      return true;
    });
    aplicarFiltros(cfg.tabla);
  }

  desde.addEventListener('change', sincronizar);
  hasta.addEventListener('change', sincronizar);

  caja.querySelectorAll('[data-rango]').forEach(function (b) {
    b.addEventListener('click', function () {
      if (b.dataset.rango === 'todo') {
        desde.value = ''; hasta.value = '';
      } else {
        const ref = new Date(maxima || Date.now());
        const ini = new Date(ref);
        ini.setMonth(ini.getMonth() - 1);
        desde.value = ini.toISOString().slice(0, 10);
        hasta.value = maxima;
      }
      sincronizar();
    });
  });

  sincronizar();
  return { limpiar: function () { desde.value = ''; hasta.value = ''; sincronizar(); } };
}
