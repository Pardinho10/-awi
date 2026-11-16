<script setup>
/**
 * Rastro (D2): cuánto se movió el objeto entre el primer y el último cuadro,
 * medido por el backend, más la comparación con el movimiento propio publicado.
 *
 * Todo lo que muestra viene del bloque `rastro` del backend
 * (desplazamiento_arcsec, direccion_deg, incertidumbre_arcsec,
 *  pm_publicado_arcsec_yr, pm_medido_arcsec_yr, cuadros_usados,
 *  fecha_inicio, fecha_fin, frase_simple). El componente no recalcula la
 * medición: solo compara el movimiento propio medido con el publicado
 * (resta y comparación contra la incertidumbre) para mostrar si el método
 * reproduce el valor conocido.
 *
 * La frase "en palabras simples" se compone acá en el idioma activo a partir de
 * las cifras del backend: `frase_simple` llega redactada en español y usarla en
 * inglés mezclaría idiomas.
 *
 * Si `desplazamiento_arcsec` no es un número, no se dibuja nada: nada de
 * paneles con guiones vacíos.
 */
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { locale } from '../i18n/index.js';
import IconoNawi from './IconoNawi.vue';

const props = defineProps({
  rastro: { type: Object, default: null },
  nombre: { type: String, default: '' },
  /** Escala del recorte (″/px) para traducir el desplazamiento a píxeles. */
  pixelArcsec: { type: Number, default: 6.15 },
});

const { t } = useI18n();
const numero = (valor) => {
  if (valor === null || valor === undefined || valor === '') return null;
  const n = Number(valor);
  return Number.isFinite(n) ? n : null;
};

/** Números con el formato del idioma activo (es: coma decimal; en: punto). */
const formatear = (valor) => valor.toLocaleString(locale.value === 'en' ? 'en-US' : 'es-AR', { maximumFractionDigits: 3 });

// Se aceptan nombres snake_case (los del backend) y camelCase por si el
// adaptador normaliza más adelante: el panel no depende de eso.
const datos = computed(() => {
  const r = props.rastro;
  if (!r || typeof r !== 'object' || Array.isArray(r)) return null;

  const desplazamiento = numero(r.desplazamiento_arcsec ?? r.desplazamientoArcsec);
  if (desplazamiento === null) return null;

  return {
    desplazamiento,
    incertidumbre: numero(r.incertidumbre_arcsec ?? r.incertidumbreArcsec),
    direccion: numero(r.direccion_deg ?? r.direccionDeg),
    medido: numero(r.pm_medido_arcsec_yr ?? r.pmMedidoArcsecYr),
    publicado: numero(r.pm_publicado_arcsec_yr ?? r.pmPublicadoArcsecYr),
    cuadros: numero(r.cuadros_usados ?? r.cuadrosUsados),
    inicio: typeof r.fecha_inicio === 'string' ? r.fecha_inicio : (r.fechaInicio ?? null),
    fin: typeof r.fecha_fin === 'string' ? r.fecha_fin : (r.fechaFin ?? null),
  };
});

// Comparación honesta: solo se afirma que la medición reproduce el valor
// publicado si la diferencia entra en la incertidumbre informada.
const comparacion = computed(() => {
  const d = datos.value;
  if (!d || d.medido === null || d.publicado === null) return null;
  const diferencia = Math.abs(d.medido - d.publicado);
  const dentro = d.incertidumbre !== null ? diferencia <= d.incertidumbre : null;
  return { diferencia, dentro };
});

const fechas = computed(() => {
  const d = datos.value;
  if (!d) return '';
  if (d.inicio && d.fin) return `${d.inicio} → ${d.fin}`;
  return d.inicio || d.fin || '';
});

/** Años transcurridos entre las fechas usadas (para la frase y el valor esperado). */
const anios = computed(() => {
  const d = datos.value;
  if (!d?.inicio || !d?.fin) return null;
  const ms = new Date(d.fin) - new Date(d.inicio);
  return Number.isFinite(ms) && ms > 0 ? ms / (365.25 * 24 * 3600 * 1000) : null;
});

/** Dirección en grados → punto cardinal traducido (norte, noreste, …). */
function cardinal(grados) {
  if (!Number.isFinite(grados)) return 'norte';
  const puntos = ['norte', 'noreste', 'este', 'sureste', 'sur', 'suroeste', 'oeste', 'noroeste'];
  const indice = Math.round((((grados % 360) + 360) % 360) / 45) % 8;
  return puntos[indice];
}

/** Frase "en palabras simples" armada en el idioma activo con los valores medidos. */
const fraseCompuesta = computed(() => {
  const d = datos.value;
  if (!d) return '';
  const escala = props.pixelArcsec > 0 ? props.pixelArcsec : 6.15;
  const esperado = d.publicado !== null && anios.value !== null ? Math.abs(d.publicado * anios.value) : null;
  return t('rastro.frase', {
    desde: d.inicio ?? '—',
    hasta: d.fin ?? '—',
    anios: anios.value !== null ? formatear(anios.value) : '—',
    nombre: props.nombre || '—',
    desplazamiento: formatear(d.desplazamiento),
    direccion: t(`direccion.${cardinal(d.direccion)}`),
    pixeles: formatear(d.desplazamiento / escala),
    publicado: esperado !== null ? formatear(esperado) : '—',
  });
});
</script>

<template>
  <section v-if="datos" class="rastro-panel panel" aria-labelledby="rastro-titulo">
    <header class="rastro-head">
      <div>
        <span class="eyebrow">{{ t('rastro.eyebrow') }}</span>
        <h2 id="rastro-titulo">{{ nombre ? t('rastro.title', { nombre }) : t('rastro.titleSinNombre') }}</h2>
      </div>
      <span v-if="datos.cuadros !== null" class="rastro-chip">{{ t('rastro.chipFrames', { n: formatear(datos.cuadros) }) }}</span>
    </header>

    <p class="rastro-intro">{{ t('rastro.intro') }}</p>

    <dl class="rastro-metricas">
      <div class="rastro-metrica">
        <dt>{{ t('rastro.displacement') }}</dt>
        <dd>
          <strong class="rastro-valor">{{ formatear(datos.desplazamiento) }}″</strong>
          <span v-if="datos.incertidumbre !== null" class="rastro-nota">± {{ formatear(datos.incertidumbre) }}″</span>
        </dd>
      </div>
      <div v-if="datos.direccion !== null" class="rastro-metrica">
        <dt>{{ t('rastro.direction') }}</dt>
        <dd><strong class="rastro-valor">{{ formatear(datos.direccion) }}°</strong><span class="rastro-nota">{{ t('rastro.angleNote') }}</span></dd>
      </div>
      <div v-if="datos.medido !== null" class="rastro-metrica">
        <dt>{{ t('rastro.pmMeasured') }}</dt>
        <dd><strong class="rastro-valor">{{ formatear(datos.medido) }}{{ t('rastro.perYear') }}</strong></dd>
      </div>
      <div v-if="datos.publicado !== null" class="rastro-metrica">
        <dt>{{ t('rastro.pmPublished') }}</dt>
        <dd><strong class="rastro-valor">{{ formatear(datos.publicado) }}{{ t('rastro.perYear') }}</strong><span class="rastro-nota">{{ t('rastro.catalogNote') }}</span></dd>
      </div>
      <div v-if="fechas" class="rastro-metrica rastro-metrica-ancha">
        <dt>{{ t('rastro.dates') }}</dt>
        <dd><strong class="rastro-valor">{{ fechas }}</strong></dd>
      </div>
    </dl>

    <p v-if="comparacion" class="rastro-validacion" :class="{ 'is-ok': comparacion.dentro === true, 'is-off': comparacion.dentro === false }" role="note">
      <IconoNawi :nombre="comparacion.dentro === false ? 'alerta' : 'check-circulo'" />
      <span v-if="comparacion.dentro === true">
        {{ t('rastro.validationOk', { diferencia: formatear(comparacion.diferencia), incertidumbre: datos.incertidumbre !== null ? formatear(datos.incertidumbre) : '—' }) }}
      </span>
      <span v-else-if="comparacion.dentro === false">
        {{ t('rastro.validationOff', { diferencia: formatear(comparacion.diferencia), incertidumbre: datos.incertidumbre !== null ? formatear(datos.incertidumbre) : '—' }) }}
      </span>
      <span v-else>
        {{ t('rastro.validationUnknown', { diferencia: formatear(comparacion.diferencia) }) }}
      </span>
    </p>

    <blockquote class="rastro-frase">
      <p class="rastro-frase-texto">{{ fraseCompuesta }}</p>
      <footer class="rastro-frase-fuente">{{ t('rastro.fraseFuente') }}</footer>
    </blockquote>
  </section>
</template>
