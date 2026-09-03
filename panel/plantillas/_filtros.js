/* =========================================================================
   FILTROS DESPLEGABLES MULTISELECCIÓN  —  estilo tablero analítico
   ------------------------------------------------------------------------
   Se apoya en atributos data-f-<clave> puestos en cada <tr>. El componente
   lee de ahí los valores posibles, arma un desplegable por campo y filtra:
   OR dentro de un campo, Y entre campos, más un buscador global.

   Cada desplegable permite las tres formas que pidió el usuario:
     · «Todos»   — quita el filtro del campo
     · «Solo»    — deja un único valor de un clic (valor rápido)
     · casillas  — combinación libre de varios valores
   ========================================================================= */

const LUPA = '<svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="7" cy="7" r="4.5"/><path d="M10.5 10.5L14 14"/></svg>';
const ICONO_EXCEL = '<svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M3 1.5h6l4 4v9H3z"/><path d="M9 1.5v4h4"/><path d="M6 8.6l4 4M10 8.6l-4 4"/></svg>';
const SIN_COINCIDENCIA = '__ninguno__';

function crearFiltros(cfg) {
  const tabla = document.getElementById(cfg.tabla);
  const caja = document.getElementById(cfg.contenedor);
  if (!tabla || !caja) return null;

  const filas = Array.from(tabla.querySelectorAll('tbody tr'));
  const seleccion = {};
  let texto = '';
  cfg.campos.forEach((c) => { seleccion[c.clave] = new Set(); });

  const valorFila = (tr, clave) => tr.getAttribute('data-f-' + clave) || '';

  function valoresDe(clave) {
    const cuenta = new Map();
    filas.forEach((tr) => {
      const v = valorFila(tr, clave);
      if (!v) return;
      cuenta.set(v, (cuenta.get(v) || 0) + 1);
    });
    return Array.from(cuenta.entries()).sort((a, b) => a[0].localeCompare(b[0], 'es'));
  }

  caja.className = 'barra-filtros';
  caja.innerHTML =
    '<div class="buscador">' + LUPA +
    '<input type="search" id="' + cfg.contenedor + '-q" aria-label="Buscar en la tabla" placeholder="' +
    esc(cfg.placeholder || 'Buscar en toda la tabla…') + '"></div>' +
    cfg.campos.map(function (c) {
      return '<div class="desplegable" data-campo="' + esc(c.clave) + '" data-abierto="0" data-activo="0">' +
        '<button type="button" aria-haspopup="true" aria-expanded="false">' +
        '<span class="rotulo">' + esc(c.etiqueta) + ':</span><span class="valor">Todos</span></button>' +
        '<div class="panel-filtro" role="dialog" aria-label="Filtrar por ' + esc(c.etiqueta) + '">' +
        '<div class="cab"><input type="search" placeholder="Buscar valor…" aria-label="Buscar valor"></div>' +
        '<div class="acciones">' +
        '<button type="button" data-accion="todos">Todos</button>' +
        '<button type="button" data-accion="ninguno">Ninguno</button></div>' +
        '<div class="lista"></div></div></div>';
    }).join('');

  function pintarLista(desp) {
    const clave = desp.dataset.campo;
    const lista = desp.querySelector('.lista');
    const q = desp.querySelector('.cab input').value.toLowerCase().trim();
    const elegidos = seleccion[clave];
    const items = valoresDe(clave).filter(function (par) {
      return !q || par[0].toLowerCase().includes(q);
    });

    lista.innerHTML = items.length ? items.map(function (par) {
      const v = par[0], n = par[1];
      const marcado = (elegidos.size === 0 || elegidos.has(v)) ? ' checked' : '';
      return '<label class="opcion">' +
        '<input type="checkbox" value="' + esc(v) + '"' + marcado + '>' +
        '<span class="txt" title="' + esc(v) + '">' + esc(v) + '</span>' +
        '<span class="cuenta">' + n + '</span>' +
        '<button type="button" class="solo" data-solo="' + esc(v) + '">Solo</button></label>';
    }).join('') : '<div class="vacio">Sin coincidencias</div>';

    lista.querySelectorAll('input[type=checkbox]').forEach(function (ch) {
      ch.addEventListener('change', function () {
        const todos = valoresDe(clave).map(function (p) { return p[0]; });
        if (elegidos.size === 0) todos.forEach(function (v) { elegidos.add(v); });
        elegidos.delete(SIN_COINCIDENCIA);
        if (ch.checked) elegidos.add(ch.value); else elegidos.delete(ch.value);
        if (elegidos.size === todos.length) elegidos.clear();
        aplicar(); rotulos();
      });
    });

    lista.querySelectorAll('.solo').forEach(function (b) {
      b.addEventListener('click', function (e) {
        e.preventDefault(); e.stopPropagation();
        elegidos.clear(); elegidos.add(b.dataset.solo);
        aplicar(); rotulos(); pintarLista(desp);
      });
    });
  }

  function rotulos() {
    caja.querySelectorAll('.desplegable').forEach(function (desp) {
      const clave = desp.dataset.campo;
      const el = seleccion[clave];
      const total = valoresDe(clave).length;
      const salida = desp.querySelector('.valor');
      if (el.has(SIN_COINCIDENCIA)) {
        salida.textContent = 'Ninguno';
        desp.dataset.activo = '1';
      } else if (el.size === 0 || el.size === total) {
        salida.textContent = 'Todos';
        desp.dataset.activo = '0';
      } else if (el.size === 1) {
        const v = Array.from(el)[0];
        salida.textContent = v.length > 26 ? v.slice(0, 25) + '…' : v;
        desp.dataset.activo = '1';
      } else {
        salida.textContent = el.size + ' de ' + total;
        desp.dataset.activo = '1';
      }
    });
  }

  function hayFiltro() {
    return !!texto || cfg.campos.some(function (c) { return seleccion[c.clave].size > 0; });
  }

  // Registra su criterio y deja que el coordinador evalúe todos los controles
  // que filtran esta tabla: desplegables, interruptores de etapa y fechas.
  function aplicar() {
    ponerCriterio(cfg.tabla, 'desplegables', function (tr) {
      const pasaCampos = cfg.campos.every(function (c) {
        const el = seleccion[c.clave];
        return el.size === 0 || el.has(valorFila(tr, c.clave));
      });
      const pasaTexto = !texto || tr.textContent.toLowerCase().includes(texto);
      return pasaCampos && pasaTexto;
    });
    aplicarFiltros(cfg.tabla);
  }

  alAplicarFiltros(cfg.tabla, function (visibles) {
    const r = cfg.resumen ? document.getElementById(cfg.resumen) : null;
    if (r) {
      const conteo = r.querySelector('[data-conteo]');
      if (conteo) {
        conteo.innerHTML = 'Mostrando <b>' + num(visibles.length) + '</b> de <b>' +
          num(filas.length) + '</b> ' + esc(cfg.unidad || 'registros');
      }
      const limpiar = r.querySelector('.limpiar');
      if (limpiar) limpiar.style.display = hayFiltro() ? '' : 'none';
    }
    if (cfg.alFiltrar) cfg.alFiltrar(visibles);
  });

  function visiblesAhora() {
    return filas.filter(function (tr) { return tr.style.display !== 'none'; });
  }

  caja.querySelector('#' + cfg.contenedor + '-q').addEventListener('input', function (e) {
    texto = e.target.value.toLowerCase().trim();
    aplicar();
  });

  function cerrarTodos() {
    caja.querySelectorAll('.desplegable').forEach(function (o) {
      o.dataset.abierto = '0';
      o.querySelector('button').setAttribute('aria-expanded', 'false');
    });
  }

  caja.querySelectorAll('.desplegable').forEach(function (desp) {
    const boton = desp.querySelector('button');
    boton.addEventListener('click', function (e) {
      e.stopPropagation();
      const abierto = desp.dataset.abierto === '1';
      cerrarTodos();
      if (!abierto) {
        desp.dataset.abierto = '1';
        boton.setAttribute('aria-expanded', 'true');
        pintarLista(desp);
        desp.querySelector('.cab input').focus();
      }
    });
    desp.querySelector('.panel-filtro').addEventListener('click', function (e) { e.stopPropagation(); });
    desp.querySelector('.cab input').addEventListener('input', function () { pintarLista(desp); });
    desp.querySelectorAll('.acciones button').forEach(function (b) {
      b.addEventListener('click', function () {
        const clave = desp.dataset.campo;
        seleccion[clave].clear();
        if (b.dataset.accion === 'ninguno') seleccion[clave].add(SIN_COINCIDENCIA);
        aplicar(); rotulos(); pintarLista(desp);
      });
    });
  });

  document.addEventListener('click', cerrarTodos);
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') cerrarTodos(); });

  const api = {
    limpiar: function () {
      texto = '';
      caja.querySelector('#' + cfg.contenedor + '-q').value = '';
      cfg.campos.forEach(function (c) { seleccion[c.clave].clear(); });
      aplicar(); rotulos();
    },
    visibles: visiblesAhora,
    hayFiltro: hayFiltro,
  };

  const r = cfg.resumen ? document.getElementById(cfg.resumen) : null;
  if (r) {
    r.classList.add('resumen-filtros');
    r.innerHTML = '<span data-conteo></span>' +
      '<button type="button" class="limpiar">Limpiar filtros</button>' +
      (cfg.excel ? '<button type="button" class="btn-excel" id="' + cfg.contenedor + '-excel">' +
        ICONO_EXCEL + 'Descargar Excel</button>' : '');
    r.querySelector('.limpiar').addEventListener('click', api.limpiar);
    if (cfg.excel) {
      document.getElementById(cfg.contenedor + '-excel').addEventListener('click', function (ev) {
        exportarExcel(Object.assign({}, cfg.excel, {
          boton: ev.currentTarget,
          filas: visiblesAhora(),
          tabla: tabla,
          filtrado: hayFiltro(),
        }));
      });
    }
  }

  rotulos();
  aplicar();
  return api;
}
