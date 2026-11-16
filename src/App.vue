<script setup>
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { DATA_SOURCE_INFO, catalog } from './data/catalog/index.js';
import LatidoChart from './components/LatidoChart.vue';
import RastroPanel from './components/RastroPanel.vue';
import IconoNawi from './components/IconoNawi.vue';
import HeroNawi from './components/HeroNawi.vue';
import CursorNawi from './components/CursorNawi.vue';
import LangSwitch from './components/LangSwitch.vue';
import GlosarioNawi from './components/GlosarioNawi.vue';
import { locale } from './i18n/index.js';

const { t } = useI18n();

// Tema claro/oscuro: arranca según la preferencia del sistema y se recuerda en localStorage.
const THEME_KEY = 'nawi-theme';
/* Coinciden con --hx-void de cada tema, para la barra del navegador móvil. */
const THEME_COLORS = { dark: '#07080F', light: '#E9ECF5' };

function readStoredTheme() {
  try {
    const saved = window.localStorage.getItem(THEME_KEY);
    return saved === 'light' || saved === 'dark' ? saved : null;
  } catch {
    return null;
  }
}

// Oscuro por defecto (regla de la guía); el claro es una elección explícita y se recuerda.
const theme = ref(readStoredTheme() ?? 'dark');
const isLight = computed(() => theme.value === 'light');

watch(theme, (value) => {
  document.documentElement.dataset.theme = value;
  document.documentElement.style.colorScheme = value;
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', THEME_COLORS[value]);
  try {
    window.localStorage.setItem(THEME_KEY, value);
  } catch {
    /* modo privado: el tema vale solo para esta sesión */
  }
}, { immediate: true });

function toggleTheme() {
  theme.value = isLight.value ? 'dark' : 'light';
}

// Catálogo y cuadros vienen de la capa de datos intercambiable (src/data/catalog).
const objects = ref([]);
const frames = ref([]);
const framesInfo = ref({ estado: '', motivo: '' });
const latido = ref({ estado: 'idle', motivo: '', puntos: [] });
// Metadatos reales del recorte (campo, escala, tamaño) que publica el backend.
const metadatos = ref(null);
// Detalle crudo de la ficha: de acá sale el bloque `rastro` (D2).
const detalle = ref(null);
const loading = ref(true);
const loadError = ref('');

const objectId = ref('');
const frameIndex = ref(0);
const playing = ref(false);
const compare = ref(false);
const query = ref('');
const notice = ref('');
/**
 * ¿La barra superior está sobre el cover? En tema claro la barra cambia de
 * tinta: sobre la foto (oscura) usa tinta clara; sobre el catálogo (claro)
 * vuelve a la tinta oscura del tema. Se apaga con el cover fuera de pantalla.
 */
const sobreCover = ref(true);
let observadorCover = null;

const selectedObject = computed(() => objects.value.find((item) => item.id === objectId.value) ?? objects.value[0] ?? null);
const frame = computed(() => frames.value[frameIndex.value] ?? null);
const previousFrame = computed(() => frames.value[Math.max(0, frameIndex.value - 1)] ?? null);
const filteredObjects = computed(() => objects.value.filter((item) => `${item.name} ${item.kind}`.toLowerCase().includes(query.value.toLowerCase())));
const ready = computed(() => !loading.value && !loadError.value && Boolean(selectedObject.value) && Boolean(frame.value));
const progressPercent = computed(() => (frames.value.length > 1 ? (frameIndex.value / (frames.value.length - 1)) * 100 : 0));

/** Localidad para números y fechas, según el idioma activo. */
const localeNumero = computed(() => (locale.value === 'en' ? 'en-US' : 'es-AR'));

/**
 * Mensaje de error traducible. La capa de datos adjunta `code` + `params`;
 * si por algún motivo no viene, se usa el mensaje crudo como último recurso.
 */
function textoError(error) {
  const code = error?.code;
  if (!code) return error?.message || t('errors.catalogo');
  const params = { ...(error.params ?? {}) };
  // `recurso` viaja como clave ('catalogo' | 'objeto') y se traduce con su slug.
  if (params.recurso) params.recurso = t(`errors.recursos.${params.recurso}`, { slug: params.slug ?? '' });
  return t(`errors.${code}`, params);
}

// Zoom del recorte real. El PNG del backend son 58x58 px: no hay más detalle
// que ese, así que el zoom solo agranda. Se ofrecen escalas ENTERAS para que
// cada píxel del PNG caiga en un bloque exacto de pantalla (nunca fracciones,
// que deforman el bloque). 4x = 232 px por defecto en escritorio; también entra
// en pantallas chicas.
const ZOOMS = [1, 2, 4, 8];
const TAMANO_RECORTE_PX = 58;
const zoom = ref(4);
// 'píxel real' por defecto (vecino más cercano). 'suavizado' interpola y por eso
// NO muestra los píxeles originales: la interfaz lo avisa en el visor.
const suavizado = ref(false);
const zoomActivo = computed(() => (ZOOMS.includes(zoom.value) ? zoom.value : 4));
const zoomPx = computed(() => TAMANO_RECORTE_PX * zoomActivo.value);

/**
 * Posición del objeto en el recorte, en porcentaje, a partir de
 * `pos_esperada_px` y el tamaño en píxeles del cuadro. Si el backend no los
 * manda (o el objeto no tiene cuadros reales), se devuelve null y la cruz queda
 * en la posición genérica del CSS: nunca se inventa una coordenada.
 */
const marcadorReal = computed(() => {
  const pos = frame.value?.posEsperadaPx;
  const tam = frame.value?.tamanoPx ?? metadatos.value?.tamanoPx;
  if (!pos || !Number.isFinite(pos.x) || !Number.isFinite(pos.y)) return null;
  if (!Number.isFinite(tam) || tam <= 0) return null;
  const left = Math.min(100, Math.max(0, (pos.x / tam) * 100));
  const top = Math.min(100, Math.max(0, (pos.y / tam) * 100));
  return { left: `${left.toFixed(2)}%`, top: `${top.toFixed(2)}%` };
});

// Rastro (D2): desplazamiento medido por el backend entre el primer y el último
// cuadro. Solo Barnard lo trae con valores; el resto devuelve nulos, y en ese
// caso el panel no se muestra (nada de guiones vacíos).
const rastro = computed(() => detalle.value?.rastro ?? null);
const mostrarRastro = computed(() => {
  const valor = rastro.value?.desplazamiento_arcsec ?? rastro.value?.desplazamientoArcsec;
  if (valor === null || valor === undefined || valor === '') return false;
  return Number.isFinite(Number(valor));
});

const tamanoRecorte = computed(() => {
  const tam = frame.value?.tamanoPx ?? metadatos.value?.tamanoPx;
  return Number.isFinite(tam) && tam > 0 ? tam : 58;
});

/**
 * Trayectoria esperada: recta entre la posición del primer y del último cuadro
 * (`pos_esperada_px`, la misma que alimenta la cruz). El SVG comparte el sistema
 * de coordenadas nativo de la imagen (58x58 px), así que escala con el zoom y no
 * cambia con el modo suavizado. Es la recta entre dos posiciones informadas, no
 * un ajuste ni un suavizado de la trayectoria.
 */
const trayectoria = computed(() => {
  if (!mostrarRastro.value || frames.value.length < 2) return null;
  const primero = frames.value[0]?.posEsperadaPx;
  const ultimo = frames.value[frames.value.length - 1]?.posEsperadaPx;
  if (!primero || !ultimo) return null;
  if (![primero.x, primero.y, ultimo.x, ultimo.y].every((valor) => Number.isFinite(valor))) return null;
  return {
    x1: primero.x,
    y1: primero.y,
    x2: ultimo.x,
    y2: ultimo.y,
    desde: frames.value[0].date,
    hasta: frames.value[frames.value.length - 1].date,
  };
});

const fichaTecnica = computed(() => {
  const m = metadatos.value;
  if (!m) return [];
  const numero = (valor, decimales = 2) => valor.toLocaleString(localeNumero.value, {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimales,
  });
  const chips = [];
  if (Number.isFinite(m.fovArcmin)) chips.push(t('viewer.chipField', { n: numero(m.fovArcmin) }));
  if (Number.isFinite(m.pixelArcsec)) chips.push(t('viewer.chipScale', { n: numero(m.pixelArcsec) }));
  if (Number.isFinite(m.tamanoPx)) chips.push(t('viewer.chipPx', { n: m.tamanoPx }));
  return chips;
});

// Latido: solo para objetos de variabilidad (RW Aurigae, R Draconis).
const esVariable = computed(() => selectedObject.value?.tag === 'VARIABLE' || selectedObject.value?.tipo === 'estrella_variable');
// Objeto elegible pero sin cuadros: el visor debe decirlo, no quedar vacío.
const sinCuadros = computed(() => !loading.value && !loadError.value && Boolean(selectedObject.value) && frames.value.length === 0);
/**
 * Motivo que publica el backend sobre el objeto: no es un error de la app, es
 * una limitación científica informada (núcleo saturado, señal muy débil…).
 * El adaptador expone `motivoCodigo` (traducible) y deja `motivo` como respaldo.
 */
const motivoBackend = computed(() => {
  const d = detalle.value;
  if (!d) return '';
  const codigo = d.motivoCodigo;
  if (typeof codigo === 'string' && codigo.trim()) {
    const traducido = t(`motivo.${codigo.trim()}`);
    if (traducido !== `motivo.${codigo.trim()}`) return traducido;
  }
  const motivo = d.motivo;
  return typeof motivo === 'string' ? motivo.trim() : '';
});

/** Con cuadros, la advertencia va en el visor. Sin cuadros, ya lo dice el panel vacío. */
const motivoConCuadros = computed(() => (frames.value.length > 0 ? motivoBackend.value : ''));

// Panel vacío: el motivo del backend (si existe) o el de la respuesta de cuadros.
const motivoSinCuadros = computed(() => motivoBackend.value || framesInfo.value.motivo || '');
const estadoSinCuadros = computed(() => selectedObject.value?.estado || framesInfo.value.estado || '');
const tituloSinCuadros = computed(() => (
  estadoSinCuadros.value === 'sin_datos'
    ? t('viewer.empty.titleSinDatos')
    : t('viewer.empty.titleSinCuadros')
));
const hayCuadrosReales = computed(() => frames.value.some((item) => item.illustrative === false));
// El panel del latido solo aparece si hay curva que mostrar: un objeto sin
// mediciones de brillo no estrena un panel vacío (el gráfico igual sabe
// defenderse con su propio estado vacío).
const mostrarLatido = computed(() => (
  Boolean(selectedObject.value)
  && esVariable.value
  && (latido.value.puntos.length > 0 || latido.value.estado === 'loading')
));

/** Textos del hero, traducidos (el componente los recibe por prop). */
const heroTextos = computed(() => ({
  linea1: t('hero.line1'),
  linea2: t('hero.line2'),
  linea3Antes: t('hero.line3a'),
  linea3Oro: t('hero.line3em'),
  copy: t('hero.copy'),
  cifra1: '102',
  cifra1Rotulo: t('hero.statBands'),
  cifra2: t('hero.statMonthsValue'),
  cifra2Unidad: t('hero.statMonthsUnit'),
  cifra2Rotulo: t('hero.statMonthsCaption'),
  creditoAviso: t('hero.creditNotice'),
  datoEtiqueta: t('hero.dataLabel'),
  datoEscala: t('hero.dataScale'),
  bajar: t('hero.scrollHint'),
}));

/** Rótulo y nota de las coordenadas, traducidos (el backend manda el código). */
function rotuloCoordenadas(coords) {
  if (!coords) return '';
  const clave = coords.statusLabelKey ?? 'catalogo';
  const traducido = t(`viewer.coordsStatus.${clave}`);
  return traducido === `viewer.coordsStatus.${clave}` ? (coords.statusLabel ?? '') : traducido;
}
const notaCoordenadas = (coords) => t('viewer.coordsNote', { fuente: 'SIMBAD / Gaia DR3' });

/** Nombre/tipo/etiqueta del objeto en el idioma activo. */
const nombreDe = (o) => (locale.value === 'en' ? (o?.nameEn ?? o?.name ?? '') : (o?.name ?? ''));
const tipoDe = (o) => (locale.value === 'en' ? (o?.kindEn ?? o?.kind ?? '') : (o?.kind ?? ''));
const tagDe = (o) => (locale.value === 'en' ? (o?.tagEn ?? o?.tag ?? '') : (o?.tag ?? ''));

/** Nombre del objeto en el idioma activo (el backend lo manda en español). */
const nombreObjeto = computed(() => {
  const o = selectedObject.value;
  if (!o) return '';
  return locale.value === 'en' ? (o.nameEn ?? o.name) : o.name;
});

/** Texto de "para qué sirve" del objeto, traducido por código. */
const usoObjeto = computed(() => {
  const codigo = selectedObject.value?.usoCodigo;
  if (codigo) {
    const traducido = t(`objeto.uso.${codigo}`);
    if (traducido !== `objeto.uso.${codigo}`) return traducido;
  }
  return selectedObject.value?.demoUse ?? '';
});

// Lo que se puede afirmar según el estado de la fuente. 'pending' no se disfraza
// de datos del backend: se avisa que no hay nada conectado.
// DATA_SOURCE_INFO es un store reactivo: el estado cambia con cada consulta al
// backend ('pending' al arrancar, 'live' si respondió, 'error' si falló). Por eso
// los textos se calculan en un computed y no una sola vez al montar.
const ESTADOS_CON_COPIA = ['demo', 'live', 'pending', 'error'];
const sourceCopy = computed(() => {
  const estado = DATA_SOURCE_INFO.status;
  const clave = ESTADOS_CON_COPIA.includes(estado) ? estado : 'pending';
  const label = t('source.label');
  // El detalle técnico del error vive aparte: la nota queda legible y el mensaje
  // completo se muestra en el visor.
  const note = t(`source.${clave}.note`, { label });
  return { title: t(`source.${clave}.title`), note };
});
const dataSourceNote = computed(() => sourceCopy.value.note);

// El backend puede devolver los cuadros como array o como objeto con
// { estado, motivo, cuadros }: se aceptan las dos formas.
function normalizarCuadros(payload) {
  if (Array.isArray(payload)) return { cuadros: payload, estado: '', motivo: '' };
  if (payload && Array.isArray(payload.cuadros)) {
    return { cuadros: payload.cuadros, estado: payload.estado ?? '', motivo: payload.motivo ?? '' };
  }
  return { cuadros: [], estado: payload?.estado ?? '', motivo: payload?.motivo ?? '' };
}

async function loadFrames() {
  framesInfo.value = { estado: '', motivo: '' };
  if (!objectId.value) { frames.value = []; return; }
  try {
    const { cuadros, estado, motivo } = normalizarCuadros(await catalog.listFrames(objectId.value));
    frames.value = cuadros;
    framesInfo.value = { estado, motivo };
  } catch (error) {
    // "Sin datos" no es un error fatal: se muestra el panel vacío con el motivo.
    frames.value = [];
    framesInfo.value = { estado: 'sin_datos', motivo: textoError(error) };
  }
  if (frameIndex.value >= frames.value.length) frameIndex.value = 0;
}

// La capa de datos todavía está sumando el detalle por objeto: el latido puede
// llegar como campo del objeto o como método del catálogo. Se prueban los
// nombres previstos y, si no hay ninguno, el gráfico muestra su estado vacío.
const ACCESOS_LATIDO = ['getLatido', 'listLatido', 'getDetalleObjeto', 'getDetalle', 'getFicha', 'listDetalle'];

/** Métodos del catálogo que podrían traer el latido, sin depender del nombre exacto. */
function accesosLatido() {
  const conocidos = ACCESOS_LATIDO.filter((nombre) => typeof catalog[nombre] === 'function');
  const porPatron = Object.keys(catalog).filter((nombre) => (
    typeof catalog[nombre] === 'function'
    && !conocidos.includes(nombre)
    && nombre !== 'listObjects'
    && nombre !== 'listFrames'
    && /latido|detalle|ficha/i.test(nombre)
  ));
  return [...conocidos, ...porPatron];
}

function normalizarLatido(payload) {
  if (Array.isArray(payload)) return { puntos: payload, estado: payload.length ? 'ready' : 'empty', motivo: '' };
  if (payload && Array.isArray(payload.latido)) {
    return {
      puntos: payload.latido,
      estado: payload.estado || (payload.latido.length ? 'ready' : 'empty'),
      // `motivoLatido` es el mensaje de la curva; `motivo` es del objeto entero.
      motivo: payload.motivoLatido ?? payload.motivo ?? '',
    };
  }
  return null;
}

/**
 * Detalle del objeto: trae metadatos del recorte para todos y, además, la curva
 * de brillo cuando el objeto es variable. Si algo falla, se muestra el estado
 * vacío honesto; nunca se rellena con valores inventados.
 */
async function loadDetalle() {
  metadatos.value = null;
  detalle.value = null;
  const buscaLatido = esVariable.value;
  latido.value = { estado: buscaLatido ? 'loading' : 'idle', motivo: '', puntos: [] };
  if (!objectId.value) return;

  const aplicar = (payload, deCatalogo = false) => {
    // El rastro vive en la ficha del backend, no en el listado: solo se guarda
    // el payload que vino del catálogo para no pisarlo con el objeto de la lista.
    if (deCatalogo && payload) detalle.value = payload;
    if (payload?.metadatos) metadatos.value = payload.metadatos;
    if (!buscaLatido) return false;
    const respuesta = normalizarLatido(payload);
    if (!respuesta) return false;
    latido.value = respuesta;
    return true;
  };

  if (aplicar(selectedObject.value)) return;

  try {
    for (const acceso of accesosLatido()) {
      const payload = await catalog[acceso](objectId.value);
      if (aplicar(payload, true)) return;
      // Sin latido, pero con metadatos ya alcanza: no se siguen probando métodos.
      if (payload?.metadatos) return;
    }
    if (buscaLatido) latido.value = { estado: 'empty', motivo: '', puntos: [] };
  } catch (error) {
    if (buscaLatido) latido.value = { estado: 'empty', motivo: textoError(error), puntos: [] };
  }
}

// Único punto de carga: si mañana la fuente es la API, el resto de la vista no cambia.
async function loadCatalog() {
  loading.value = true;
  loadError.value = '';
  try {
    // Se leen los parámetros acá para respetar un enlace compartido (?obj=&frame=&lang=).
    const params = new URLSearchParams(window.location.search);
    objects.value = await catalog.listObjects();

    const requestedObject = params.get('obj');
    objectId.value = objects.value.some((item) => item.id === requestedObject)
      ? requestedObject
      : (objects.value[0]?.id ?? '');

    await loadFrames();
    await loadDetalle();

    const requestedFrame = Number(params.get('frame'));
    frameIndex.value = Number.isInteger(requestedFrame) && requestedFrame >= 0 && requestedFrame < frames.value.length
      ? requestedFrame
      : 0;
  } catch (error) {
    objects.value = [];
    frames.value = [];
    loadError.value = textoError(error);
  } finally {
    loading.value = false;
  }
}

watch([objectId, frameIndex], () => {
  if (loading.value || loadError.value) return;
  // Se conservan los parámetros existentes (lang) y solo se actualizan obj/frame.
  const nextParams = new URLSearchParams(window.location.search);
  nextParams.set('obj', objectId.value);
  nextParams.set('frame', String(frameIndex.value));
  window.history.replaceState({}, '', `${window.location.pathname}?${nextParams.toString()}`);
});

watch([playing, frames], ([isPlaying], _previous, onCleanup) => {
  if (!isPlaying || frames.value.length < 2) return;
  const timer = window.setInterval(() => {
    frameIndex.value = (frameIndex.value + 1) % frames.value.length;
  }, 1800);
  onCleanup(() => window.clearInterval(timer));
});

async function chooseObject(id) {
  playing.value = false;
  objectId.value = id;
  await loadFrames();
  await loadDetalle();
  frameIndex.value = 0;
}

function handleKeyDown(event) {
  if (event.target instanceof HTMLInputElement) return;
  if (!frames.value.length) return;
  if (event.key === 'ArrowRight') frameIndex.value = (frameIndex.value + 1) % frames.value.length;
  if (event.key === 'ArrowLeft') frameIndex.value = (frameIndex.value - 1 + frames.value.length) % frames.value.length;
}

async function shareView() {
  try {
    await navigator.clipboard.writeText(window.location.href);
    notice.value = t('toast.copied');
  } catch {
    notice.value = t('toast.copyManual');
  }
  window.setTimeout(() => { notice.value = ''; }, 2400);
}

onMounted(() => {
  loadCatalog();
  window.addEventListener('keydown', handleKeyDown);

  // El cover mide 100svh y el anclaje del catálogo deja justo la altura del nav:
  // la barra pasa a "fuera del cover" cuando el borde inferior de la foto cruza
  // el borde inferior de la barra. Así, al llegar al catálogo, lo que queda
  // detrás de la barra ya es página clara y la barra puede ser opaca.
  const cover = document.querySelector('.cover');
  if (cover && typeof IntersectionObserver === 'function') {
    const navH = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--hx-nav-h')) || 80;
    observadorCover = new IntersectionObserver(
      ([entrada]) => { sobreCover.value = entrada.isIntersecting; },
      { rootMargin: `-${navH}px 0px 0px 0px`, threshold: 0 },
    );
    observadorCover.observe(cover);
  } else {
    const medir = () => {
      sobreCover.value = window.scrollY < (cover?.offsetHeight ?? 0) - 80;
    };
    medir();
    window.addEventListener('scroll', medir, { passive: true });
    observadorCover = { disconnect: () => window.removeEventListener('scroll', medir) };
  }
});
onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown);
  observadorCover?.disconnect?.();
});
</script>

<template>
  <main class="app-shell">
    <CursorNawi />
    <header class="topbar" :class="{ 'is-sobre-cover': sobreCover }">
      <a class="brand" href="#inicio" :aria-label="t('a11y.brandHome')"><span class="brand-mark"><IconoNawi nombre="ojo" /></span><span>ñawi<span class="brand-dot">.</span></span></a>
      <div class="mission-label"><span class="live-dot" /> {{ t('brand.mission') }} <span class="label-divider">/</span> SPHEREx</div>
      <div class="topbar-actions">
        <LangSwitch />
        <button class="icon-button theme-button" :title="isLight ? t('a11y.themeToDark') : t('a11y.themeToLight')" :aria-label="isLight ? t('a11y.themeToDark') : t('a11y.themeToLight')" :aria-pressed="isLight" @click="toggleTheme"><IconoNawi :nombre="isLight ? 'luna' : 'sol'" /></button>
        <GlosarioNawi />
      </div>
    </header>

    <HeroNawi
      :textos="heroTextos"
      :cuadro="frame && !frame.illustrative ? frame.url : ''"
      :fecha="frame ? frame.date : ''"
      :banda="frame ? frame.band : ''"
      :objeto="nombreObjeto"
    />

    <div class="workspace" id="explorar">
      <aside class="sidebar-col">
          <div class="sidebar panel">
            <div class="panel-heading"><div><span class="eyebrow">{{ t('catalog.eyebrow') }}</span><h2>{{ t('catalog.title') }}</h2></div><span class="count-pill">{{ objects.length }}</span></div>
            <label class="search-box"><IconoNawi nombre="buscar" /><input v-model="query" :placeholder="t('catalog.searchPlaceholder')" :aria-label="t('a11y.search')" /><kbd>/</kbd></label>
            <div class="object-list" role="listbox" :aria-label="t('a11y.objectList')">
              <button v-for="(object, index) in filteredObjects" :key="object.id" class="object-option" :class="{ selected: object.id === objectId }" role="option" :aria-selected="object.id === objectId" @click="chooseObject(object.id)">
                <span class="object-index" :class="{ active: object.id === objectId }">{{ String(index + 1).padStart(2, '0') }}</span><span class="object-copy"><strong>{{ nombreDe(object) }}</strong><small>{{ tipoDe(object) }}</small></span><span class="object-chevron"><IconoNawi nombre="flecha-externa" /></span>
              </button>
              <div v-if="loading" class="empty-search">{{ t('catalog.loading') }}</div>
              <div v-else-if="loadError" class="empty-search">{{ loadError }}</div>
              <div v-else-if="!filteredObjects.length" class="empty-search">{{ t('catalog.empty') }}</div>
            </div>
            <div class="sidebar-bottom"><span class="status-check"><IconoNawi nombre="check" /></span><span>{{ sourceCopy.title }}<br /><small>{{ dataSourceNote }}</small></span></div>
          </div>
        </aside>

        <section class="viewer-column">
          <div v-if="ready" class="viewer panel">
            <div class="viewer-toolbar"><div><span class="eyebrow">{{ t('viewer.skyField') }} <span class="toolbar-slash">/</span> {{ tagDe(selectedObject) }}</span><h2>{{ nombreObjeto }}</h2></div><button class="share-button" @click="shareView"><IconoNawi nombre="compartir" /><span>{{ t('viewer.share') }}</span></button></div>
            <div v-if="fichaTecnica.length" class="viewer-meta" :aria-label="t('a11y.viewerMeta')">
              <span v-for="chip in fichaTecnica" :key="chip" class="meta-chip"><IconoNawi nombre="regla" /> {{ chip }}</span>
              <span v-if="marcadorReal" class="meta-chip"><IconoNawi nombre="mira" /> {{ t('viewer.chipCross') }}</span>
              <span v-if="trayectoria" class="meta-chip"><IconoNawi nombre="diagonal" /> {{ t('viewer.chipTrajectory') }}</span>
              <span class="meta-origen">{{ t('viewer.metaOrigin') }}</span>
            </div>
            <div v-if="motivoConCuadros" class="viewer-aviso" role="note">
              <IconoNawi nombre="alerta" aria-hidden="true" />
              <div class="viewer-aviso-copy">
                <span class="viewer-aviso-label">{{ t('viewer.warning') }}</span>
                <p class="viewer-aviso-texto">{{ motivoConCuadros }}</p>
              </div>
            </div>
            <div class="sky-stage" :class="{ comparison: compare, 'is-real': !frame.illustrative, 'is-suavizado': suavizado && !frame.illustrative }" :style="!frame.illustrative ? { '--zoom': zoomActivo } : null">
              <div v-if="!frame.illustrative" class="pixel-marco">
                <img class="pixel-frame" :src="frame.url" :alt="t('viewer.frameAlt', { nombre: nombreObjeto, fecha: frame.date, banda: frame.band })" />
                <svg v-if="trayectoria" class="trayectoria" :viewBox="`0 0 ${tamanoRecorte} ${tamanoRecorte}`" role="img" :aria-label="t('viewer.trajectoryAria', { desde: trayectoria.desde, hasta: trayectoria.hasta })">
                  <title>{{ t('viewer.trajectoryAria', { desde: trayectoria.desde, hasta: trayectoria.hasta }) }}</title>
                  <line class="trayectoria-linea" :x1="trayectoria.x1" :y1="trayectoria.y1" :x2="trayectoria.x2" :y2="trayectoria.y2" />
                  <circle class="trayectoria-extremo" :cx="trayectoria.x1" :cy="trayectoria.y1" r="1.1" />
                  <circle class="trayectoria-extremo" :cx="trayectoria.x2" :cy="trayectoria.y2" r="1.1" />
                </svg>
                <div v-if="marcadorReal" class="target-marker is-real" :style="marcadorReal"><span /><i /></div>
              </div>
              <div v-else class="image-layer" :style="{ backgroundImage: `url(${frame.url})` }" />
              <div class="sky-vignette" />
              <div class="sky-grid" />
              <div class="image-caption"><span class="caption-dot" /> {{ frame.illustrative ? t('viewer.captionIllustrative') : t('viewer.captionReal') }}</div>
              <div v-if="selectedObject.coordinates" class="coordinate-label" :title="notaCoordenadas(selectedObject.coordinates)"><IconoNawi nombre="alerta" /> {{ selectedObject.coordinates.ra }} <span>/</span> {{ selectedObject.coordinates.dec }} · {{ rotuloCoordenadas(selectedObject.coordinates) }}</div>
              <div v-else class="coordinate-label"><IconoNawi nombre="espera" /> {{ t('viewer.coordinatesPending') }} <span>/</span> {{ t('viewer.coordinatesUnvalidated') }}</div>
              <template v-if="frame.illustrative">
                <div class="target-marker"><span /><i /></div>
                <div class="target-label">{{ t('viewer.selectedObject') }}</div>
              </template>
              <div v-if="compare" class="compare-wipe" :class="{ 'is-real': !previousFrame.illustrative }" :style="previousFrame.illustrative ? { backgroundImage: `url(${previousFrame.url})` } : null"><img v-if="!previousFrame.illustrative" class="pixel-frame" :src="previousFrame.url" alt="" /><span class="wipe-label">{{ t('viewer.previous') }} · {{ previousFrame.date }}{{ previousFrame.illustrative ? t('viewer.illustrativeSuffix') : '' }}</span><span class="wipe-line" /></div>
              <div v-if="!frame.illustrative && suavizado" class="escala-aviso"><IconoNawi nombre="agua" /> {{ t('viewer.interpolated') }}</div>
              <div class="image-date"><span>{{ frame.date }}</span><small>{{ frame.band }}</small><small v-if="frame.calidadOk === false" class="frame-calidad">{{ t('viewer.dubiousQuality') }}</small></div>
            </div>
            <div class="timeline">
              <div class="timeline-top"><span class="timeline-title"><IconoNawi nombre="historial" /> {{ hayCuadrosReales ? t('timeline.title') : t('timeline.titleIllustrative') }}</span><span class="frame-counter">{{ t('timeline.frame') }} <b>{{ String(frameIndex + 1).padStart(2, '0') }}</b> <span>/ {{ String(frames.length).padStart(2, '0') }}</span></span></div>
              <input v-model.number="frameIndex" class="time-range" :style="{ '--progress': `${progressPercent}%` }" type="range" min="0" :max="frames.length - 1" step="1" :aria-label="t('timeline.rangeAria')" />
              <div class="timeline-dates"><button v-for="(item, index) in frames" :key="item.date" class="date-tick" :class="{ current: index === frameIndex }" @click="frameIndex = index">{{ item.date.slice(5) }}</button></div>
            </div>
            <div class="player-controls"><div class="transport"><button class="control-button" :aria-label="t('controls.prev')" @click="frameIndex = (frameIndex - 1 + frames.length) % frames.length"><IconoNawi nombre="anterior" /></button><button class="play-button" :aria-label="playing ? t('controls.pause') : t('controls.play')" @click="playing = !playing"><IconoNawi :nombre="playing ? 'pausa' : 'reproducir'" /></button><button class="control-button" :aria-label="t('controls.next')" @click="frameIndex = (frameIndex + 1) % frames.length"><IconoNawi nombre="siguiente" /></button><span class="play-caption">{{ playing ? t('controls.playing') : t('controls.idle') }}</span></div><div v-if="!frame.illustrative" class="zoom-controls" role="group" :aria-label="t('controls.zoomGroup')"><span class="zoom-title" aria-hidden="true"><IconoNawi nombre="zoom" /> {{ t('controls.zoomTitle') }}</span><button v-for="escala in ZOOMS" :key="escala" type="button" class="zoom-button" :class="{ 'is-active': zoomActivo === escala }" :aria-pressed="zoomActivo === escala" :aria-label="t('controls.zoomScale', { escala, pixeles: TAMANO_RECORTE_PX * escala })" :title="`${escala}x · ${TAMANO_RECORTE_PX * escala} px`" @click="zoom = escala">{{ escala }}x</button><button type="button" class="zoom-mode" :class="{ 'is-suave': suavizado }" :aria-pressed="suavizado" :aria-label="suavizado ? t('controls.smoothAria') : t('controls.pixelAria')" :title="suavizado ? t('controls.smoothTitle') : t('controls.pixelTitle')" @click="suavizado = !suavizado"><IconoNawi :nombre="suavizado ? 'agua' : 'pixel'" /><span>{{ suavizado ? t('controls.smooth') : t('controls.pixel') }}</span></button></div><button class="compare-button" :class="{ 'is-on': compare }" @click="compare = !compare"><IconoNawi nombre="comparar" /> <span>{{ compare ? t('controls.closeCompare') : t('controls.compare') }}</span></button></div>
          </div>
          <div v-else-if="sinCuadros" class="viewer panel">
            <div class="viewer-toolbar"><div><span class="eyebrow">{{ t('viewer.skyField') }} <span class="toolbar-slash">/</span> {{ tagDe(selectedObject) }}</span><h2>{{ nombreObjeto }}</h2></div><button class="share-button" @click="shareView"><IconoNawi nombre="compartir" /><span>{{ t('viewer.share') }}</span></button></div>
            <div class="viewer-empty">
              <span class="viewer-empty-icon"><IconoNawi nombre="sin-camara" /></span>
              <div>
                <h3>{{ tituloSinCuadros }}</h3>
                <p v-if="motivoSinCuadros" class="viewer-empty-motivo">{{ t('viewer.empty.motivo', { motivo: motivoSinCuadros }) }}</p>
                <p v-else class="viewer-empty-motivo">{{ t('viewer.empty.sinMotivo') }}</p>
                <p class="viewer-empty-meta"><span class="viewer-empty-chip">{{ tipoDe(selectedObject) }}</span><span v-if="estadoSinCuadros" class="viewer-empty-chip">{{ t('viewer.empty.estado', { estado: estadoSinCuadros }) }}</span><span v-if="selectedObject.coordinates" class="viewer-empty-chip">{{ rotuloCoordenadas(selectedObject.coordinates) }}</span></p>
              </div>
            </div>
          </div>
          <div v-else class="viewer panel">
            <div class="viewer-toolbar"><div><span class="eyebrow">{{ t('viewer.skyField') }}</span><h2>{{ loading ? t('catalog.loading') : t('viewer.errorPanel.title') }}</h2></div></div>
            <div class="sky-stage" style="display: flex; align-items: center; justify-content: center; padding: 24px; text-align: center"><p style="max-width: 46ch; margin: 0; color: var(--nawi-sky-ink-mute); font-size: 13px">{{ loadError || t('viewer.errorPanel.preparing') }}</p></div>
          </div>
          <RastroPanel v-if="selectedObject" :rastro="rastro" :nombre="nombreObjeto" :pixel-arcsec="metadatos?.pixelArcsec ?? 6.15" />
          <section v-if="mostrarLatido && !loading && !loadError" class="latido-panel panel" aria-labelledby="latido-titulo">
            <div class="latido-head"><div><span class="eyebrow">{{ t('latido.eyebrow') }}</span><h2 id="latido-titulo">{{ t('latido.title') }}</h2></div><span class="latido-chip">{{ tagDe(selectedObject) }}</span></div>
            <p class="latido-intro">{{ t('latido.intro', { n: latido.puntos.length }) }}</p>
            <LatidoChart :puntos="latido.puntos" :nombre="nombreObjeto" :motivo="latido.motivo" :cargando="latido.estado === 'loading'" />
          </section>
          <div class="below-viewer"><span><IconoNawi nombre="info" /> {{ ready ? usoObjeto : t('below.dev') }} <span class="caption-divider">·</span> {{ dataSourceNote }}</span><span class="keyboard-hint">{{ t('below.keyboard') }} <kbd>←</kbd> <kbd>→</kbd></span></div>
      </section>
    </div>

    <footer class="footer"><span>ÑAWI <span class="footer-dot">·</span> {{ t('footer.motto') }}</span><span>{{ t('footer.mission') }} <IconoNawi nombre="flecha-externa" /></span></footer>
    <div v-if="notice" class="toast-note" role="status"><IconoNawi nombre="check-circulo" /> {{ notice }}</div>
  </main>
</template>
