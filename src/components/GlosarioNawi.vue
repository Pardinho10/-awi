<script setup>
/**
 * Glosario — panel flotante con los términos que la interfaz usa sin explicar.
 *
 * Por qué existe: en pantalla aparecen ″, ′, μm, Jy, σ y «interpolado» sin
 * definición. El público del proyecto (estudiantes, docentes, curiosos) no
 * tiene por qué saber qué es un segundo de arco. La alternativa era un modal
 * de «acerca de», que es un muro de texto que nadie lee; esto es la misma
 * información, en el momento en que hace falta y en dosis de una línea.
 *
 * Decisiones de interacción:
 *
 *   - Anclado al botón, no centrado. Un glosario es una consulta al costado
 *     mientras se sigue mirando la pantalla: un modal con velo oscuro tapa el
 *     visor justo cuando el usuario quiere comparar el término con lo que ve.
 *   - Cierra al tocar fuera y con Escape. Escape es obligatorio: sin él, quien
 *     navega con teclado queda atrapado en el panel.
 *   - El foco vuelve al botón al cerrar, y el primer foco entra al panel al
 *     abrir. No es un diálogo modal (no hay `aria-modal` ni trampa de foco):
 *     es un panel no modal, y lo que puede hacer el usuario con el teclado
 *     tiene que ser coherente con eso.
 *   - Se cierra al cambiar de idioma por el mismo motivo que se cierra al
 *     cambiar de sección: el contenido cambió abajo del cursor.
 */
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import IconoNawi from './IconoNawi.vue';
import { locale } from '../i18n/index.js';

const { t } = useI18n();

/** Términos en el orden en que aparecen al recorrer la página. */
const TERMINOS = [
  'infrarrojo',
  'longitudOnda',
  'banda',
  'campo',
  'segundoArco',
  'movimientoPropio',
  'brillo',
  'sigma',
  'interpolado',
  'latido',
  'rastro',
];

const abierto = ref(false);
const panel = ref(null);
const boton = ref(null);

const terminos = computed(() =>
  TERMINOS.map((clave) => ({
    clave,
    nombre: t(`glosario.terminos.${clave}.nombre`),
    definicion: t(`glosario.terminos.${clave}.definicion`),
  }))
);

function abrir() {
  abierto.value = true;
}

function cerrar({ devolverFoco = true } = {}) {
  if (!abierto.value) return;
  abierto.value = false;
  if (devolverFoco) boton.value?.focus();
}

function alternar() {
  if (abierto.value) cerrar();
  else abrir();
}

/* Clic fuera: se escucha en `pointerdown` y no en `click` para que el cierre
   ocurra al presionar y no al soltar. Con `click`, arrastrar el mouse desde
   adentro del panel hacia afuera lo cerraba sin intención. */
function alPresionarFuera(evento) {
  if (!abierto.value) return;
  const dentroDelPanel = panel.value?.contains(evento.target);
  const enElBoton = boton.value?.contains(evento.target);
  if (!dentroDelPanel && !enElBoton) cerrar();
}

function alTeclear(evento) {
  if (!abierto.value) return;
  if (evento.key === 'Escape') {
    evento.stopPropagation();
    cerrar();
  }
}

/* Al abrir, el foco entra al panel: es lo que espera quien abrió con teclado.
   Sin esto, Tab seguiría recorriendo la página por detrás del panel abierto. */
watch(abierto, async (valor) => {
  if (valor) {
    await nextTick();
    panel.value?.focus();
  }
});

/* Si cambia el idioma con el panel abierto, el contenido se reescribe. Cerrar
   evita que el usuario lea una mezcla mientras el foco está adentro. */
watch(locale, () => cerrar({ devolverFoco: false }));

onMounted(() => {
  document.addEventListener('pointerdown', alPresionarFuera);
  document.addEventListener('keydown', alTeclear);
});

onBeforeUnmount(() => {
  document.removeEventListener('pointerdown', alPresionarFuera);
  document.removeEventListener('keydown', alTeclear);
});
</script>

<template>
  <div class="glosario">
    <button
      ref="boton"
      type="button"
      class="icon-button glosario-boton"
      :class="{ 'is-abierto': abierto }"
      :aria-expanded="abierto"
      aria-haspopup="dialog"
      aria-controls="glosario-panel"
      :title="t('a11y.glosario')"
      :aria-label="t('a11y.glosario')"
      @click="alternar"
    >
      <IconoNawi nombre="ayuda" />
    </button>

    <Transition name="glosario-aparece">
      <div
        v-if="abierto"
        id="glosario-panel"
        ref="panel"
        class="glosario-panel"
        role="dialog"
        :aria-label="t('glosario.titulo')"
        tabindex="-1"
      >
        <div class="glosario-cabeza">
          <div>
            <span class="eyebrow">{{ t('glosario.eyebrow') }}</span>
            <h2 class="glosario-titulo">{{ t('glosario.titulo') }}</h2>
          </div>
          <button
            type="button"
            class="glosario-cerrar"
            :aria-label="t('glosario.cerrar')"
            :title="t('glosario.cerrar')"
            @click="cerrar()"
          >
            <IconoNawi nombre="cerrar" :tamano="14" />
          </button>
        </div>

        <p class="glosario-intro">{{ t('glosario.intro') }}</p>

        <dl class="glosario-lista">
          <div v-for="termino in terminos" :key="termino.clave" class="glosario-item">
            <dt>{{ termino.nombre }}</dt>
            <dd>{{ termino.definicion }}</dd>
          </div>
        </dl>

        <p class="glosario-pie">
          {{ t('glosario.pie') }}
          <span>{{ t('glosario.pieFuentes') }}</span>
        </p>
      </div>
    </Transition>
  </div>
</template>
