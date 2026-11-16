<script setup>
/**
 * Latido: curva de brillo en SVG puro, sin librerías.
 *
 * Recibe las mediciones ya normalizadas por el adaptador
 * ({ fecha, brillo, flujo, error, unidad, longitudOndaUm }) y no recalcula ni
 * corrige nada: solo dibuja. Si no hay mediciones válidas muestra un estado
 * vacío, sin ejes inventados.
 */
import { computed } from 'vue';

const props = defineProps({
  puntos: { type: Array, default: () => [] },
  nombre: { type: String, default: '' },
  motivo: { type: String, default: '' },
  cargando: { type: Boolean, default: false },
});

const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

// Geometría del lienzo (viewBox): el SVG escala solo, sin deformarse.
const ANCHO = 660;
const ALTO = 300;
const M = { top: 24, right: 20, bottom: 52, left: 68 };
const anchoUtil = ANCHO - M.left - M.right;
const altoUtil = ALTO - M.top - M.bottom;

/**
 * 'YYYY-MM-DD' o ISO8601 completo ('2025-09-11T16:16:31Z') -> ms UTC.
 *
 * Se usan los tres primeros componentes tal cual: el backend publica en UTC y
 * convertir a hora local podría mover la fecha de día.
 */
function aFecha(texto) {
  const partes = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(texto ?? '').trim());
  if (!partes) return null;
  const t = Date.UTC(Number(partes[1]), Number(partes[2]) - 1, Number(partes[3]));
  return Number.isFinite(t) ? t : null;
}

/**
 * Etiqueta corta de fecha. Si la serie cruza más de un año se agrega el año:
 * "11 sep" y "14 sep" de años distintos no dicen nada por sí solos.
 */
function fechaCorta(t, conAnio = false) {
  const d = new Date(t);
  const base = `${String(d.getUTCDate()).padStart(2, '0')} ${MESES[d.getUTCMonth()]}`;
  return conAnio ? `${base} ${d.getUTCFullYear()}` : base;
}

function numero(valor) {
  const n = Number(valor);
  return Number.isFinite(n) ? n : null;
}

/**
 * Formato de números del eje y del tooltip. Los valores chicos (los errores,
 * ~0.006 Jy) usan cifras significativas para no perder información: 0.003608
 * se muestra 0.00361 y no 0.0036.
 */
function formatear(valor) {
  const abs = Math.abs(valor);
  if (abs >= 100) return valor.toFixed(1);
  if (abs >= 1) return valor.toFixed(2);
  if (abs >= 0.01) return valor.toFixed(3);
  return valor.toPrecision(3);
}

/**
 * Paso "lindo" del eje (1, 2, 2.5, 5 por potencia de diez) eligiendo el que
 * deje entre 3 y 6 marcas. Con el algoritmo de un solo candidato quedaban ejes
 * de dos marcas (2.00 y 3.00) que no dejaban leer la escala.
 */
function ticksLindos(min, max, objetivo = 4) {
  const rango = max - min;
  if (!(rango > 0)) return { paso: 1, primero: min };
  const magnitud = 10 ** Math.floor(Math.log10(rango / objetivo));
  const candidatos = [1, 2, 2.5, 5, 10].map((multiplo) => multiplo * magnitud);

  for (const paso of candidatos) {
    const primero = Math.ceil(min / paso) * paso;
    const cantidad = Math.floor((max - primero) / paso) + 1;
    if (cantidad >= 3 && cantidad <= 6) return { paso, primero };
  }
  const paso = candidatos[candidatos.length - 1];
  return { paso, primero: Math.ceil(min / paso) * paso };
}

/** Unidad real del brillo publicada por el backend ('Jy' si no la informa). */
const unidadBrillo = computed(() => {
  const conUnidad = (props.puntos ?? []).find((punto) => typeof punto?.unidad === 'string' && punto.unidad.trim());
  return conUnidad ? conUnidad.unidad.trim() : 'Jy';
});

const puntosValidos = computed(() => {
  const limpios = (props.puntos ?? [])
    .map((punto, orden) => {
      const t = aFecha(punto?.fecha ?? punto?.date);
      const flujo = numero(punto?.flujo ?? punto?.brillo);
      if (t === null || flujo === null) return null;
      const error = numero(punto?.brillo_error ?? punto?.error);
      const lambda = numero(punto?.longitud_onda_um ?? punto?.longitudOndaUm);
      const unidad = typeof punto?.unidad === 'string' ? punto.unidad.trim() : '';
      return { orden, t, flujo, error, lambda, unidad, fechaTexto: String(punto?.fecha ?? punto?.date).slice(0, 10) };
    })
    .filter(Boolean)
    .sort((a, b) => a.t - b.t);

  if (!limpios.length) return [];

  const flujos = limpios.map((p) => p.flujo);
  const min = Math.min(...flujos);
  const max = Math.max(...flujos);
  // Serie plana: se abre un margen para que la línea no quede pegada al borde.
  const margen = min === max ? Math.max(Math.abs(min) * 0.05, 0.5) : (max - min) * 0.12;
  const yMin = min - margen;
  const yMax = max + margen;

  const tMin = limpios[0].t;
  const tMax = limpios[limpios.length - 1].t;
  const rangoT = tMax - tMin || 1;

  const x = (t) => (limpios.length === 1 ? M.left + anchoUtil / 2 : M.left + ((t - tMin) / rangoT) * anchoUtil);
  const y = (v) => M.top + altoUtil - ((v - yMin) / (yMax - yMin)) * altoUtil;
  // Las barras de error se recortan al área del gráfico: nunca dibujan fuera del eje.
  const limitarY = (v) => Math.min(M.top + altoUtil, Math.max(M.top, v));

  // La etiqueta de longitud de onda se anota solo si hay pocas mediciones:
  // con muchas, el gráfico se vuelve ilegible y el dato queda en el tooltip.
  const anotarLambda = limpios.length <= 10;

  const conPosiciones = limpios.map((p) => {
    const unidad = p.unidad || unidadBrillo.value;
    const detalle = [t('latido.tooltipPoint', { fecha: p.fechaTexto, brillo: formatear(p.flujo), unidad })];
    if (p.error !== null) detalle.push(t('latido.tooltipError', { error: formatear(p.error) }));
    if (p.lambda !== null) detalle.push(t('latido.tooltipLambda', { lambda: p.lambda }));

    // Barra de error vertical (brillo ± brillo_error), recortada al eje.
    const barra = p.error !== null && p.error > 0
      ? {
        y1: limitarY(y(p.flujo - p.error)),
        y2: limitarY(y(p.flujo + p.error)),
      }
      : null;

    return {
      ...p,
      x: x(p.t),
      y: y(p.flujo),
      unidad,
      barra,
      barraVisible: Boolean(barra) && Math.abs(barra.y2 - barra.y1) >= 0.75,
      tooltip: detalle.join(' · '),
    };
  });

  // Segunda pasada: ubicar las etiquetas de longitud de onda sin que se pisen
  // entre sí ni con los bordes. Si ninguna posición entra, la etiqueta se omite
  // (el dato sigue en el tooltip); nunca se dibuja texto encimado.
  const ocupados = [];
  const seSolapan = (caja) => ocupados.some((otra) => (
    caja.x1 < otra.x2 && caja.x2 > otra.x1 && caja.y1 < otra.y2 && caja.y2 > otra.y1
  ));

  return conPosiciones.map((p) => {
    if (!anotarLambda || p.lambda === null) return { ...p, etiqueta: '' };

    const texto = `${p.lambda.toFixed(2)} μm`;
    const ancho = texto.length * 5.4;
    const base = p.x < M.left + 34
      ? { anclaje: 'start', x: p.x + 7 }
      : p.x > ANCHO - M.right - 34
        ? { anclaje: 'end', x: p.x - 7 }
        : { anclaje: 'middle', x: p.x };

    for (const dy of [-12, 18, -26, 30]) {
      const yEtiqueta = p.y + dy;
      if (yEtiqueta < M.top + 6 || yEtiqueta > M.top + altoUtil - 2) continue;
      const x1 = base.anclaje === 'start'
        ? base.x
        : base.anclaje === 'end' ? base.x - ancho : base.x - ancho / 2;
      const caja = { x1, x2: x1 + ancho, y1: yEtiqueta - 8, y2: yEtiqueta + 2 };
      if (caja.x1 < M.left - 2 || caja.x2 > ANCHO - M.right + 2) continue;
      if (seSolapan(caja)) continue;
      ocupados.push(caja);
      return { ...p, etiqueta: texto, etiquetaX: base.x, etiquetaY: yEtiqueta, etiquetaAnclaje: base.anclaje };
    }

    return { ...p, etiqueta: '' };
  });
});

const dominio = computed(() => {
  if (!puntosValidos.value.length) return null;
  const flujos = puntosValidos.value.map((p) => p.flujo);
  const min = Math.min(...flujos);
  const max = Math.max(...flujos);
  const margen = min === max ? Math.max(Math.abs(min) * 0.05, 0.5) : (max - min) * 0.12;
  return { yMin: min - margen, yMax: max + margen, tMin: puntosValidos.value[0].t, tMax: puntosValidos.value[puntosValidos.value.length - 1].t };
});

const escalaY = computed(() => {
  if (!dominio.value) return { min: 0, max: 1 };
  return { min: dominio.value.yMin, max: dominio.value.yMax };
});

const y = (valor) => {
  const { min, max } = escalaY.value;
  const rango = max - min || 1;
  return M.top + altoUtil - ((valor - min) / rango) * altoUtil;
};

const ticksY = computed(() => {
  const { min, max } = escalaY.value;
  const { paso, primero } = ticksLindos(min, max);
  const ticks = [];
  for (let v = primero; v <= max + paso * 0.001 && ticks.length < 7; v += paso) {
    // Se redondea para que 0.30000000000000004 no se muestre con basura binaria.
    const valor = Number(v.toFixed(10));
    ticks.push({ valor, y: y(valor), label: formatear(valor) });
  }
  return ticks;
});

const ticksX = computed(() => {
  const puntos = puntosValidos.value;
  if (!puntos.length) return [];
  if (puntos.length === 1) return [{ x: puntos[0].x, label: fechaCorta(puntos[0].t, cruzaAnios.value) }];
  const candidatos = [puntos[0], puntos[Math.floor((puntos.length - 1) / 2)], puntos[puntos.length - 1]];
  // Evita repetir la misma fecha si hay dos mediciones el mismo día.
  const vistos = new Set();
  return candidatos
    .filter((p) => {
      const clave = p.t;
      if (vistos.has(clave)) return false;
      vistos.add(clave);
      return true;
    })
    .map((p) => ({ x: p.x, label: fechaCorta(p.t, cruzaAnios.value) }));
});

const cruzaAnios = computed(() => {
  const anios = new Set(puntosValidos.value.map((p) => new Date(p.t).getUTCFullYear()));
  return anios.size > 1;
});

const linea = computed(() => puntosValidos.value.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' '));

const descripcion = computed(() => {
  const puntos = puntosValidos.value;
  const quien = props.nombre ? ` · ${props.nombre}` : '';
  if (!puntos.length) return t('latido.descriptionEmpty', { quien });
  const desde = fechaCorta(puntos[0].t, cruzaAnios.value);
  const hasta = fechaCorta(puntos[puntos.length - 1].t, cruzaAnios.value);
  const rango = `${desde} y ${hasta}`;
  return puntos.length === 1
    ? t('latido.descriptionOne', { quien, rango, unidad: unidadBrillo.value })
    : t('latido.descriptionMany', { quien, n: puntos.length, rango, unidad: unidadBrillo.value });
});

const hayError = computed(() => puntosValidos.value.some((p) => p.error !== null && p.error > 0));
const erroresInvisibles = computed(() => puntosValidos.value.some((p) => p.error !== null && p.error > 0 && !p.barraVisible));

const etiquetasOmitidas = computed(() => puntosValidos.value.some((p) => p.lambda !== null && !p.etiqueta));

const pie = computed(() => {
  const partes = [t('latido.pieIntro', { unidad: unidadBrillo.value })];
  if (hayLambda.value) {
    partes.push(etiquetasOmitidas.value ? t('latido.pieLambdaOmitted') : t('latido.pieLambda'));
  }
  if (hayError.value) {
    partes.push(erroresInvisibles.value ? t('latido.pieErrorInvisible') : t('latido.pieError'));
  }
  return partes.join(' ');
});

const hayLambda = computed(() => puntosValidos.value.some((p) => p.lambda !== null));
import { useI18n } from 'vue-i18n';
import IconoNawi from './IconoNawi.vue';

const { t } = useI18n();
</script>

<template>
  <div class="latido-chart">
    <div v-if="cargando" class="latido-estado" role="status">
      <IconoNawi nombre="espera"  />
      <p>{{ t('latido.loading') }}</p>
    </div>

    <div v-else-if="!puntosValidos.length" class="latido-estado latido-vacio">
      <IconoNawi nombre="pulso"  />
      <div>
        <strong>{{ t('latido.emptyTitle') }}</strong>
        <p v-if="motivo">{{ t('latido.emptyMotivo', { motivo }) }}</p>
        <p v-else>{{ t('latido.emptyNoMotivo') }}</p>
      </div>
    </div>

    <template v-else>
      <svg class="latido-svg" :viewBox="`0 0 ${ANCHO} ${ALTO}`" role="img" :aria-label="descripcion" preserveAspectRatio="xMidYMid meet">
        <title>{{ descripcion }}</title>

        <g class="latido-ejes" aria-hidden="true">
          <line v-for="tick in ticksY" :key="`grid-${tick.valor}`" class="latido-grid" :x1="M.left" :x2="ANCHO - M.right" :y1="tick.y" :y2="tick.y" />
          <text v-for="tick in ticksY" :key="`label-${tick.valor}`" class="latido-tick" :x="M.left - 10" :y="tick.y + 4" text-anchor="end">{{ tick.label }}</text>
          <line class="latido-axis" :x1="M.left" :x2="ANCHO - M.right" :y1="M.top + altoUtil" :y2="M.top + altoUtil" />
          <line class="latido-axis" :x1="M.left" :x2="M.left" :y1="M.top" :y2="M.top + altoUtil" />
          <text v-for="tick in ticksX" :key="`x-${tick.x}`" class="latido-tick" :x="tick.x" :y="M.top + altoUtil + 22" text-anchor="middle">{{ tick.label }}</text>
          <text class="latido-eje-titulo" :x="M.left" :y="M.top - 10">{{ t('latido.axisBrightness', { unidad: unidadBrillo }) }}</text>
          <text class="latido-eje-titulo" :x="ANCHO - M.right" :y="ALTO - 8" text-anchor="end">{{ t('latido.axisDate') }}</text>
        </g>

        <polyline v-if="puntosValidos.length > 1" class="latido-linea" :points="linea" />

        <g v-for="punto in puntosValidos" :key="punto.fechaTexto + punto.flujo" class="latido-punto">
          <template v-if="punto.barraVisible">
            <line class="latido-error" :x1="punto.x" :x2="punto.x" :y1="punto.barra.y1" :y2="punto.barra.y2" />
            <line class="latido-error" :x1="punto.x - 3" :x2="punto.x + 3" :y1="punto.barra.y1" :y2="punto.barra.y1" />
            <line class="latido-error" :x1="punto.x - 3" :x2="punto.x + 3" :y1="punto.barra.y2" :y2="punto.barra.y2" />
          </template>
          <circle class="latido-hit" :cx="punto.x" :cy="punto.y" r="22" />
          <circle class="latido-dot" :cx="punto.x" :cy="punto.y" r="4" />
          <text v-if="punto.etiqueta" class="latido-lambda" :x="punto.etiquetaX" :y="punto.etiquetaY" :text-anchor="punto.etiquetaAnclaje">{{ punto.etiqueta }}</text>
          <title>{{ punto.tooltip }}</title>
        </g>
      </svg>

      <p class="latido-pie">{{ pie }}</p>
    </template>
  </div>
</template>
