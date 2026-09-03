/* =========================================================================
   VISOR DE DOCUMENTOS
   ------------------------------------------------------------------------
   Los informes y las cartas viven en el Google Drive del supervisor. Aquí se
   incrustan dentro de la propia ventana flotante mediante el visor de Drive,
   de modo que nunca se abre otra pestaña.

   Requisito: el archivo debe estar compartido con quien lo consulta. Si no lo
   está, Drive muestra su propia pantalla de «solicitar acceso» dentro del
   marco, que es el comportamiento correcto y no rompe el tablero.
   ========================================================================= */

const DRIVE_VISTA = 'https://drive.google.com/file/d/ID/preview';

function urlDrive(id) {
  return DRIVE_VISTA.replace('ID', encodeURIComponent(id));
}

/* Devuelve las piezas descargables/consultables de un documento. */
function piezasDe(d) {
  const drive = d.drive || {};
  const piezas = [];
  if (drive.informe) piezas.push({ clave: 'informe', etiqueta: d.clase === 'CARTA' ? 'Carta' : 'Informe', id: drive.informe });
  if (drive.matriz) piezas.push({ clave: 'matriz', etiqueta: 'Matriz anexa', id: drive.matriz });
  return piezas;
}

/* Bloque que se inserta al final de la ficha de un documento. */
function bloqueDocumentos(d) {
  const piezas = piezasDe(d);
  const rutaCompleta = (d.ruta || '') + (d.archivo || '');

  if (!piezas.length) {
    if (!d.archivo) return '';
    return '<div style="margin-top:18px">' +
      '<div class="cifra-rotulo" style="margin-bottom:8px">Archivo fuente</div>' +
      '<div class="aviso-caja"><b>' + esc(d.archivo) + '</b>' +
      '<div class="ruta">' + esc(rutaCompleta) + '</div>' +
      '<div style="margin-top:10px"><button class="btn" onclick="copiar(' +
      JSON.stringify(rutaCompleta).replace(/"/g, '&quot;') + ')">Copiar ruta</button></div>' +
      '<div style="margin-top:10px;font-size:.78rem">Este documento aún no tiene enlace en Drive. ' +
      'Al sincronizarlo, registre su identificador en el campo <code>drive</code> de ' +
      '<code>datos-parachique.json</code> y se verá aquí dentro.</div></div></div>';
  }

  const id = 'visor-' + d.id;
  const pestanas = piezas.length > 1
    ? '<div class="tabs-doc" data-visor="' + id + '">' + piezas.map(function (p, i) {
        return '<button type="button" data-doc-id="' + esc(p.id) + '" aria-selected="' +
          (i === 0 ? 'true' : 'false') + '">' + esc(p.etiqueta) + '</button>';
      }).join('') + '</div>'
    : '';

  return '<div style="margin-top:18px">' +
    '<div class="cifra-rotulo" style="margin-bottom:8px">Documento</div>' +
    pestanas +
    '<iframe class="visor-doc" id="' + id + '" src="' + urlDrive(piezas[0].id) +
    '" title="' + esc(d.codigo) + '" allow="autoplay"></iframe>' +
    '<div class="aviso-caja" style="margin-top:10px;font-size:.78rem">' +
    '<b>' + esc(d.archivo || d.codigo) + '</b><br>' +
    'Se muestra desde Google Drive. Si aparece una pantalla pidiendo acceso, el archivo aún no está ' +
    'compartido con quien lo consulta.' +
    '<div class="ruta">' + esc(rutaCompleta) + '</div>' +
    '<div style="margin-top:10px"><button class="btn" onclick="copiar(' +
    JSON.stringify(rutaCompleta).replace(/"/g, '&quot;') + ')">Copiar ruta local</button></div>' +
    '</div></div>';
}

/* Cambia de pieza sin salir de la ventana. Se engancha tras abrirla. */
function activarPestanasDoc() {
  document.querySelectorAll('.tabs-doc').forEach(function (grupo) {
    const marco = document.getElementById(grupo.dataset.visor);
    if (!marco) return;
    grupo.querySelectorAll('button').forEach(function (b) {
      b.addEventListener('click', function () {
        grupo.querySelectorAll('button').forEach(function (o) { o.setAttribute('aria-selected', 'false'); });
        b.setAttribute('aria-selected', 'true');
        marco.src = urlDrive(b.dataset.docId);
      });
    });
  });
}
