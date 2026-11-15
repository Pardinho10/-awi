<script setup>
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import { DATA_SOURCE_INFO, catalog } from './data/catalog/index.js';
import LatidoChart from './components/LatidoChart.vue';
import RastroPanel from './components/RastroPanel.vue';

// Tema claro/oscuro: arranca según la preferencia del sistema y se recuerda en localStorage.
const THEME_KEY = 'nawi-theme';
const THEME_COLORS = { dark: '#1d2021', light: '#ebdbb2' };

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
// Hoy la respalda el mock; cuando existan los endpoints pasa a la API sin tocar la vista.
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

const selectedObject = computed(() => objects.value.find((item) => item.id === objectId.value) ?? objects.value[0] ?? null);
const frame = computed(() => frames.value[frameIndex.value] ?? null);
const previousFrame = computed(() => frames.value[Math.max(0, frameIndex.value - 1)] ?? null);
const filteredObjects = computed(() => objects.value.filter((item) => `${item.name} ${item.kind}`.toLowerCase().includes(query.value.toLowerCase())));
const ready = computed(() => !loading.value && !loadError.value && Boolean(selectedObject.value) && Boolean(frame.value));
const progressPercent = computed(() => (frames.value.length > 1 ? (frameIndex.value / (frames.value.length - 1)) * 100 : 0));

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
  const numero = (valor, decimales = 2) => valor.toLocaleString('es-AR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimales,
  });
  const chips = [];
  if (Number.isFinite(m.fovArcmin)) chips.push(`campo ${numero(m.fovArcmin)}′`);
  if (Number.isFinite(m.pixelArcsec)) chips.push(`${numero(m.pixelArcsec)}″/px`);
  if (Number.isFinite(m.tamanoPx)) chips.push(`${m.tamanoPx}×${m.tamanoPx} px`);
  return chips;
});

// Latido: solo para objetos de variabilidad (RW Aurigae, R Draconis).
const esVariable = computed(() => selectedObject.value?.tag === 'VARIABLE' || selectedObject.value?.tipo === 'estrella_variable');
// Objeto elegible pero sin cuadros: el visor debe decirlo, no quedar vacío.
const sinCuadros = computed(() => !loading.value && !loadError.value && Boolean(selectedObject.value) && frames.value.length === 0);
/**
 * Motivo que publica el backend sobre el objeto: no es un error de la app, es
 * una limitación científica informada (núcleo saturado, señal muy débil…).
 * El adaptador lo deja tal cual en `detalle.motivo`.
 */
const motivoBackend = computed(() => {
  const motivo = detalle.value?.motivo;
  return typeof motivo === 'string' ? motivo.trim() : '';
});

/** Con cuadros, la advertencia va en el visor. Sin cuadros, ya lo dice el panel vacío. */
const motivoConCuadros = computed(() => (frames.value.length > 0 ? motivoBackend.value : ''));

// Panel vacío: el motivo del backend (si existe) o el de la respuesta de cuadros.
const motivoSinCuadros = computed(() => selectedObject.value?.motivo || motivoBackend.value || framesInfo.value.motivo || '');
const estadoSinCuadros = computed(() => selectedObject.value?.estado || framesInfo.value.estado || '');
const tituloSinCuadros = computed(() => (
  estadoSinCuadros.value === 'sin_datos'
    ? 'Este objeto todavía no tiene cuadros precalculados'
    : 'No hay cuadros para mostrar de este objeto'
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

// Lo que se puede afirmar según el estado de la fuente. 'pending' no se disfraza
// de datos del backend: se avisa que no hay nada conectado.
// DATA_SOURCE_INFO es un store reactivo: el estado cambia con cada consulta al
// backend ('pending' al arrancar, 'live' si respondió, 'error' si falló). Por eso
// los textos se calculan en un computed y no una sola vez al montar.
const SOURCE_COPY = {
  demo: () => ({
    title: 'Catálogo de demostración',
    note: `${DATA_SOURCE_INFO.label} · cifras ilustrativas, no validadas.`,
  }),
  live: () => ({
    title: 'Catálogo de observaciones',
    note: `${DATA_SOURCE_INFO.label} · observaciones de la misión.`,
  }),
  pending: () => ({
    title: 'Catálogo sin conectar',
    note: `${DATA_SOURCE_INFO.label} · todavía no se consultaron los datos.`,
  }),
  error: () => ({
    title: 'Catálogo no disponible',
    note: DATA_SOURCE_INFO.error || 'No pudimos actualizar los datos en la última consulta.',
  }),
};

const sourceCopy = computed(() => (SOURCE_COPY[DATA_SOURCE_INFO.status] ?? SOURCE_COPY.pending)());
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
    framesInfo.value = { estado: 'sin_datos', motivo: error?.message || '' };
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
    if (buscaLatido) latido.value = { estado: 'empty', motivo: error?.message || '', puntos: [] };
  }
}

// Único punto de carga: si mañana la fuente es la API, el resto de la vista no cambia.
async function loadCatalog() {
  loading.value = true;
  loadError.value = '';
  try {
    // Se leen los parámetros acá para respetar un enlace compartido (?obj=&frame=).
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
    loadError.value = error?.message || 'No se pudo cargar el catálogo.';
  } finally {
    loading.value = false;
  }
}

watch([objectId, frameIndex], () => {
  if (loading.value || loadError.value) return;
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
    notice.value = 'Enlace copiado';
  } catch {
    notice.value = 'Copiá el enlace desde la barra del navegador';
  }
  window.setTimeout(() => { notice.value = ''; }, 2400);
}

onMounted(() => {
  loadCatalog();
  window.addEventListener('keydown', handleKeyDown);
});
onUnmounted(() => window.removeEventListener('keydown', handleKeyDown));
</script>

<template>
  <main class="app-shell">
    <header class="topbar">
      <a class="brand" href="#inicio" aria-label="Ñawi, inicio"><span class="brand-mark"><i class="bi bi-eye-fill" /></span><span>ñawi<span class="brand-dot">.</span></span></a>
      <div class="mission-label"><span class="live-dot" /> EXPLORADOR INFRARROJO <span class="label-divider">/</span> SPHEREx</div>
      <div class="topbar-actions">
        <button class="icon-button theme-button" :title="isLight ? 'Cambiar a modo oscuro' : 'Cambiar a modo claro'" :aria-label="isLight ? 'Cambiar a modo oscuro' : 'Cambiar a modo claro'" :aria-pressed="isLight" @click="toggleTheme"><i class="bi" :class="isLight ? 'bi-moon-stars' : 'bi-brightness-high'" /></button>
        <button class="icon-button help-button" title="Acerca de Nawi" aria-label="Acerca de Nawi"><i class="bi bi-question-lg" /></button>
      </div>
    </header>

    <section id="inicio" class="intro-row">
      <div><div class="eyebrow"><span>01</span> OBSERVATORIO DIGITAL</div><h1><span class="hero-line">El cielo cambia.</span><span class="hero-line">Ahora podés <span class="hero-gild">verlo.</span></span></h1><p class="intro-copy">Viajá a través de observaciones infrarrojas reales y seguí las huellas que dejan los objetos celestes.</p></div>
      <div class="mission-stat"><span class="stat-icon"><i class="bi bi-stars" /></span><div><strong>102</strong><span>bandas infrarrojas</span></div><div class="stat-rule" /><div><strong>6 <small>meses</small></strong><span>entre mapeos del cielo</span></div></div>
    </section>

    <div class="workspace">
      <aside class="sidebar-col">
          <div class="sidebar panel">
            <div class="panel-heading"><div><span class="eyebrow">EXPLORAR</span><h2>Elegí un objeto</h2></div><span class="count-pill">{{ objects.length }}</span></div>
            <label class="search-box"><i class="bi bi-search" /><input v-model="query" placeholder="Buscar objeto..." aria-label="Buscar objeto" /><kbd>/</kbd></label>
            <div class="object-list" role="listbox" aria-label="Objetos astronómicos">
              <button v-for="(object, index) in filteredObjects" :key="object.id" class="object-option" :class="{ selected: object.id === objectId }" role="option" :aria-selected="object.id === objectId" @click="chooseObject(object.id)">
                <span class="object-index" :class="{ active: object.id === objectId }">{{ String(index + 1).padStart(2, '0') }}</span><span class="object-copy"><strong>{{ object.name }}</strong><small>{{ object.kind }}</small></span><span class="object-chevron"><i class="bi bi-arrow-up-right" /></span>
              </button>
              <div v-if="loading" class="empty-search">Cargando catálogo…</div>
              <div v-else-if="loadError" class="empty-search">{{ loadError }}</div>
              <div v-else-if="!filteredObjects.length" class="empty-search">No hay objetos con ese nombre.</div>
            </div>
            <div class="sidebar-bottom"><span class="status-check"><i class="bi bi-check2" /></span><span>{{ sourceCopy.title }}<br /><small>{{ dataSourceNote }}</small></span></div>
          </div>
        </aside>

        <section class="viewer-column">
          <div v-if="ready" class="viewer panel">
            <div class="viewer-toolbar"><div><span class="eyebrow">CAMPO CELESTE <span class="toolbar-slash">/</span> {{ selectedObject.tag }}</span><h2>{{ selectedObject.name }}</h2></div><button class="share-button" @click="shareView"><i class="bi bi-share" /><span>Compartir vista</span></button></div>
            <div v-if="fichaTecnica.length" class="viewer-meta" aria-label="Metadatos del recorte">
              <span v-for="chip in fichaTecnica" :key="chip" class="meta-chip"><i class="bi bi-rulers" /> {{ chip }}</span>
              <span v-if="marcadorReal" class="meta-chip"><i class="bi bi-crosshair2" /> cruz: posición esperada</span>
              <span v-if="trayectoria" class="meta-chip"><i class="bi bi-slash-lg" /> trayectoria: primer → último cuadro</span>
              <span class="meta-origen">según los datos de la misión</span>
            </div>
            <div v-if="motivoConCuadros" class="viewer-aviso" role="note">
              <i class="bi bi-exclamation-triangle" aria-hidden="true" />
              <div class="viewer-aviso-copy">
                <span class="viewer-aviso-label">Advertencia</span>
                <p class="viewer-aviso-texto">{{ motivoConCuadros }}</p>
              </div>
            </div>
            <div class="sky-stage" :class="{ comparison: compare, 'is-real': !frame.illustrative, 'is-suavizado': suavizado && !frame.illustrative }" :style="!frame.illustrative ? { '--zoom': zoomActivo } : null">
              <div v-if="!frame.illustrative" class="pixel-marco">
                <img class="pixel-frame" :src="frame.url" :alt="`Recorte de ${selectedObject.name} del ${frame.date} en ${frame.band}`" />
                <svg v-if="trayectoria" class="trayectoria" :viewBox="`0 0 ${tamanoRecorte} ${tamanoRecorte}`" role="img" :aria-label="`Trayectoria esperada entre el primer y el último cuadro (${trayectoria.desde} a ${trayectoria.hasta})`">
                  <title>Trayectoria esperada entre el primer y el último cuadro ({{ trayectoria.desde }} a {{ trayectoria.hasta }})</title>
                  <line class="trayectoria-linea" :x1="trayectoria.x1" :y1="trayectoria.y1" :x2="trayectoria.x2" :y2="trayectoria.y2" />
                  <circle class="trayectoria-extremo" :cx="trayectoria.x1" :cy="trayectoria.y1" r="1.1" />
                  <circle class="trayectoria-extremo" :cx="trayectoria.x2" :cy="trayectoria.y2" r="1.1" />
                </svg>
                <div v-if="marcadorReal" class="target-marker is-real" :style="marcadorReal"><span /><i /></div>
              </div>
              <div v-else class="image-layer" :style="{ backgroundImage: `url(${frame.url})` }" />
              <div class="sky-vignette" />
              <div class="sky-grid" />
              <div class="image-caption"><span class="caption-dot" /> {{ frame.illustrative ? 'IMAGEN ILUSTRATIVA · DATOS REALES PENDIENTES' : 'DATOS REALES' }}</div>
              <div v-if="selectedObject.coordinates" class="coordinate-label" :title="selectedObject.coordinates.note"><i class="bi bi-exclamation-triangle" /> {{ selectedObject.coordinates.ra }} <span>/</span> {{ selectedObject.coordinates.dec }} · {{ selectedObject.coordinates.statusLabel }}</div>
              <div v-else class="coordinate-label"><i class="bi bi-hourglass-split" /> COORDENADAS PENDIENTES <span>/</span> NO VALIDADAS</div>
              <template v-if="frame.illustrative">
                <div class="target-marker"><span /><i /></div>
                <div class="target-label">OBJETO SELECCIONADO</div>
              </template>
              <div v-if="compare" class="compare-wipe" :class="{ 'is-real': !previousFrame.illustrative }" :style="previousFrame.illustrative ? { backgroundImage: `url(${previousFrame.url})` } : null"><img v-if="!previousFrame.illustrative" class="pixel-frame" :src="previousFrame.url" alt="" /><span class="wipe-label">ANTERIOR · {{ previousFrame.date }}{{ previousFrame.illustrative ? ' · ILUSTRATIVO' : '' }}</span><span class="wipe-line" /></div>
              <div v-if="!frame.illustrative && suavizado" class="escala-aviso"><i class="bi bi-water" /> interpolado · no son píxeles originales</div>
              <div class="image-date"><span>{{ frame.date }}</span><small>{{ frame.band }}</small><small v-if="frame.calidadOk === false" class="frame-calidad">calidad marcada como dudosa</small></div>
            </div>
            <div class="timeline">
              <div class="timeline-top"><span class="timeline-title"><i class="bi bi-clock-history" /> {{ hayCuadrosReales ? 'LÍNEA DE TIEMPO' : 'LÍNEA DE TIEMPO ILUSTRATIVA' }}</span><span class="frame-counter">CUADRO <b>{{ String(frameIndex + 1).padStart(2, '0') }}</b> <span>/ {{ String(frames.length).padStart(2, '0') }}</span></span></div>
              <input v-model.number="frameIndex" class="time-range" :style="{ '--progress': `${progressPercent}%` }" type="range" min="0" :max="frames.length - 1" step="1" aria-label="Elegir cuadro" />
              <div class="timeline-dates"><button v-for="(item, index) in frames" :key="item.date" class="date-tick" :class="{ current: index === frameIndex }" @click="frameIndex = index">{{ item.date.slice(5) }}</button></div>
            </div>
            <div class="player-controls"><div class="transport"><button class="control-button" aria-label="Cuadro anterior" @click="frameIndex = (frameIndex - 1 + frames.length) % frames.length"><i class="bi bi-skip-backward-fill" /></button><button class="play-button" :aria-label="playing ? 'Pausar' : 'Reproducir'" @click="playing = !playing"><i class="bi" :class="playing ? 'bi-pause-fill' : 'bi-play-fill'" /></button><button class="control-button" aria-label="Cuadro siguiente" @click="frameIndex = (frameIndex + 1) % frames.length"><i class="bi bi-skip-forward-fill" /></button><span class="play-caption">{{ playing ? 'REPRODUCIENDO' : 'RECORRER CUADROS' }}</span></div><div v-if="!frame.illustrative" class="zoom-controls" role="group" aria-label="Zoom del recorte y método de escalado"><span class="zoom-title" aria-hidden="true"><i class="bi bi-arrows-angle-expand" /> zoom</span><button v-for="escala in ZOOMS" :key="escala" type="button" class="zoom-button" :class="{ 'is-active': zoomActivo === escala }" :aria-pressed="zoomActivo === escala" :aria-label="`Escala ${escala}x: recorte a ${TAMANO_RECORTE_PX * escala} píxeles`" :title="`${escala}x · ${TAMANO_RECORTE_PX * escala} px`" @click="zoom = escala">{{ escala }}x</button><button type="button" class="zoom-mode" :class="{ 'is-suave': suavizado }" :aria-pressed="suavizado" :aria-label="suavizado ? 'Modo suavizado activo: la imagen está interpolada y no muestra los píxeles originales. Cambiar a píxel real.' : 'Modo píxel real activo. Cambiar a suavizado, que interpola la imagen.'" :title="suavizado ? 'Interpolado: no son los píxeles originales' : 'Píxeles originales del recorte, sin interpolar'" @click="suavizado = !suavizado"><i class="bi" :class="suavizado ? 'bi-water' : 'bi-grid-3x3-gap-fill'" /><span>{{ suavizado ? 'suavizado' : 'píxel real' }}</span></button></div><button class="compare-button" :class="{ 'is-on': compare }" @click="compare = !compare"><i class="bi bi-layout-split" /> <span>{{ compare ? 'Cerrar comparación' : 'Antes y después' }}</span></button></div>
          </div>
          <div v-else-if="sinCuadros" class="viewer panel">
            <div class="viewer-toolbar"><div><span class="eyebrow">CAMPO CELESTE <span class="toolbar-slash">/</span> {{ selectedObject.tag }}</span><h2>{{ selectedObject.name }}</h2></div><button class="share-button" @click="shareView"><i class="bi bi-share" /><span>Compartir vista</span></button></div>
            <div class="viewer-empty">
              <span class="viewer-empty-icon"><i class="bi bi-camera-video-off" /></span>
              <div>
                <h3>{{ tituloSinCuadros }}</h3>
                <p v-if="motivoSinCuadros" class="viewer-empty-motivo">Motivo informado: {{ motivoSinCuadros }}</p>
                <p v-else class="viewer-empty-motivo">No hay un motivo informado. Preferimos no mostrar imágenes de relleno para que no se confundan con datos.</p>
                <p class="viewer-empty-meta"><span class="viewer-empty-chip">{{ selectedObject.kind }}</span><span v-if="estadoSinCuadros" class="viewer-empty-chip">estado: {{ estadoSinCuadros }}</span><span v-if="selectedObject.coordinates" class="viewer-empty-chip">{{ selectedObject.coordinates.statusLabel }}</span></p>
              </div>
            </div>
          </div>
          <div v-else class="viewer panel">
            <div class="viewer-toolbar"><div><span class="eyebrow">CAMPO CELESTE</span><h2>{{ loading ? 'Cargando catálogo…' : 'Catálogo no disponible' }}</h2></div></div>
            <div class="sky-stage" style="display: flex; align-items: center; justify-content: center; padding: 24px; text-align: center"><p style="max-width: 46ch; margin: 0; color: var(--text-secondary); font-size: 13px">{{ loadError || 'Preparando los objetos de demostración.' }}</p></div>
          </div>
          <RastroPanel v-if="selectedObject" :rastro="rastro" :nombre="selectedObject.name" />
          <section v-if="mostrarLatido && !loading && !loadError" class="latido-panel panel" aria-labelledby="latido-titulo">
            <div class="latido-head"><div><span class="eyebrow">LATIDO</span><h2 id="latido-titulo">Curva de brillo</h2></div><span class="latido-chip">{{ selectedObject.tag }}</span></div>
            <p class="latido-intro">{{ latido.puntos.length }} mediciones de brillo por fecha, tal como las entrega la misión. Nawi no recalcula ni corrige estos valores.</p>
            <LatidoChart :puntos="latido.puntos" :nombre="selectedObject.name" :motivo="latido.motivo" :cargando="latido.estado === 'loading'" />
          </section>
          <div class="below-viewer"><span><i class="bi bi-info-circle" /> {{ ready ? selectedObject.demoUse : 'Esta experiencia está en desarrollo.' }} <span class="caption-divider">·</span> {{ dataSourceNote }}</span><span class="keyboard-hint">NAVEGÁ CON <kbd>←</kbd> <kbd>→</kbd></span></div>
      </section>
    </div>

    <footer class="footer"><span>ÑAWI <span class="footer-dot">·</span> UN OJO INFRARROJO PARA TODOS</span><span>DATOS DE MISIÓN SPHEREx <i class="bi bi-arrow-up-right" /></span></footer>
    <div v-if="notice" class="toast-note" role="status"><i class="bi bi-check-circle-fill" /> {{ notice }}</div>
  </main>
</template>
