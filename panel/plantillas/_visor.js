/* =========================================================================
   VISOR DE DOCUMENTOS
   ------------------------------------------------------------------------
   Los informes, las cartas y los módulos del expediente viven en el Google
   Drive del supervisor. Aquí se abren dentro de una ventana ancha, con el
   visor de Drive: nunca se abre otra pestaña.

   Sirve igual para PDF, Word y Excel: Drive los renderiza sin necesidad de
   tener Office instalado.

   Requisito: el archivo debe estar compartido con quien lo consulta. Si no lo
   está, Drive muestra su propia pantalla de «solicitar acceso» dentro del
   marco, que es el comportamiento correcto y no rompe el tablero.
   ========================================================================= */

const DRIVE_VISTA = 'https://drive.google.com/file/d/ID/preview';

function urlDrive(id) {
  return DRIVE_VISTA.replace('ID', encodeURIComponent(id));
}

function tipoDeArchivo(nombre) {
  const n = (nombre || '').toLowerCase();
  if (n.endsWith('.pdf')) return { etiqueta: 'PDF', color: '#b03030' };
  if (n.endsWith('.xlsx') || n.endsWith('.xls')) return { etiqueta: 'Excel', color: '#1d6f42' };
  if (n.endsWith('.docx') || n.endsWith('.doc')) return { etiqueta: 'Word', color: '#1f4e8c' };
  if (n.endsWith('.dwg') || n.endsWith('.dxf')) return { etiqueta: 'Plano', color: '#7a5400' };
  return { etiqueta: 'Documento', color: 'var(--tinta-suave)' };
}

/* Piezas consultables de un documento: el informe y, si existe, su matriz. */
function piezasDe(d) {
  const drive = d.drive || {};
  const piezas = [];
  if (drive.informe) {
    piezas.push({
      id: drive.informe,
      etiqueta: d.clase === 'CARTA' ? 'Carta' : (d.clase === 'INFORME' ? 'Informe' : 'Documento'),
      archivo: (d.archivo || '').split(' + ')[0],
    });
  }
  if (drive.matriz) {
    piezas.push({
      id: drive.matriz, etiqueta: 'Matriz anexa',
      archivo: (d.archivo || '').split(' + ')[1] || 'Matriz',
    });
  }
  return piezas;
}

/* Arma el visor: barra de pestañas, marco y pie con la ruta. */
function marcoVisor(piezas, subtitulo, rutaLocal) {
  const idMarco = 'visor-' + Math.random().toString(36).slice(2, 9);
  const primera = piezas[0];
  const tipo = tipoDeArchivo(primera.archivo);

  const pestanas = piezas.length > 1
    ? '<div class="tabs-doc" data-visor="' + idMarco + '">' + piezas.map(function (p, i) {
        return '<button type="button" data-doc-id="' + esc(p.id) + '" data-archivo="' +
          esc(p.archivo) + '" aria-selected="' + (i === 0 ? 'true' : 'false') + '">' +
          esc(p.etiqueta) + '</button>';
      }).join('') + '</div>'
    : '<span class="insignia i-info" style="border-color:' + tipo.color + '33;color:' + tipo.color +
      '">' + ICONOS.info + '<span>' + esc(tipo.etiqueta) + '</span></span>';

  return '<div class="doc-barra">' + pestanas +
    '<span class="info" id="' + idMarco + '-nombre">' + esc(primera.archivo || subtitulo || '') + '</span>' +
    '</div>' +
    '<div class="doc-marco">' +
      '<div class="doc-cargando" id="' + idMarco + '-carga"><span class="rueda"></span>' +
      '<span>Abriendo el documento…</span></div>' +
      '<iframe id="' + idMarco + '" src="' + urlDrive(primera.id) + '" title="' +
      esc(primera.archivo || 'Documento') + '" allow="autoplay" loading="eager"></iframe>' +
    '</div>' +
    '<div class="doc-pie">' +
      '<span>Se muestra desde Google Drive. Si pide acceso, el archivo aún no está compartido con quien lo consulta.</span>' +
      (rutaLocal ? '<button class="btn" style="margin-left:auto;padding:5px 10px;font-size:.74rem" ' +
        'onclick="copiar(' + JSON.stringify(rutaLocal).replace(/"/g, '&quot;') + ')">Copiar ruta local</button>' : '') +
    '</div>';
}

/* Engancha pestañas y el aviso de carga. Se llama tras abrir la ventana. */
function activarVisor() {
  document.querySelectorAll('.doc-marco iframe').forEach(function (marco) {
    const carga = document.getElementById(marco.id + '-carga');
    const ocultar = function () { if (carga) carga.hidden = true; };
    marco.addEventListener('load', ocultar);
    setTimeout(ocultar, 6000);   // por si el marco no dispara load
  });

  document.querySelectorAll('.tabs-doc').forEach(function (grupo) {
    const marco = document.getElementById(grupo.dataset.visor);
    const nombre = document.getElementById(grupo.dataset.visor + '-nombre');
    const carga = document.getElementById(grupo.dataset.visor + '-carga');
    if (!marco) return;
    grupo.querySelectorAll('button').forEach(function (b) {
      b.addEventListener('click', function () {
        grupo.querySelectorAll('button').forEach(function (o) { o.setAttribute('aria-selected', 'false'); });
        b.setAttribute('aria-selected', 'true');
        if (carga) carga.hidden = false;
        marco.src = urlDrive(b.dataset.docId);
        if (nombre) nombre.textContent = b.dataset.archivo || '';
      });
    });
  });
}

/* Abre un documento cualquiera en la ventana ancha. */
function abrirDocumentoDrive(o) {
  if (!o.driveId) {
    abrirVentana(o.titulo, o.subtitulo || '',
      '<div class="aviso-caja"><b>' + esc(o.archivo || o.titulo) + '</b>' +
      '<div class="ruta">' + esc(o.ruta || '') + '</div>' +
      '<div style="margin-top:10px;font-size:.78rem">Este documento aún no tiene enlace en Drive. ' +
      'Al sincronizarlo, registre su identificador en <code>datos-parachique.json</code> y se verá aquí dentro.' +
      '</div></div>');
    return;
  }
  abrirVentana(o.titulo, o.subtitulo || '',
    marcoVisor([{ id: o.driveId, etiqueta: 'Documento', archivo: o.archivo }], o.subtitulo, o.ruta),
    { ancha: true });
  activarVisor();
}

/* Ficha completa de un documento del registro: datos arriba, visor abajo. */
function abrirFichaDocumento(d, etapas) {
  const piezas = piezasDe(d);
  const etapa = etapas ? (etapas.find(function (e) { return e.id === d.etapa; }) || {}).nombre : '';
  const rutaLocal = (d.ruta || '') + (d.archivo || '');

  const filas = [
    ['Código', '<span class="cod">' + esc(d.codigo) + '</span>'],
    ['Clase', esc(d.clase)],
    ['Flujo', d.flujo === 'RECIBIDA' ? 'Recibida — requiere pronunciamiento' : 'Emitida por la Supervisión'],
    ['Fecha', fecha(d.fecha)],
    ['Contraparte', esc(d.contraparte)],
    ['Etapa', esc(etapa || '—')],
    ['Áreas', (d.areas || []).map(function (a) {
      return '<span class="insignia i-neutro" style="margin:0 4px 4px 0">' + esc(a) + '</span>';
    }).join('') || '—'],
    ['Estado', insigniaEstado(d.estado)],
  ];
  if (d.responde) filas.push(['Responde a', '<span class="cod">' + esc(d.responde) + '</span>']);
  if (d.respondidaPor) filas.push(['Atendida por', '<span class="cod">' + esc(d.respondidaPor) + '</span>']);
  filas.push(['Membrete oficial', insigniaMembrete(d, false)]);

  const ficha =
    '<div style="padding:20px 22px">' +
      '<dl class="dl">' + filas.map(function (f) {
        return '<dt>' + f[0] + '</dt><dd>' + f[1] + '</dd>';
      }).join('') + '</dl>' +
      '<div class="cifra-rotulo" style="margin:18px 0 8px">Contenido</div>' +
      '<p style="margin:0;font-size:.86rem;color:var(--tinta-suave);line-height:1.6">' +
      esc(d.detalle) + '</p>' +
    '</div>';

  abrirVentana(d.codigo, esc(d.clase) + ' · ' + fechaCorta(d.fecha),
    ficha + (piezas.length ? marcoVisor(piezas, d.codigo, rutaLocal) : ''),
    { ancha: piezas.length > 0 });
  activarVisor();
}
