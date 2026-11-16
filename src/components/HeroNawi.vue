<script setup>
/**
 * Hero de Ñawi: cover a pantalla completa.
 *
 * Tres capas, y la distinción entre ellas importa:
 *
 *   1. GEOMETRÍA — anillos orbitales con dos luces que los recorren. Es
 *      geometría pura, no una foto: no afirma nada sobre el cielo.
 *   2. FONDO — el mapa de todo el cielo de WISE (NASA/JPL-Caltech), en
 *      infrarrojo. Es imagen de archivo: ilustra la atmósfera del producto,
 *      NO es una observación de Ñawi. Por eso lleva crédito visible.
 *   3. DATO — el recorte real de SPHEREx que el visitante está mirando. Es
 *      lo único de la pantalla que es dato propio, va sin filtro encima y
 *      lleva su etiqueta.
 *
 * Si alguien confunde el fondo con el dato, el hero miente. El crédito y la
 * etiqueta existen para que no pase.
 *
 * El tipo se centra y se superpone a los anillos: el centro queda vacío para
 * que las letras se lean a través. Es lo que hace que el cover respire en vez
 * de verse como un encabezado con adornos al costado.
 */
import { computed } from 'vue';
import IconoNawi from './IconoNawi.vue';

const props = defineProps({
  /** Textos ya traducidos. Si no llegan, el hero usa los de origen (español).
   *  Se reciben por props y no con `t()` para que el componente no dependa de
   *  la instalación de i18n: así se puede usar antes de que exista. */
  textos: {
    type: Object,
    default: () => ({}),
  },
  /** URL del cuadro real que se muestra a la derecha. Vacío = no hay dato. */
  cuadro: { type: String, default: '' },
  /** Fecha del cuadro, para el rótulo. */
  fecha: { type: String, default: '' },
  /** Bandas o longitud de onda del cuadro. */
  banda: { type: String, default: '' },
  /** Nombre del objeto del cuadro. */
  objeto: { type: String, default: '' },
});

/* Textos por defecto, en el idioma de origen del proyecto. */
const TEXTOS_BASE = {
  linea1: 'El cielo',
  linea2: 'cambia.',
  linea3Antes: 'Ahora podés',
  linea3Oro: 'verlo.',
  copy: 'Viajá a través de observaciones infrarrojas reales y seguí las huellas que dejan los objetos celestes.',
  cifra1: '102',
  cifra1Rotulo: 'bandas infrarrojas',
  cifra2: '6',
  cifra2Unidad: 'meses',
  cifra2Rotulo: 'entre mapeos del cielo',
  credito: 'Fondo: mapa de todo el cielo en infrarrojo, WISE ·',
  creditoFuente: 'NASA/JPL-Caltech',
  creditoAviso: '· imagen de archivo, no una observación de Ñawi',
  datoEtiqueta: 'Observación real de SPHEREx',
  datoEscala: '58×58 px, sin interpolar',
};

const t = computed(() => ({ ...TEXTOS_BASE, ...props.textos }));

/* El recorte son 58x58 px y siempre se muestra en un múltiplo entero (6x
   escritorio, 4x tablet, 3x móvil) para que cada píxel del dato caiga en un
   bloque exacto. El tamaño vive en el CSS: pasado inline, ganaría la media
   query y el recorte desbordaría en móvil. */
</script>

<template>
  <section class="cover" id="inicio">
    <!-- Capa 1: geometría orbital. -->
    <div class="cover-orbitas" aria-hidden="true">
      <span class="cover-anillo es-1" />
      <span class="cover-anillo es-2" />
      <span class="cover-anillo es-3" />
      <span class="cover-anillo es-4" />
      <span class="cover-viajero viajero-solar"><i class="cover-luz es-solar" /></span>
      <span class="cover-viajero viajero-plasma"><i class="cover-luz es-plasma" /></span>
    </div>

    <!-- Capa 2: archivo, no dato. -->
    <div class="cover-fondo" aria-hidden="true">
      <img
        class="cover-fondo-img"
        src="../assets/cielo-wise.jpg"
        srcset="../assets/cielo-wise-1100.jpg 900w, ../assets/cielo-wise.jpg 1600w"
        sizes="100vw"
        alt=""
        width="1600"
        height="780"
        decoding="async"
        fetchpriority="high"
      />
      <span class="cover-fondo-velo" />
    </div>

    <div class="cover-interior">
      <!-- Título: el centro queda libre de anillos para que se lea. -->
      <div class="cover-texto">
        <h1 class="cover-titulo">
          <span class="cover-linea"><span>{{ t.linea1 }}</span></span>
          <span class="cover-linea"><span>{{ t.linea2 }}</span></span>
          <span class="cover-linea"><span>{{ t.linea3Antes }} <em class="cover-gild">{{ t.linea3Oro }}</em></span></span>
        </h1>

      </div>

      <p class="cover-copy">{{ t.copy }}</p>

      <!-- Capa 3: el dato. Flota en la esquina inferior derecha del cover. -->
      <figure v-if="cuadro" class="cover-dato">
        <div class="cover-dato-marco">
          <img class="cover-dato-img" :src="cuadro" :alt="`Recorte infrarrojo real de ${objeto || 'un objeto'} del ${fecha}`" />
          <span class="cover-dato-cruz" aria-hidden="true" />
        </div>
        <figcaption class="cover-dato-pie">
          <span class="cover-dato-etiqueta">{{ t.datoEtiqueta }}</span>
          <span class="cover-dato-detalle">{{ objeto }} · {{ fecha }}<template v-if="banda"> · {{ banda }}</template></span>
          <span class="cover-dato-escala">{{ t.datoEscala }}</span>
        </figcaption>
      </figure>
    </div>

    <!-- Riel inferior: lo que antes era el bloque de cifras. -->
    <div class="cover-riel">
      <a class="cover-bajar" href="#explorar">
        <span class="cover-bajar-texto">Explorar</span>
        <span class="cover-bajar-circulo">
          <svg viewBox="0 0 12 12" width="11" height="11" aria-hidden="true" fill="none">
            <path d="M6 1v9M2.5 6.5 6 10l3.5-3.5" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </span>
      </a>

      <div class="cover-cifras">
        <div class="cover-cifra">
          <strong>{{ t.cifra1 }}</strong>
          <span>{{ t.cifra1Rotulo }}</span>
        </div>
        <span class="cover-cifra-regla" aria-hidden="true" />
        <div class="cover-cifra">
          <strong>{{ t.cifra2 }} <small>{{ t.cifra2Unidad }}</small></strong>
          <span>{{ t.cifra2Rotulo }}</span>
        </div>
      </div>
    </div>

    <!-- Crédito: obligatorio, la imagen de fondo no es dato de Ñawi. -->
    <p class="cover-credito">
      {{ t.credito }} <span>{{ t.creditoFuente }}</span> · {{ t.creditoAviso }}
    </p>
  </section>
</template>
