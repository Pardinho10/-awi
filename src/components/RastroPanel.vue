<script setup>
/**
 * Rastro (D2): cuánto se movió el objeto entre el primer y el último cuadro,
 * medido por el backend, y la frase "En palabras simples" tal como la redactó.
 *
 * Todo lo que muestra viene del bloque `rastro` del backend
 * (desplazamiento_arcsec, direccion_deg, incertidumbre_arcsec,
 *  pm_publicado_arcsec_yr, pm_medido_arcsec_yr, cuadros_usados,
 *  fecha_inicio, fecha_fin, frase_simple). El componente no recalcula la
 * medición: solo compara el movimiento propio medido con el publicado
 * (resta y comparación contra la incertidumbre) para mostrar si el método
 * reproduce el valor conocido.
 *
 * Si `desplazamiento_arcsec` no es un número, no se dibuja nada: nada de
 * paneles con guiones vacíos.
 */
import { computed } from 'vue';

const props = defineProps({
  rastro: { type: Object, default: null },
  nombre: { type: String, default: '' },
});

const numero = (valor) => {
  if (valor === null || valor === undefined || valor === '') return null;
  const n = Number(valor);
  return Number.isFinite(n) ? n : null;
};

/** Formato es-AR (coma decimal, como el resto de la ficha); hasta 3 decimales. */
const formatear = (valor) => valor.toLocaleString('es-AR', { maximumFractionDigits: 3 });

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
    frase: typeof r.frase_simple === 'string' && r.frase_simple.trim() ? r.frase_simple.trim() : '',
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
import IconoNawi from './IconoNawi.vue';
</script>

<template>
  <section v-if="datos" class="rastro-panel panel" aria-labelledby="rastro-titulo">
    <header class="rastro-head">
      <div>
        <span class="eyebrow">RASTRO</span>
        <h2 id="rastro-titulo">Cuánto se movió{{ nombre ? ` ${nombre}` : '' }}</h2>
      </div>
      <span v-if="datos.cuadros !== null" class="rastro-chip">{{ formatear(datos.cuadros) }} cuadros usados</span>
    </header>

    <p class="rastro-intro">
      Del primer al último cuadro, medido sobre los recortes alineados. Nawi muestra esos
      valores sin recalcularlos.
    </p>

    <dl class="rastro-metricas">
      <div class="rastro-metrica">
        <dt>Desplazamiento</dt>
        <dd>
          <strong class="rastro-valor">{{ formatear(datos.desplazamiento) }}″</strong>
          <span v-if="datos.incertidumbre !== null" class="rastro-nota">± {{ formatear(datos.incertidumbre) }}″</span>
        </dd>
      </div>
      <div v-if="datos.direccion !== null" class="rastro-metrica">
        <dt>Dirección</dt>
        <dd><strong class="rastro-valor">{{ formatear(datos.direccion) }}°</strong><span class="rastro-nota">ángulo medido</span></dd>
      </div>
      <div v-if="datos.medido !== null" class="rastro-metrica">
        <dt>Movimiento propio medido</dt>
        <dd><strong class="rastro-valor">{{ formatear(datos.medido) }}″/año</strong></dd>
      </div>
      <div v-if="datos.publicado !== null" class="rastro-metrica">
        <dt>Movimiento propio publicado</dt>
        <dd><strong class="rastro-valor">{{ formatear(datos.publicado) }}″/año</strong><span class="rastro-nota">catálogo</span></dd>
      </div>
      <div v-if="fechas" class="rastro-metrica rastro-metrica-ancha">
        <dt>Fechas usadas</dt>
        <dd><strong class="rastro-valor">{{ fechas }}</strong></dd>
      </div>
    </dl>

    <p v-if="comparacion" class="rastro-validacion" :class="{ 'is-ok': comparacion.dentro === true, 'is-off': comparacion.dentro === false }" role="note">
      <IconoNawi :nombre="comparacion.dentro === false ? 'alerta' : 'check-circulo'" />
      <span v-if="comparacion.dentro === true">
        La medición cae dentro de la incertidumbre del valor publicado (diferencia
        {{ formatear(comparacion.diferencia) }}″/año, incertidumbre ±{{ formatear(datos.incertidumbre) }}″):
        el método reproduce el movimiento propio conocido.
      </span>
      <span v-else-if="comparacion.dentro === false">
        La diferencia con el valor publicado ({{ formatear(comparacion.diferencia) }}″/año) supera la incertidumbre
        informada (±{{ formatear(datos.incertidumbre) }}″): la medición no coincide con el catálogo.
      </span>
      <span v-else>
        Diferencia con el valor publicado: {{ formatear(comparacion.diferencia) }}″/año. No se informó
        incertidumbre, así que no se afirma si coinciden.
      </span>
    </p>

    <blockquote v-if="datos.frase" class="rastro-frase">
      <p class="rastro-frase-texto">{{ datos.frase }}</p>
      <footer class="rastro-frase-fuente">
        En palabras simples · redactada con los valores medidos
      </footer>
    </blockquote>
  </section>
</template>
