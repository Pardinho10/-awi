/**
 * Adaptadores entre el catálogo del backend y lo que consume la vista.
 *
 * Entrada:
 *   - objeto del listado GET /api/objetos/ (o el mismo shape del mock):
 *     slug, nombre, tipo, rol, ra_deg, dec_deg, epoca, pm_*, fov_arcmin,
 *     astrometria_disponible, estado, cantidad_cuadros.
 *   - cuadro del detalle GET /api/objetos/<slug>/:
 *     fecha (ISO8601 UTC), url (relativa, tipo /media/<slug>/frames/0000.png),
 *     longitud_onda_um, calidad_ok, pos_esperada_px.
 *
 * Salida: el modelo de vista que ya usa App.vue, más los campos observacionales
 * reales (fecha ISO, longitud de onda, calidad) para que la vista pueda mostrarlos
 * sin recalcular nada.
 *
 * Toda la traducción vive acá: la vista no sabe si los datos vienen del mock o
 * de la API.
 */

import { PRESENTACION } from './objects.mock.js';

const TIPO_LABEL = {
  estrella_movimiento_propio: 'Estrella de alto movimiento propio',
  enana_marron_Y: 'Enana marrón clase Y',
  enana_marron: 'Enana marrón',
  estrella_variable: 'Estrella variable',
};

/** Nombre del objeto en inglés. Los del backend vienen en español. */
const NOMBRE_EN = Object.freeze({
  barnard: "Barnard's Star",
  'wise-0855': 'WISE 0855-0714',
  'epsilon-indi-b': 'Epsilon Indi B',
  'rw-aurigae': 'RW Aurigae',
  'r-draconis': 'R Draconis',
});

/** Código de uso demostrativo por objeto, para traducir el texto en la vista. */
const USO_POR_SLUG = Object.freeze({
  barnard: 'movimiento',
  'wise-0855': 'bonus',
  'epsilon-indi-b': 'sistema',
  'rw-aurigae': 'variabilidad',
  'r-draconis': 'variabilidad',
});

const USO_POR_TIPO = Object.freeze({
  estrella_movimiento_propio: 'movimiento',
  estrella_variable: 'variabilidad',
});

const TIPO_LABEL_EN = {
  estrella_movimiento_propio: 'High proper motion star',
  enana_marron_Y: 'Y-class brown dwarf',
  enana_marron: 'Brown dwarf',
  estrella_variable: 'Variable star',
};

const TAG_EN = {
  MOVIMIENTO: 'MOTION',
  BONUS: 'BONUS',
  SISTEMA: 'SYSTEM',
  VARIABLE: 'VARIABLE',
  OBJETO: 'OBJECT',
};

const ROL_LABEL = {
  principal: 'Objeto principal',
  secundario: 'Objeto secundario',
};

/** Texto honesto para cuadros sin longitud de onda publicada por el backend. */
export const BAND_SIN_DATO = 'Banda sin dato';

const pad = (value, size = 2) => String(value).padStart(size, '0');

/** 269.45207696° -> "17h 57m 48.50s" */
export function formatRa(raDeg) {
  if (!Number.isFinite(raDeg)) return null;
  const totalHoras = (((raDeg % 360) + 360) % 360) / 15;
  const horas = Math.floor(totalHoras);
  const minutos = Math.floor((totalHoras - horas) * 60);
  const segundos = (totalHoras - horas - minutos / 60) * 3600;
  return `${pad(horas)}h ${pad(minutos)}m ${segundos.toFixed(2)}s`;
}

/** 4.69336497° -> "+04° 41′ 36.1″" */
export function formatDec(decDeg) {
  if (!Number.isFinite(decDeg)) return null;
  const signo = decDeg < 0 ? '−' : '+';
  const abs = Math.abs(decDeg);
  const grados = Math.floor(abs);
  const minutos = Math.floor((abs - grados) * 60);
  const segundos = (abs - grados - minutos / 60) * 3600;
  return `${signo}${pad(grados)}° ${pad(minutos)}′ ${segundos.toFixed(1)}″`;
}

/**
 * ISO8601 UTC -> 'YYYY-MM-DD'.
 *
 * Se corta la cadena en vez de convertir a fecha local: el backend publica en
 * UTC y convertirla movería el día según la zona horaria del navegador.
 */
export function formatFrameDate(value) {
  if (typeof value !== 'string') return '';
  const iso = value.trim();
  if (!iso) return '';
  const directo = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  if (directo) return `${directo[1]}-${directo[2]}-${directo[3]}`;
  const fecha = new Date(iso);
  return Number.isNaN(fecha.getTime()) ? iso : fecha.toISOString().slice(0, 10);
}

/**
 * Longitud de onda -> rótulo de banda.
 *
 * El backend publica `longitud_onda_um` real por cuadro (4.9565, 4.4778…), así
 * que la banda se muestra como esa longitud de onda con dos decimales.
 * Si el dato faltara, se dice "Banda sin dato": no se inventa un valor.
 */
export function formatBand(longitudOndaUm) {
  const um = Number(longitudOndaUm);
  if (!Number.isFinite(um) || um <= 0) return BAND_SIN_DATO;
  return `${um.toFixed(2)} μm`;
}

/** Resuelve la URL del cuadro contra la base del backend (prefijo /media/). */
export function resolveFrameUrl(url, apiBase) {
  if (typeof url !== 'string') return null;
  const valor = url.trim();
  if (!valor) return null;
  try {
    return new URL(valor, apiBase).href;
  } catch {
    return valor;
  }
}

function posicionEsperada(valor) {
  if (!valor || typeof valor !== 'object') return null;
  const x = Number(valor.x);
  const y = Number(valor.y);
  if (!Number.isFinite(x) || !Number.isFinite(y)) return null;
  return Object.freeze({ x, y });
}

/** Lado del recorte en píxeles (el backend lo publica por objeto). */
function tamanoEnPx(valor) {
  const numero = Number(valor);
  return Number.isFinite(numero) && numero > 0 ? numero : null;
}

/**
 * Cuadro del backend -> cuadro de la vista.
 *
 * Devolver `illustrative: false` solo acá es lo que sostiene la honestidad del
 * modo API: un cuadro existe únicamente si el backend lo devolvió, así que nunca
 * se etiqueta como real un cuadro que no vino de una respuesta 200.
 */
export function toFrameVista(cuadro, { apiBase, tamanoPx } = {}) {
  if (!cuadro || typeof cuadro !== 'object') return null;
  const url = resolveFrameUrl(cuadro.url, apiBase);
  if (!url) return null;
  const um = Number(cuadro.longitud_onda_um);

  return Object.freeze({
    // contrato de la vista
    date: formatFrameDate(cuadro.fecha),
    band: formatBand(cuadro.longitud_onda_um),
    url,
    illustrative: false,
    // datos observacionales reales, tal como los publica el backend
    fechaIso: typeof cuadro.fecha === 'string' ? cuadro.fecha : null,
    longitudOndaUm: Number.isFinite(um) && um > 0 ? um : null,
    calidadOk: cuadro.calidad_ok === true,
    posEsperadaPx: posicionEsperada(cuadro.pos_esperada_px),
    // Tamaño del recorte, necesario para ubicar la posición en la imagen.
    tamanoPx: tamanoEnPx(tamanoPx),
  });
}

/**
 * Serie de cuadros -> frames de la vista, ordenados por fecha ascendente.
 * Los cuadros sin URL utilizable se descartan (no se inventa una imagen).
 */
export function toFramesVista(cuadros, { apiBase, tamanoPx } = {}) {
  if (!Array.isArray(cuadros)) return [];
  return cuadros
    .slice()
    .sort((a, b) => String(a?.fecha ?? '').localeCompare(String(b?.fecha ?? '')))
    .map((cuadro) => toFrameVista(cuadro, { apiBase, tamanoPx }))
    .filter(Boolean);
}

/**
 * Punto de la curva de brillo (latido) del backend -> punto de la vista.
 *
 * El backend publica:
 *   { fecha, longitud_onda_um, brillo, brillo_error, unidad }
 * La vista venía esperando `flujo` y `error`, así que se aceptan los dos juegos
 * de nombres (`brillo ?? flujo`, `brillo_error ?? error`) y se conservan las dos
 * claves: así nada de la interfaz depende de cuál publicó el backend.
 *
 * Se descarta el punto sin fecha (no se puede ubicar en el tiempo) y el punto
 * sin valor (no hay nada que dibujar); un valor ausente nunca se convierte en 0.
 */
function numeroONull(valor) {
  if (valor === null || valor === undefined || valor === '') return null;
  const numero = Number(valor);
  return Number.isFinite(numero) ? numero : null;
}

/** Unidad de brillo publicada por el backend; 'Jy' es el default acordado. */
export const UNIDAD_BRILLO_POR_DEFECTO = 'Jy';

function unidadONull(valor) {
  return typeof valor === 'string' && valor.trim() ? valor.trim() : null;
}

export function toLatidoVista(puntos) {
  if (!Array.isArray(puntos)) return [];
  return puntos
    .map((punto) => {
      if (!punto || typeof punto !== 'object') return null;
      const fecha = typeof punto.fecha === 'string' ? punto.fecha.trim() : '';
      if (!fecha) return null;

      const brillo = numeroONull(punto.brillo ?? punto.flujo);
      if (brillo === null) return null;

      return Object.freeze({
        fecha,
        // contrato de la vista (con alias para no romper al gráfico)
        brillo,
        flujo: brillo,
        error: numeroONull(punto.brillo_error ?? punto.error),
        unidad: unidadONull(punto.unidad) ?? UNIDAD_BRILLO_POR_DEFECTO,
        longitudOndaUm: numeroONull(punto.longitud_onda_um),
      });
    })
    .filter(Boolean)
    .sort((a, b) => a.fecha.localeCompare(b.fecha));
}

const esObjeto = (valor) => Boolean(valor) && typeof valor === 'object' && !Array.isArray(valor);

/**
 * Ficha completa del backend -> detalle que consume la vista.
 *
 * Honestidad:
 *  - `estado` describe los DATOS DEL OBJETO, no la curva de brillo: si hay
 *    cuadros, el objeto es 'ok' aunque el latido venga vacío (caso Barnard, 9
 *    cuadros y sin curva de brillo). Solo es 'sin_datos' si no hay ningún cuadro.
 *  - El mensaje sobre la curva vacía va en `motivoLatido`; `motivo` queda para
 *    el motivo que publica el backend sobre el objeto.
 *  - `latido: []` cuando no hay puntos: no se rellena la curva con nada.
 */
export function toDetalleVista(datos, { apiBase, motivoSinLatido = 'Todavía no hay una curva de brillo disponible.' } = {}) {
  if (!esObjeto(datos)) return null;
  const cuadros = toFramesVista(datos.cuadros, { apiBase, tamanoPx: datos.tamano_px });
  const latido = toLatidoVista(datos.latido);
  const motivoBackend = typeof datos.motivo === 'string' ? datos.motivo.trim() : '';
  const sinCuadros = cuadros.length === 0;
  const sinLatido = latido.length === 0;

  return Object.freeze({
    slug: typeof datos.slug === 'string' && datos.slug.trim() ? datos.slug.trim() : null,
    // Estado del objeto: depende de los cuadros, no de la curva de brillo.
    estado: sinCuadros ? 'sin_datos' : 'ok',
    // Motivo que publica el backend sobre el objeto (no sobre el latido).
    // `motivoCodigo` es la clave traducible; `motivo` queda como texto original.
    motivo: motivoBackend,
    motivoCodigo: typeof datos.motivo_codigo === 'string' && datos.motivo_codigo.trim()
      ? datos.motivo_codigo.trim()
      : null,
    latido,
    // Estado propio de la curva de brillo, para no mezclarlo con el del objeto.
    latidoEstado: sinLatido ? 'sin_datos' : 'ok',
    motivoLatido: sinLatido ? (motivoBackend || motivoSinLatido) : '',
    cuadros,
    // Metadatos reales del recorte: campo, escala y tamaño en píxeles.
    metadatos: Object.freeze({
      fovArcmin: numeroONull(datos.fov_arcmin),
      pixelArcsec: numeroONull(datos.pixel_arcsec),
      tamanoPx: tamanoEnPx(datos.tamano_px),
    }),
    rastro: esObjeto(datos.rastro) ? datos.rastro : null,
    revelar: esObjeto(datos.revelar) ? datos.revelar : null,
    conocido: esObjeto(datos.conocido) ? datos.conocido : null,
  });
}

/**
 * Las cifras vienen del catálogo del backend, pero el frontend no las verifica
 * ni las usa para calcular: la interfaz las muestra siempre rotuladas.
 */
function coordenadas(raw) {
  const ra = formatRa(raw.ra_deg);
  const dec = formatDec(raw.dec_deg);
  if (!ra || !dec) return null;
  return Object.freeze({
    ra,
    dec,
    raDeg: raw.ra_deg,
    decDeg: raw.dec_deg,
    epoca: raw.epoca ?? null,
    status: 'catalogo',
    statusLabel: 'CATÁLOGO',
    // Claves traducibles: la vista arma el rótulo y la nota en el idioma activo.
    statusLabelKey: 'catalogo',
    note:
      'Coordenadas publicadas por SIMBAD/Gaia DR3. ' +
      'El frontend las muestra sin verificarlas ni recalcularlas.',
  });
}

/**
 * Texto de "para qué sirve" cuando el objeto no tiene presentación propia.
 * En modo API manda el estado real: si no hay cuadros, se dice.
 */
function usoHonesto(raw, extra) {
  if (raw.estado === 'sin_datos') {
    return 'Todavía no hay cuadros procesados para este objeto.';
  }
  if (extra.uso) return extra.uso;
  if (raw.estado === 'ok') {
    const total = Number(raw.cantidad_cuadros);
    if (Number.isFinite(total) && total > 0) {
      return `${total} cuadros procesados.`;
    }
  }
  return '';
}

export function toObjetoVista(raw) {
  const extra = PRESENTACION[raw.slug] ?? {};
  const pm = Number.isFinite(raw.pm_ra_cosdec_mas_yr) && Number.isFinite(raw.pm_dec_mas_yr)
    ? Object.freeze({ ra: raw.pm_ra_cosdec_mas_yr, dec: raw.pm_dec_mas_yr })
    : null;
  const cantidad = Number(raw.cantidad_cuadros);

  return Object.freeze({
    // contrato del backend
    slug: raw.slug,
    nombre: raw.nombre,
    tipo: raw.tipo,
    rol: raw.rol,
    fovArcmin: raw.fov_arcmin ?? null,
    pm,
    coordinates: coordenadas(raw),
    estado: raw.estado ?? null,
    cantidadCuadros: Number.isFinite(cantidad) ? cantidad : null,
    astrometriaDisponible: raw.astrometria_disponible ?? null,
    // alias que usa la vista
    id: raw.slug,
    name: raw.nombre,
    // Nombre localizado: la vista elige según el idioma activo.
    nameEn: NOMBRE_EN[raw.slug] ?? raw.nombre,
    kind: TIPO_LABEL[raw.tipo] ?? raw.tipo,
    kindEn: TIPO_LABEL_EN[raw.tipo] ?? raw.tipo,
    tagEn: TAG_EN[extra.tag] ?? extra.tag ?? 'OBJECT',
    tag: extra.tag ?? ROL_LABEL[raw.rol] ?? 'OBJETO',
    demoRole: extra.papel ?? ROL_LABEL[raw.rol] ?? '',
    demoUse: usoHonesto(raw, extra),
    // Clave traducible del texto de uso; `demoUse` queda como respaldo en español.
    usoCodigo: raw.estado === 'sin_datos'
      ? 'sin_cuadros'
      : (USO_POR_SLUG[raw.slug] ?? USO_POR_TIPO[raw.tipo] ?? 'general'),
  });
}
