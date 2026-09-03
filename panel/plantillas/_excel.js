/* =========================================================================
   EXPORTACIÓN A EXCEL
   ------------------------------------------------------------------------
   Descarga lo que hay en pantalla —respetando los filtros aplicados— como un
   libro .xlsx con cabecera de proyecto, identificación del supervisor y de la
   propiedad del aplicativo, formato de tabla, autofiltro y anchos calculados.

   La librería se carga solo la primera vez que se pulsa el botón.
   ========================================================================= */

const EXCELJS_CDN = 'https://cdnjs.cloudflare.com/ajax/libs/exceljs/4.4.0/exceljs.min.js';
let cargandoExcelJs = null;

function cargarExcelJs() {
  if (window.ExcelJS) return Promise.resolve(window.ExcelJS);
  if (cargandoExcelJs) return cargandoExcelJs;
  cargandoExcelJs = new Promise(function (resolve, reject) {
    const s = document.createElement('script');
    s.src = EXCELJS_CDN;
    s.onload = function () { resolve(window.ExcelJS); };
    s.onerror = function () { reject(new Error('No se pudo cargar la librería de Excel.')); };
    document.head.appendChild(s);
  });
  return cargandoExcelJs;
}

/* Convierte el texto de una celda a número cuando procede, para que Excel lo
   trate como número y no como texto (soles, porcentajes, cantidades). */
function valorCelda(texto) {
  const t = String(texto || '').trim();
  if (!t || t === '—' || t === '-') return '';
  const limpio = t.replace(/\s/g, '');

  const soles = limpio.match(/^−?-?S\/([\d,]+\.\d{2})$/);
  if (soles) {
    const n = Number(soles[1].replace(/,/g, ''));
    return { valor: limpio.startsWith('−') || limpio.startsWith('-') ? -n : n, formato: '"S/" #,##0.00' };
  }
  const pct = limpio.match(/^([\d.]+)%$/);
  if (pct) return { valor: Number(pct[1]) / 100, formato: '0.00%' };

  const ent = limpio.match(/^-?[\d,]+$/);
  if (ent && limpio.replace(/[,-]/g, '').length <= 9) {
    return { valor: Number(limpio.replace(/,/g, '')), formato: '#,##0' };
  }
  return t;
}

function textoFila(tr) {
  return Array.from(tr.children).map(function (td) {
    return td.innerText.replace(/\s+/g, ' ').trim();
  });
}

async function exportarExcel(o) {
  const boton = o.boton;
  const rotuloOriginal = boton ? boton.innerHTML : '';
  if (boton) { boton.disabled = true; boton.textContent = 'Preparando…'; }

  try {
    const ExcelJS = await cargarExcelJs();
    const libro = new ExcelJS.Workbook();
    libro.creator = o.propietario || 'David Lee Vizcarra Mondragón';
    libro.company = o.supervision || '';
    libro.created = new Date();

    const hoja = libro.addWorksheet(o.hoja || 'Datos', {
      views: [{ state: 'frozen', ySplit: 8 }],
      pageSetup: { paperSize: 9, orientation: 'landscape', fitToPage: true, fitToWidth: 1, fitToHeight: 0 },
    });

    const cabeceras = Array.from(o.tabla.querySelectorAll('thead th'))
      .map(function (th) { return th.innerText.replace(/\s+/g, ' ').trim(); });
    const nCols = cabeceras.length;
    const ultima = String.fromCharCode(64 + Math.min(nCols, 26));

    /* ---------- Cabecera del documento ---------- */
    const bloque = [
      [o.proyecto || ''],
      [o.subtitulo || ''],
      [''],
      ['Supervisor de Equipamiento:', (o.supervisor || '') + (o.cip ? '   ·   CIP N° ' + o.cip : '')],
      ['Reporte:', (o.hoja || 'Datos') + (o.filtrado ? '   ·   con filtros aplicados' : '   ·   sin filtros')],
      ['Generado:', new Date().toLocaleString('es-PE', { dateStyle: 'long', timeStyle: 'short' })],
      [''],
    ];
    bloque.forEach(function (f) { hoja.addRow(f); });

    hoja.mergeCells('A1:' + ultima + '1');
    hoja.mergeCells('A2:' + ultima + '2');
    const t1 = hoja.getCell('A1');
    t1.font = { name: 'Arial', size: 14, bold: true, color: { argb: 'FF0F3D5C' } };
    t1.alignment = { vertical: 'middle' };
    hoja.getRow(1).height = 24;
    const t2 = hoja.getCell('A2');
    t2.font = { name: 'Arial', size: 10, italic: true, color: { argb: 'FF5A6573' } };

    [4, 5, 6].forEach(function (n) {
      const fila = hoja.getRow(n);
      fila.getCell(1).font = { name: 'Arial', size: 9, bold: true, color: { argb: 'FF5A6573' } };
      fila.getCell(2).font = { name: 'Arial', size: 9, color: { argb: 'FF1A1A1A' } };
      fila.height = 14;
    });

    /* ---------- Encabezado de la tabla ---------- */
    const filaCab = hoja.addRow(cabeceras);
    filaCab.eachCell(function (c) {
      c.font = { name: 'Arial', size: 9, bold: true, color: { argb: 'FFFFFFFF' } };
      c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F3D5C' } };
      c.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
      c.border = {
        top: { style: 'thin', color: { argb: 'FF0F3D5C' } },
        bottom: { style: 'thin', color: { argb: 'FF0F3D5C' } },
        left: { style: 'thin', color: { argb: 'FFBFBFBF' } },
        right: { style: 'thin', color: { argb: 'FFBFBFBF' } },
      };
    });
    filaCab.height = 30;

    /* ---------- Datos ---------- */
    const anchos = cabeceras.map(function (h) { return Math.min(Math.max(h.length + 2, 10), 42); });

    o.filas.forEach(function (tr, i) {
      const celdas = textoFila(tr);
      const fila = hoja.addRow(celdas.map(function (t) {
        const v = valorCelda(t);
        return (v && typeof v === 'object') ? v.valor : v;
      }));

      celdas.forEach(function (t, j) {
        const v = valorCelda(t);
        const c = fila.getCell(j + 1);
        if (v && typeof v === 'object') {
          c.numFmt = v.formato;
          c.alignment = { vertical: 'top', horizontal: 'right' };
        } else {
          c.alignment = { vertical: 'top', wrapText: t.length > 42 };
        }
        c.font = { name: 'Arial', size: 9 };
        c.border = {
          bottom: { style: 'hair', color: { argb: 'FFD9D9D9' } },
          left: { style: 'hair', color: { argb: 'FFD9D9D9' } },
          right: { style: 'hair', color: { argb: 'FFD9D9D9' } },
        };
        if (i % 2 === 1) {
          c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF6F5F1' } };
        }
        anchos[j] = Math.min(Math.max(anchos[j], Math.min(t.length + 2, 46)), 46);
      });
    });

    hoja.columns.forEach(function (col, j) { col.width = anchos[j] || 14; });

    const primeraDatos = 8;
    const ultimaDatos = primeraDatos + o.filas.length;
    if (o.filas.length) {
      hoja.autoFilter = { from: { row: primeraDatos, column: 1 }, to: { row: ultimaDatos, column: nCols } };
    }

    /* ---------- Pie ---------- */
    hoja.addRow([]);
    const pie1 = hoja.addRow([(o.filas.length) + ' registro(s) exportado(s)' +
      (o.filtrado ? ' — corresponde a la selección filtrada en pantalla, no al total.' : ' — total sin filtrar.')]);
    pie1.getCell(1).font = { name: 'Arial', size: 8, italic: true, color: { argb: 'FF5A6573' } };
    const pie2 = hoja.addRow(['Aplicativo de supervisión de equipamiento — propiedad de ' +
      (o.propietario || 'David Lee Vizcarra Mondragón') + '. Uso interno del proyecto.']);
    pie2.getCell(1).font = { name: 'Arial', size: 8, italic: true, color: { argb: 'FF8A92A0' } };

    /* ---------- Descarga ---------- */
    const buffer = await libro.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = (o.archivo || 'reporte') + '_' +
      new Date().toISOString().slice(0, 10).replace(/-/g, '') + '.xlsx';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(url); }, 4000);

    tostar('Excel descargado: ' + o.filas.length + ' registro(s)');
  } catch (err) {
    tostar('No se pudo generar el Excel. Revise su conexión.');
    console.error(err);
  } finally {
    if (boton) { boton.disabled = false; boton.innerHTML = rotuloOriginal; }
  }
}
