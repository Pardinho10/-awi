<script setup>
/**
 * Hero de Ñawi.
 *
 * Dos capas, y la distinción entre ellas es deliberada:
 *
 *   1. FONDO — el mapa de todo el cielo de WISE (NASA/JPL-Caltech), en
 *      infrarrojo. Es imagen de archivo: ilustra la atmósfera del producto,
 *      NO es una observación de Ñawi. Por eso lleva crédito visible.
 *   2. DATO — el recorte real de SPHEREx que el visitante está mirando. Es
 *      lo único de la pantalla que es dato propio, va sin filtro encima y
 *      lleva su etiqueta.
 *
 * Si alguien confunde las dos, el hero miente. El crédito y la etiqueta
 * existen para que no pase.
 */

import { computed } from 'vue';

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
  altCuadro: 'Recorte infrarrojo real de {objeto} del {fecha}',
};

const t = computed(() => ({ ...TEXTOS_BASE, ...props.textos }));

/* El recorte son 58x58 px y siempre se muestra en un múltiplo entero (6x
   escritorio, 4x tablet, 3x móvil) para que cada píxel del dato caiga en un
   bloque exacto. El tamaño vive en el CSS: pasado inline, ganaría la media
   query y el recorte desbordaría en móvil. */
</script>

<template>
  <section class="hero" id="inicio">
    <!-- Capa 1: archivo, no dato. -->
    <div class="hero-fondo" aria-hidden="true">
      <img
        class="hero-fondo-img"
        src="../assets/cielo-wise.jpg"
        srcset="../assets/cielo-wise-1100.jpg 900w, ../assets/cielo-wise.jpg 1600w"
        sizes="100vw"
        alt=""
        width="1600"
        height="780"
        decoding="async"
        fetchpriority="high"
      />
      <span class="hero-fondo-velo" />
    </div>

    <div class="hero-interior">
      <div class="hero-texto">
        <h1 class="hero-titulo">
          <span class="hero-linea"><span>{{ t.linea1 }}</span></span>
          <span class="hero-linea"><span>{{ t.linea2 }}</span></span>
          <span class="hero-linea"><span>{{ t.linea3Antes }} <em class="hero-gild">{{ t.linea3Oro }}</em></span></span>
        </h1>

        <p class="hero-copy">{{ t.copy }}</p>

        <div class="hero-cifras">
          <div class="hero-cifra">
            <strong>102</strong>
            <span>{{ t.cifra1Rotulo }}</span>
          </div>
          <span class="hero-cifra-regla" aria-hidden="true" />
          <div class="hero-cifra">
            <strong>{{ t.cifra2 }} <small>{{ t.cifra2Unidad }}</small></strong>
            <span>{{ t.cifra2Rotulo }}</span>
          </div>
        </div>

        <p class="hero-credito">
          {{ t.credito }}
          <span>{{ t.creditoFuente }}</span> {{ t.creditoAviso }}
        </p>
      </div>

      <!-- Capa 2: el dato. -->
      <figure v-if="cuadro" class="hero-dato">
        <div class="hero-dato-marco">
          <img class="hero-dato-img" :src="cuadro" :alt="t.altCuadro.replace('{objeto}', objeto || '—').replace('{fecha}', fecha)" />
          <span class="hero-dato-cruz" aria-hidden="true" />
        </div>
        <figcaption class="hero-dato-pie">
          <span class="hero-dato-etiqueta">{{ t.datoEtiqueta }}</span>
          <span class="hero-dato-detalle">{{ objeto }} · {{ fecha }}<template v-if="banda"> · {{ banda }}</template></span>
          <span class="hero-dato-escala">{{ t.datoEscala }}</span>
        </figcaption>
      </figure>
    </div>

    <span class="hero-orilla" aria-hidden="true" />
  </section>
</template>
