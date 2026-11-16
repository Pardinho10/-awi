/**
 * Fuente `api`: los datos reales del backend Django de Nawi.
 *
 * Endpoints (contrato en backend/api/urls.py):
 *   GET /api/objetos/              -> array plano de objetos
 *   GET /api/objetos/<slug>/       -> ficha con `cuadros[]` (y `estado`, `motivo`…)
 *
 * Funciona en cualquier origen porque el backend ya tiene CORS habilitado para
 * el frontend (http://localhost:5178 en desarrollo).
 *
 * Variables de entorno:
 *   VITE_API_BASE             base del backend, sin barra final
 *                             (default http://127.0.0.1:8010)
 *   VITE_NAWI_DATA_SOURCE=api activa esta fuente en src/data/catalog/index.js
 *
 * Honestidad: acá no hay datos de relleno. Si el backend no responde, estas
 * funciones rechazan con un mensaje en español y la interfaz muestra el error;
 * nunca se devuelve un objeto o un cuadro inventado. Los frames que salen de
 * acá llevan `illustrative: false` porque solo existen si vinieron de una
 * respuesta 200 del backend (ver ../adapters.js).
 */

import { toDetalleVista, toFramesVista } from '../adapters.js';

export const DEFAULT_API_BASE = 'http://127.0.0.1:8010';

/** Tiempo máximo de espera por respuesta del backend. */
const TIMEOUT_MS = 12000;

function readApiBase() {
  try {
    const configurado = import.meta.env?.VITE_API_BASE;
    const valor = typeof configurado === 'string' ? configurado.trim() : '';
    return (valor || DEFAULT_API_BASE).replace(/\/+$/, '');
  } catch {
    return DEFAULT_API_BASE;
  }
}

export const API_BASE = readApiBase();

/**
 * Última respuesta del backend. No se usa para decidir qué mostrar (eso lo hace
 * el manejo de errores), sino para diagnóstico: permite saber si la fuente ya
 * habló con el backend y con qué resultado.
 */
export const apiHealth = {
  contacted: false,
  ok: false,
  error: null,
  at: null,
  base: API_BASE,
};

function marcarContacto(ok, error = null) {
  apiHealth.contacted = true;
  apiHealth.ok = ok;
  apiHealth.error = error;
  apiHealth.at = new Date().toISOString();
}

/**
 * Error con `code` + `params` para que la vista lo traduzca. El mensaje en
 * español queda como respaldo (consola, consumidores sin i18n).
 */
function fallo(code, params, mensaje) {
  const error = new Error(mensaje ?? code);
  error.code = code;
  error.params = params ?? {};
  return error;
}

function esJson(response) {
  return String(response.headers.get('content-type') ?? '').toLowerCase().includes('json');
}

function mensajeDelCuerpo(cuerpo) {
  if (!cuerpo || typeof cuerpo !== 'object') return '';
  for (const clave of ['mensaje', 'error', 'detail']) {
    const valor = cuerpo[clave];
    if (typeof valor === 'string' && valor.trim()) return valor.trim();
  }
  return '';
}

/**
 * GET + parseo con errores explícitos en español.
 * `descripcion` se usa para redactar el mensaje ("el catálogo", "el objeto «x»").
 */
async function requestJson(path, recurso) {
  const url = `${API_BASE}${path}`;
  const etiqueta = recurso.code === 'objeto' ? `el objeto «${recurso.slug}»` : 'el catálogo de objetos';
  const control = new AbortController();
  const temporizador = setTimeout(() => control.abort(), TIMEOUT_MS);

  let response;
  try {
    response = await fetch(url, {
      headers: { Accept: 'application/json' },
      signal: control.signal,
    });
  } catch (error) {
    const abortado = error?.name === 'AbortError';
    const base = { recurso: recurso.code, ...(recurso.slug ? { slug: recurso.slug } : {}), base: API_BASE };
    const mensaje = abortado
      ? `La consulta de ${etiqueta} tardó más de ${TIMEOUT_MS / 1000} segundos.`
      : `No pudimos obtener ${etiqueta}. Revisá tu conexión e intentá de nuevo.`;
    marcarContacto(false, mensaje);
    throw abortado
      ? fallo('timeout', { ...base, segundos: TIMEOUT_MS / 1000 }, mensaje)
      : fallo('network', base, mensaje);
  } finally {
    clearTimeout(temporizador);
  }

  const texto = await response.text().catch(() => '');
  let cuerpo = null;
  let parseoOk = false;
  if (texto) {
    try {
      cuerpo = JSON.parse(texto);
      parseoOk = true;
    } catch {
      parseoOk = false;
    }
  } else {
    parseoOk = true; // cuerpo vacío: no es un error de formato, se evalúa por status
  }

  if (!response.ok) {
    const detalle = mensajeDelCuerpo(cuerpo);
    const base = { recurso: recurso.code, ...(recurso.slug ? { slug: recurso.slug } : {}), status: response.status, detalle: detalle ? ` ${detalle}` : '' };
    const mensaje = response.status === 404
      ? `No encontramos ${etiqueta}.${detalle ? ` ${detalle}` : ''}`
      : `No pudimos obtener ${etiqueta} (código ${response.status}).${detalle ? ` ${detalle}` : ''}`;
    marcarContacto(false, mensaje);
    throw fallo(response.status === 404 ? 'notFound' : 'http', base, mensaje);
  }

  if (!parseoOk || (!esJson(response) && cuerpo === null)) {
    const mensaje =
      `Recibimos una respuesta inesperada al pedir ${etiqueta}. ` +
      'Probá de nuevo en unos instantes.';
    marcarContacto(false, mensaje);
    throw fallo('notJson', {
      recurso: recurso.code,
      ...(recurso.slug ? { slug: recurso.slug } : {}),
      tipo: response.headers.get('content-type') || 'desconocido',
    }, mensaje);
  }

  marcarContacto(true, null);
  return cuerpo;
}

function tieneAstrometria(objeto) {
  return Number.isFinite(objeto?.ra_deg) && Number.isFinite(objeto?.dec_deg);
}

/**
 * El listado del backend trae solo identidad y estado, sin coordenadas. La
 * astrometría vive en /api/objetos/<slug>/catalogo/ (bloque `astrometria`).
 * Para no mostrar "coordenadas pendientes" cuando el dato sí existe, se pide
 * en paralelo solo a los objetos que no la traen. Si una consulta falla, ese
 * objeto queda sin coordenadas: nunca se rellena con datos inventados.
 */
async function completarAstrometria(objetos) {
  const pendientes = objetos.filter((o) => o?.slug && !tieneAstrometria(o));
  if (!pendientes.length) return objetos;

  const porSlug = new Map();
  await Promise.all(pendientes.map(async (objeto) => {
    try {
      const ficha = await requestJson(
        `/api/objetos/${encodeURIComponent(objeto.slug)}/catalogo/`,
        { code: 'objeto', slug: objeto.slug },
      );
      const astrometria = ficha?.astrometria;
      if (astrometria && Number.isFinite(astrometria.ra_deg)) porSlug.set(objeto.slug, astrometria);
    } catch {
      /* sin astrometría para ese objeto: la vista lo marcará como pendiente */
    }
  }));

  if (!porSlug.size) return objetos;

  return objetos.map((objeto) => {
    const astrometria = porSlug.get(objeto.slug);
    if (!astrometria) return objeto;
    return {
      ...objeto,
      ra_deg: astrometria.ra_deg,
      dec_deg: astrometria.dec_deg,
      epoca: astrometria.fecha_referencia ?? astrometria.epoca ?? null,
      pm_ra_cosdec_mas_yr: astrometria.pm_ra_cosdec_mas_yr,
      pm_dec_mas_yr: astrometria.pm_dec_mas_yr,
    };
  });
}

export const apiSource = Object.freeze({
  mode: 'api',
  // La fuente es el backend real: lo que devuelve son sus datos. Si el backend
  // falla, la promesa rechaza y la interfaz muestra el error; no hay relleno.
  status: 'live',
  label: 'Observaciones SPHEREx',
  illustrative: false,
  apiBase: API_BASE,

  /** Catálogo crudo del backend (lo traduce ../adapters.js a modelo de vista). */
  async listObjects() {
    const datos = await requestJson('/api/objetos/', { code: 'catalogo' });
    if (!Array.isArray(datos)) {
      const mensaje = 'Los datos del catálogo llegaron con un formato inesperado.';
      marcarContacto(false, mensaje);
      throw fallo('formato', { recurso: 'catalogo' }, mensaje);
    }
    return completarAstrometria(datos);
  },

  /**
   * Serie temporal de un objeto, ya traducida a frames de la vista.
   * Si el objeto existe pero no tiene datos precalculados, devuelve [] (la ficha
   * del backend viene con `estado: "sin_datos"` y `cuadros: []`).
   */
  async listFrames(slug) {
    if (typeof slug !== 'string' || !slug.trim()) {
      throw fallo('sinSlug', { recurso: 'objeto', slug: '' }, 'Falta el identificador del objeto para pedir los cuadros.');
    }
    const datos = await requestJson(
      `/api/objetos/${encodeURIComponent(slug.trim())}/`,
      { code: 'objeto', slug: slug.trim() },
    );
    if (!datos || typeof datos !== 'object' || Array.isArray(datos)) {
      const mensaje = `Los datos de «${slug.trim()}» llegaron con un formato inesperado.`;
      marcarContacto(false, mensaje);
      throw fallo('formato', { recurso: 'objeto', slug: slug.trim() }, mensaje);
    }
    const cuadros = Array.isArray(datos.cuadros) ? datos.cuadros : [];
    return toFramesVista(cuadros, { apiBase: API_BASE, tamanoPx: datos.tamano_px });
  },

  /**
   * Ficha completa del objeto: estado, motivo, latido (curva de brillo),
   * cuadros, rastro, revelar y conocido.
   *
   * Devuelve el detalle normalizado (../adapters.js -> toDetalleVista):
   *   { slug, estado, motivo, latido, cuadros, rastro, revelar, conocido }
   *
   * El backend publica en `latido` las mediciones precalculadas. RW Aurigae
   * tiene actualmente 7 puntos; los demás objetos devuelven `[]`. La fuente
   * normaliza los puntos sin inventarlos ni recalcularlos.
   */
  async getDetalleObjeto(slug) {
    if (typeof slug !== 'string' || !slug.trim()) {
      throw fallo('sinSlug', { recurso: 'objeto', slug: '' }, 'Falta el identificador del objeto para pedir el detalle.');
    }
    const datos = await requestJson(
      `/api/objetos/${encodeURIComponent(slug.trim())}/`,
      { code: 'objeto', slug: slug.trim() },
    );
    const detalle = toDetalleVista(datos, { apiBase: API_BASE });
    if (!detalle) {
      const mensaje = `Los datos de «${slug.trim()}» llegaron con un formato inesperado.`;
      marcarContacto(false, mensaje);
      throw fallo('formato', { recurso: 'objeto', slug: slug.trim() }, mensaje);
    }
    return detalle;
  },
});
