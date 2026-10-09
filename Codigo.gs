/**
 * Juego del impostor. Etnografía y Campesinado (5008868).
 * Universidad Nacional de Colombia, Sede Palmira. Sesión 7, 2026-2.
 *
 * Recibe los envíos de la página del juego y los guarda en dos hojas.
 * "Participantes" lleva una fila por participante al iniciar un juego.
 * "Registro" lleva una fila por participante en cada ronda.
 *
 * Instalación
 * 1. Cree una hoja nueva de Google Sheets llamada "EyC_2026-2_Juego del impostor".
 *    Use la misma cuenta de Google del registro de la sesión 6.
 * 2. Abra Extensiones y escoja Apps Script.
 * 3. Borre el contenido del editor, pegue este archivo completo y guarde.
 * 4. En la barra superior del editor, escoja la función configurar y pulse
 *    Ejecutar. Autorice los permisos. Si Google advierte que la aplicación no
 *    está verificada, entre por la opción avanzada y continúe.
 * 5. Abra Implementar y escoja Nueva implementación.
 * 6. En tipo, escoja Aplicación web.
 * 7. Ejecutar como: yo.
 * 8. Quién tiene acceso: cualquier usuario.
 * 9. Pulse Implementar. Copie la URL de la aplicación web. Termina en /exec.
 * 10. Pegue esa URL en index.html, en la constante URL_SCRIPT.
 * 11. Abra la hoja Estudiantes. Escoja Archivo, Importar, Subir, y suba
 *     estudiantes.csv. En Ubicación de importación, escoja Reemplazar la hoja
 *     actual. La lista de estudiantes vive solo en esta hoja de cálculo.
 *
 * Cambios posteriores
 * Para publicar un cambio del script sin cambiar la URL, abra Implementar,
 * Gestionar implementaciones, edite la implementación activa (ícono de lápiz),
 * escoja Nueva versión y pulse Implementar.
 *
 * Participación
 * Después de clase, use el menú "Juego del impostor" y la opción
 * "Actualizar participación". El menú aparece al recargar la hoja.
 */

const ZONA_HORARIA = 'America/Bogota';
const HOJA_PARTICIPANTES = 'Participantes';
const HOJA_REGISTRO = 'Registro';
const HOJA_PUNTAJES = 'Puntajes';
const HOJA_ESTUDIANTES = 'Estudiantes';
const HOJA_PARTICIPACION = 'Participación';
const ACTIVIDAD_PRUEBA = 'prueba';

const ENCABEZADOS_PARTICIPANTES = [
  'Marca temporal', 'Fecha', 'Curso', 'Sesión', 'Actividad', 'Id de juego', 'Grupo', 'Nombre',
  'Hora del dispositivo'
];
const ENCABEZADOS_REGISTRO = [
  'Marca temporal', 'Fecha', 'Curso', 'Sesión', 'Actividad', 'Id de juego', 'Grupo', 'Ronda',
  'Total de rondas', 'Nombre', 'Rol', 'Concepto', 'Fuente', 'Acusado', 'Acierto del grupo',
  'Impostor adivinó', 'Puntos de la ronda', 'Puntos acumulados', 'Pista que delató',
  'Hora del dispositivo'
];
const ENCABEZADOS_ESTUDIANTES = ['Nombre', 'Programa'];

// Posición de cada columna en la hoja, contada desde cero.
const COL_PARTICIPANTES = { actividad: 4, juego: 5, grupo: 6, nombre: 7 };
const COL_REGISTRO = { actividad: 4, juego: 5, grupo: 6, ronda: 7, nombre: 9, puntos: 16 };

const MAX_REGISTROS = 50;
const MAX_TEXTO = 300;
// CacheService guarda cada envío recibido hasta seis horas. Así un reintento no duplica filas.
const DURACION_CACHE = 21600;

/* ---------- Recepción de datos ---------- */

function doPost(e) {
  let datos;
  try {
    datos = JSON.parse(e && e.postData ? e.postData.contents : '');
  } catch (error) {
    return responder_({ ok: false, error: 'El envío no trae un JSON válido.' });
  }
  const tipo = datos ? String(datos.tipo) : '';
  if (tipo !== 'participantes' && tipo !== 'registro') {
    return responder_({ ok: false, error: 'Tipo de envío no válido.' });
  }
  const registros = Array.isArray(datos.registros) ? datos.registros : [];
  if (registros.length === 0) {
    return responder_({ ok: true, filas: 0 });
  }
  if (registros.length > MAX_REGISTROS) {
    return responder_({ ok: false, error: 'Demasiados registros en un solo envío.' });
  }
  const idEnvio = /^[A-Za-z0-9-]{8,64}$/.test(String(datos.id_envio || '')) ? String(datos.id_envio) : '';

  const candado = LockService.getScriptLock();
  if (!candado.tryLock(25000)) {
    return responder_({ ok: false, error: 'La hoja está ocupada. Intente de nuevo.' });
  }
  try {
    const cache = CacheService.getScriptCache();
    if (idEnvio && cache.get('envio-' + idEnvio)) {
      return responder_({ ok: true, filas: 0, repetido: true });
    }
    const libro = SpreadsheetApp.getActiveSpreadsheet();
    const ahora = new Date();
    const fecha = Utilities.formatDate(ahora, ZONA_HORARIA, 'yyyy-MM-dd');
    let hoja;
    let filas;
    if (tipo === 'participantes') {
      hoja = hoja_(libro, HOJA_PARTICIPANTES, ENCABEZADOS_PARTICIPANTES);
      filas = registros.map(function (r) {
        r = r || {};
        return [
          ahora, fecha, texto_(r.curso), texto_(r.sesion), texto_(r.actividad), texto_(r.id_juego),
          texto_(r.grupo), texto_(r.nombre), texto_(r.hora)
        ];
      });
    } else {
      hoja = hoja_(libro, HOJA_REGISTRO, ENCABEZADOS_REGISTRO);
      filas = registros.map(function (r) {
        r = r || {};
        return [
          ahora, fecha, texto_(r.curso), texto_(r.sesion), texto_(r.actividad), texto_(r.id_juego),
          texto_(r.grupo), numero_(r.ronda), numero_(r.total_rondas), texto_(r.nombre), texto_(r.rol),
          texto_(r.concepto), texto_(r.fuente), texto_(r.acusado), texto_(r.acierto_grupo),
          texto_(r.impostor_adivino), numero_(r.puntos_ronda), numero_(r.puntos_acumulados),
          texto_(r.pista), texto_(r.hora)
        ];
      });
    }
    agregarFilas_(hoja, filas);
    if (idEnvio) cache.put('envio-' + idEnvio, '1', DURACION_CACHE);
    return responder_({ ok: true, filas: filas.length });
  } catch (error) {
    return responder_({ ok: false, error: String(error) });
  } finally {
    candado.releaseLock();
  }
}

function doGet() {
  return responder_({ ok: true, mensaje: 'Juego del impostor. Servicio activo.' });
}

/* ---------- Menú y configuración ---------- */

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('Juego del impostor')
    .addItem('Actualizar participación', 'actualizarParticipacion')
    .addItem('Configurar hojas', 'configurar')
    .addToUi();
}

function configurar() {
  const libro = SpreadsheetApp.getActiveSpreadsheet();
  libro.setSpreadsheetTimeZone(ZONA_HORARIA);
  hoja_(libro, HOJA_PARTICIPANTES, ENCABEZADOS_PARTICIPANTES);
  hoja_(libro, HOJA_REGISTRO, ENCABEZADOS_REGISTRO);
  hoja_(libro, HOJA_ESTUDIANTES, ENCABEZADOS_ESTUDIANTES);

  let puntajes = libro.getSheetByName(HOJA_PUNTAJES);
  if (!puntajes) puntajes = libro.insertSheet(HOJA_PUNTAJES);
  puntajes.clear();
  // Columnas de Registro: E Actividad, G Grupo, H Ronda, J Nombre, Q Puntos de la ronda.
  puntajes.getRange('A1').setFormula(
    '=IFERROR(QUERY(' + HOJA_REGISTRO + '!A1:T,' +
    '"select G, J, count(H), sum(Q) where E <> \'' + ACTIVIDAD_PRUEBA + '\' and J <> \'\' ' +
    'group by G, J order by G, sum(Q) desc ' +
    'label G \'Grupo\', J \'Nombre\', count(H) \'Rondas jugadas\', sum(Q) \'Puntaje\'",1),' +
    '"Sin registros todavía")'
  );
  puntajes.setFrozenRows(1);
  puntajes.getRange('1:1').setFontWeight('bold');
  puntajes.setColumnWidth(1, 80);
  puntajes.setColumnWidth(2, 280);
  puntajes.setColumnWidth(3, 130);
  puntajes.setColumnWidth(4, 100);

  // Borra la pestaña vacía que trae una hoja nueva.
  ['Hoja 1', 'Hoja1', 'Sheet1'].forEach(function (nombre) {
    const vacia = libro.getSheetByName(nombre);
    if (vacia && vacia.getLastRow() === 0 && libro.getSheets().length > 1) libro.deleteSheet(vacia);
  });
  libro.toast('Hojas listas: Participantes, Registro, Puntajes y Estudiantes.');
}

/* ---------- Participación ---------- */

function actualizarParticipacion() {
  const libro = SpreadsheetApp.getActiveSpreadsheet();
  const estudiantes = leerEstudiantes_(libro);
  const participantes = leerFilas_(libro, HOJA_PARTICIPANTES, ENCABEZADOS_PARTICIPANTES.length);
  const registro = leerFilas_(libro, HOJA_REGISTRO, ENCABEZADOS_REGISTRO.length);

  // Agrupa los registros por nombre escrito en el juego, sin contar las pruebas.
  const registrados = {};
  let pruebas = 0;
  function registrado(nombre) {
    const clave = normalizar_(nombre);
    if (!clave) return null;
    if (!registrados[clave]) {
      registrados[clave] = { clave: clave, nombres: {}, grupos: {}, juegos: {}, rondas: {} };
    }
    registrados[clave].nombres[leerTexto_(nombre)] = true;
    return registrados[clave];
  }
  participantes.forEach(function (v) {
    if (leerTexto_(v[COL_PARTICIPANTES.actividad]) === ACTIVIDAD_PRUEBA) { pruebas++; return; }
    const r = registrado(v[COL_PARTICIPANTES.nombre]);
    if (!r) return;
    r.grupos[leerTexto_(v[COL_PARTICIPANTES.grupo])] = true;
    r.juegos[leerTexto_(v[COL_PARTICIPANTES.juego])] = true;
  });
  registro.forEach(function (v) {
    if (leerTexto_(v[COL_REGISTRO.actividad]) === ACTIVIDAD_PRUEBA) { pruebas++; return; }
    const r = registrado(v[COL_REGISTRO.nombre]);
    if (!r) return;
    const juego = leerTexto_(v[COL_REGISTRO.juego]);
    r.grupos[leerTexto_(v[COL_REGISTRO.grupo])] = true;
    r.juegos[juego] = true;
    // Una ronda reenviada cuenta una sola vez.
    r.rondas[juego + '\u001f' + leerTexto_(v[COL_REGISTRO.ronda])] = Number(v[COL_REGISTRO.puntos]) || 0;
  });

  // Asigna cada nombre registrado al estudiante de la lista con el que coincide.
  const resumen = estudiantes.map(function () {
    return { nombres: {}, juegos: {}, rondas: {} };
  });
  const sinCoincidencia = [];
  Object.keys(registrados).forEach(function (clave) {
    const r = registrados[clave];
    const coincidencias = [];
    estudiantes.forEach(function (est, i) {
      if (coincide_(clave, est.clave)) coincidencias.push(i);
    });
    if (coincidencias.length === 1) {
      const destino = resumen[coincidencias[0]];
      Object.keys(r.nombres).forEach(function (n) { destino.nombres[n] = true; });
      Object.keys(r.juegos).forEach(function (j) { destino.juegos[j] = true; });
      Object.keys(r.rondas).forEach(function (k) { destino.rondas[k] = r.rondas[k]; });
    } else {
      sinCoincidencia.push({
        nombre: Object.keys(r.nombres).join('; '),
        grupos: Object.keys(r.grupos).filter(String).sort().join(', '),
        juegos: Object.keys(r.juegos).length,
        rondas: Object.keys(r.rondas).length,
        puntaje: sumar_(r.rondas),
        observacion: coincidencias.length === 0
          ? 'Sin coincidencia'
          : 'Coincide con varios: ' + coincidencias.map(function (i) { return estudiantes[i].nombre; }).join('; ')
      });
    }
  });
  sinCoincidencia.sort(function (a, b) { return a.nombre.localeCompare(b.nombre, 'es'); });

  let hoja = libro.getSheetByName(HOJA_PARTICIPACION);
  if (hoja) {
    hoja.clear();
  } else {
    hoja = libro.insertSheet(HOJA_PARTICIPACION);
  }
  const encabezados = ['Nombre', 'Programa', 'Participó', 'Juegos', 'Rondas jugadas', 'Puntaje total', 'Nombre registrado'];
  hoja.getRange(1, 1, 1, encabezados.length).setValues([encabezados]).setFontWeight('bold');
  hoja.setFrozenRows(1);
  let participaron = 0;
  const filas = estudiantes.map(function (est, i) {
    const s = resumen[i];
    const juegos = Object.keys(s.juegos).length;
    const participo = juegos > 0;
    if (participo) participaron++;
    return [
      texto_(est.nombre), texto_(est.programa), participo ? 'Sí' : 'No', juegos,
      Object.keys(s.rondas).length, sumar_(s.rondas), texto_(Object.keys(s.nombres).join('; '))
    ];
  });
  let fila = 2;
  if (filas.length > 0) {
    hoja.getRange(fila, 1, filas.length, encabezados.length).setValues(filas);
    fila += filas.length;
  }

  fila += 1;
  hoja.getRange(fila, 1).setValue('Nombres sin coincidencia').setFontWeight('bold');
  fila += 1;
  const encabezadosSin = ['Nombre registrado', 'Grupo', 'Juegos', 'Rondas jugadas', 'Puntaje total', 'Observación'];
  hoja.getRange(fila, 1, 1, encabezadosSin.length).setValues([encabezadosSin]).setFontWeight('bold');
  fila += 1;
  if (sinCoincidencia.length === 0) {
    hoja.getRange(fila, 1).setValue('Ninguno');
  } else {
    hoja.getRange(fila, 1, sinCoincidencia.length, encabezadosSin.length).setValues(sinCoincidencia.map(function (s) {
      return [texto_(s.nombre), texto_(s.grupos), s.juegos, s.rondas, s.puntaje, texto_(s.observacion)];
    }));
  }
  hoja.autoResizeColumns(1, encabezados.length);

  let aviso = 'Participación actualizada. ' + participaron + ' de ' + estudiantes.length +
    ' estudiantes participaron. Nombres sin coincidencia: ' + sinCoincidencia.length + '.';
  if (estudiantes.length === 0) aviso = 'La hoja Estudiantes está vacía. ' + aviso;
  if (pruebas > 0) aviso += ' Filas de prueba excluidas: ' + pruebas + '.';
  libro.toast(aviso, 'Juego del impostor', 10);
}

// Hay coincidencia cuando todas las palabras escritas en el juego aparecen en
// el nombre de la lista, con un mínimo de dos palabras.
function coincide_(claveJuego, claveLista) {
  const escritas = claveJuego.split(' ').filter(String);
  if (escritas.length < 2) return false;
  const lista = claveLista.split(' ');
  return escritas.every(function (palabra) { return lista.indexOf(palabra) !== -1; });
}

// Minúsculas, sin tildes, sin signos y sin espacios repetidos.
function normalizar_(texto) {
  return leerTexto_(texto)
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function leerEstudiantes_(libro) {
  const hoja = libro.getSheetByName(HOJA_ESTUDIANTES);
  if (!hoja || hoja.getLastRow() < 2) return [];
  const ancho = Math.max(2, hoja.getLastColumn());
  const valores = hoja.getRange(1, 1, hoja.getLastRow(), ancho).getValues();
  const titulos = valores[0].map(normalizar_);
  let colNombre = titulos.indexOf('nombre');
  let colPrograma = titulos.indexOf('programa');
  if (colNombre === -1) colNombre = 0;
  if (colPrograma === -1) colPrograma = 1;
  return valores.slice(1)
    .map(function (v) {
      const nombre = leerTexto_(v[colNombre]);
      return { nombre: nombre, programa: leerTexto_(v[colPrograma]), clave: normalizar_(nombre) };
    })
    .filter(function (est) { return est.clave; });
}

/* ---------- Utilidades ---------- */

function hoja_(libro, nombre, encabezados) {
  let hoja = libro.getSheetByName(nombre);
  if (!hoja) hoja = libro.insertSheet(nombre);
  if (hoja.getLastRow() === 0) {
    hoja.getRange(1, 1, 1, encabezados.length).setValues([encabezados]).setFontWeight('bold');
    hoja.setFrozenRows(1);
    if (encabezados[0] === 'Marca temporal') {
      hoja.getRange(2, 1, hoja.getMaxRows() - 1, 1).setNumberFormat('yyyy-mm-dd hh:mm:ss');
    }
  }
  return hoja;
}

function agregarFilas_(hoja, filas) {
  const primera = hoja.getLastRow() + 1;
  const ultima = primera + filas.length - 1;
  const maximo = hoja.getMaxRows();
  if (ultima > maximo) hoja.insertRowsAfter(maximo, ultima - maximo);
  hoja.getRange(primera, 1, filas.length, filas[0].length).setValues(filas);
  SpreadsheetApp.flush();
}

function leerFilas_(libro, nombre, ancho) {
  const hoja = libro.getSheetByName(nombre);
  if (!hoja || hoja.getLastRow() < 2) return [];
  return hoja.getRange(2, 1, hoja.getLastRow() - 1, ancho).getValues();
}

// Limpia el texto recibido. Antepone un apóstrofo a lo que empieza por =, +, - o @,
// para que Sheets lo guarde como texto y no como fórmula.
function texto_(valor) {
  if (valor === null || valor === undefined) return '';
  let texto = String(valor)
    .replace(/[\u0000-\u001F\u007F]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, MAX_TEXTO);
  if (/^[=+\-@]/.test(texto)) texto = "'" + texto;
  return texto;
}

function numero_(valor) {
  if (valor === null || valor === undefined || valor === '') return '';
  const n = Number(valor);
  return isFinite(n) ? n : '';
}

function leerTexto_(valor) {
  if (valor instanceof Date) return Utilities.formatDate(valor, ZONA_HORARIA, 'yyyy-MM-dd');
  if (valor === null || valor === undefined) return '';
  return String(valor).trim();
}

function sumar_(objeto) {
  return Object.keys(objeto).reduce(function (suma, k) { return suma + objeto[k]; }, 0);
}

function responder_(objeto) {
  return ContentService.createTextOutput(JSON.stringify(objeto)).setMimeType(ContentService.MimeType.JSON);
}
