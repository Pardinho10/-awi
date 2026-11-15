<script setup>
/**
 * IconoNawi — set de iconos de Helios (SVG dibujado a mano, sin dependencias).
 *
 * Reemplaza a bootstrap-icons en toda la app. Trazos de 1.25 px, sin relleno,
 * extremos y uniones redondeados, `stroke="currentColor"` para heredar el color
 * del texto (funciona igual en tema oscuro y claro) y viewBox 0 0 24 24.
 *
 * Cubre los 28 iconos que usa la app hoy (Bootstrap → prop):
 *
 *   bi-eye-fill .................... ojo            (marca de la cabecera)
 *   bi-question-lg ................. ayuda          (botón de ayuda)
 *   bi-stars ...................... estrellas      (bandas infrarrojas)
 *   bi-search ..................... buscar         (buscador del catálogo)
 *   bi-arrow-up-right ............. flecha-externa (enlaces y filas)
 *   bi-check2 ..................... check          (estado del catálogo)
 *   bi-share ..................... compartir      (compartir vista)
 *   bi-rulers .................... regla          (ficha del recorte)
 *   bi-crosshair2 ................ mira           (cruz de posición)
 *   bi-slash-lg .................. diagonal       (trayectoria)
 *   bi-exclamation-triangle ...... alerta         (advertencias)
 *   bi-hourglass-split ........... espera         (cargando)
 *   bi-water ..................... agua           (modo suavizado)
 *   bi-clock-history ............. historial      (línea de tiempo)
 *   bi-layout-split .............. comparar       (antes y después)
 *   bi-camera-video-off .......... sin-camara     (objeto sin cuadros)
 *   bi-info-circle ............... info           (notas al pie)
 *   bi-check-circle-fill ......... check-circulo  (confirmación)
 *   bi-check2-circle ............. check-circulo  (validación del rastro)
 *   bi-skip-backward-fill ........ anterior       (cuadro anterior)
 *   bi-skip-forward-fill ......... siguiente      (cuadro siguiente)
 *   bi-play-fill ................. reproducir     (play)
 *   bi-pause-fill ................ pausa          (pausa)
 *   bi-arrows-angle-expand ....... zoom           (control de zoom)
 *   bi-grid-3x3-gap-fill ......... pixel          (modo píxel real)
 *   bi-activity .................. pulso          (latido vacío)
 *   bi-moon-stars ................ luna           (pasar a oscuro)
 *   bi-brightness-high ........... sol            (pasar a claro)
 *
 * Uso:
 *   <IconoNawi nombre="compartir" />                    // 16 px, decorativo
 *   <IconoNawi nombre="alerta" :tamano="20" />          // otro tamaño
 *   <IconoNawi nombre="info" etiqueta="Más información" /> // aria-label + role
 *   <IconoNawi nombre="check" aria-label="Listo" />      // igual, por atributo
 *
 * Accesibilidad: si no recibe `etiqueta` ni `aria-label`, el SVG sale con
 * aria-hidden="true" (es decorativo, el texto de al lado ya dice qué es).
 */
import { computed, useAttrs } from 'vue';

const props = defineProps({
  nombre: { type: String, required: true },
  tamano: { type: Number, default: 16 },
  /** Texto accesible. Si viene, el icono deja de ser decorativo. */
  etiqueta: { type: String, default: '' },
});

defineOptions({ inheritAttrs: false });

const attrs = useAttrs();

/** Grosor único del set: hairline, no 2 px. */
const TRAZO = 1.25;

/**
 * Cada icono es una lista de formas: { d } para trazos y { c: [cx, cy, r] }
 * para círculos. Todo se dibuja con el mismo estilo (sin relleno), así que no
 * hace falta que cada forma repita atributos.
 */
const ICONOS = {
  ojo: [
    { d: 'M2.6 12c2.7-4.4 6-6.6 9.4-6.6S18.7 7.6 21.4 12c-2.7 4.4-6 6.6-9.4 6.6S5.3 16.4 2.6 12Z' },
    { c: [12, 12, 3.1] },
  ],
  ayuda: [
    { c: [12, 12, 9.2] },
    // Interrogación chica y centrada: con 2.8 de radio tocaba el anillo a 16 px.
    { d: 'M9.9 9.5a2.45 2.45 0 1 1 3.85 1.95c-.75.55-1.25 1.05-1.25 1.95v.4' },
    { c: [12, 17.1, 0.8] },
  ],
  estrellas: [
    // Dos destellos separados: pegados (y con un punto extra) se embotaban a 16 px.
    { d: 'M9.2 3.8C9.85 6.4 11.1 7.65 13.6 8.3c-2.5.65-3.75 1.9-4.4 4.4-.65-2.5-1.9-3.75-4.4-4.4C7.3 7.65 8.55 6.4 9.2 3.8Z' },
    { d: 'M17.4 14.2c.38 1.5 1.12 2.24 2.62 2.62-1.5.38-2.24 1.12-2.62 2.62-.38-1.5-1.12-2.24-2.62-2.62 1.5-.38 2.24-1.12 2.62-2.62Z' },
  ],
  buscar: [
    { c: [10.6, 10.6, 6.1] },
    { d: 'M15.2 15.2 20.6 20.6' },
  ],
  'flecha-externa': [
    { d: 'M7.2 16.8 16.8 7.2' },
    { d: 'M9.6 7.2H16.8v7.2' },
  ],
  check: [{ d: 'M4.8 12.6 9.8 17.6 19.2 7.4' }],
  compartir: [
    { c: [17.4, 5.9, 2.2] },
    { c: [6.6, 12, 2.2] },
    { c: [17.4, 18.1, 2.2] },
    { d: 'M8.5 10.9 15.5 7.1' },
    { d: 'M8.5 13.1 15.5 16.9' },
  ],
  regla: [
    { d: 'M7.8 3.2h8.4v17.6H7.8z' },
    // Graduaciones alternadas: se lee como regla y no como una caja con rayas.
    { d: 'M7.8 7.8h3.2M7.8 12h4.6M7.8 16.2h3.2' },
    { d: 'M16.2 9.9h-2.4M16.2 14.1h-2.4' },
  ],
  mira: [
    { c: [12, 12, 6.9] },
    { d: 'M12 2.2v3.7' },
    { d: 'M12 18.1v3.7' },
    { d: 'M2.2 12h3.7' },
    { d: 'M18.1 12h3.7' },
    { c: [12, 12, 1.1] },
  ],
  diagonal: [{ d: 'M4.6 19.4 19.4 4.6' }],
  alerta: [
    { d: 'M10.6 4.6 2.9 18.1a1.6 1.6 0 0 0 1.4 2.4h15.4a1.6 1.6 0 0 0 1.4-2.4L13.4 4.6a1.6 1.6 0 0 0-2.8 0Z' },
    { d: 'M12 9.6v4.4' },
    { c: [12, 17.2, 0.85] },
  ],
  espera: [
    { d: 'M6.9 3.4h10.2' },
    { d: 'M6.9 20.6h10.2' },
    { d: 'M8.1 3.4c0 4.7 3.9 5.9 3.9 8.6s-3.9 3.9-3.9 8.6' },
    { d: 'M15.9 3.4c0 4.7-3.9 5.9-3.9 8.6s3.9 3.9 3.9 8.6' },
  ],
  // Dos ondas (no tres): con tres, a 16 px se veía una sola mancha.
  agua: [
    { d: 'M3 9.4c1.9-2.2 3.7-2.2 5.6 0s3.7 2.2 5.6 0 3.7-2.2 5.6 0' },
    { d: 'M3 14.6c1.9-2.2 3.7-2.2 5.6 0s3.7 2.2 5.6 0 3.7-2.2 5.6 0' },
  ],
  historial: [
    { c: [12, 12, 7.9] },
    { d: 'M12 7.6v4.9l3.4 2' },
  ],
  comparar: [
    { d: 'M3.4 4.6h17.2v14.8H3.4z' },
    { d: 'M12 4.6v14.8' },
  ],
  'sin-camara': [
    { d: 'M2.6 7.2h12.6v9.6H2.6z' },
    { d: 'M15.2 11.1 21.4 8v8l-6.2-3.1' },
    { d: 'M3.4 3.4 20.6 20.6' },
  ],
  info: [
    { c: [12, 12, 9.2] },
    { d: 'M12 11v5.6' },
    { c: [12, 7.9, 0.85] },
  ],
  'check-circulo': [
    { c: [12, 12, 9.2] },
    { d: 'M7.8 12.3 10.9 15.4 16.4 9.4' },
  ],
  anterior: [
    { d: 'M4.7 6v12' },
    { d: 'M18.2 6.5 8.9 12l9.3 5.5Z' },
  ],
  siguiente: [
    { d: 'M19.3 6v12' },
    { d: 'M5.8 6.5 15.1 12l-9.3 5.5Z' },
  ],
  zoom: [
    { d: 'M13.6 3.8h6.6v6.6' },
    { d: 'M20.2 3.8 12.7 11.3' },
    { d: 'M10.4 20.2H3.8v-6.6' },
    { d: 'M3.8 20.2 11.3 12.7' },
  ],
  pulso: [{ d: 'M2.6 12h3.8l2.4-5.4L12 17.4l2.4-5.4h6.9' }],
  reproducir: [{ d: 'M8 5.6 18.6 12 8 18.4Z' }],
  pausa: [
    { d: 'M9.2 5.6v12.8' },
    { d: 'M14.8 5.6v12.8' },
  ],
  // Creciente limpio: a 16 px un punto de estrella al lado se leía como
  // suciedad, así que la luna va sola (el nombre del icono ya es explícito).
  luna: [{ d: 'M20.5 14.5A8.6 8.6 0 1 1 12.2 3.6 6.9 6.9 0 0 0 20.5 14.5Z' }],
  sol: [
    { c: [12, 12, 3.9] },
    { d: 'M12 2.8v3.2M12 18v3.2M2.8 12h3.2M18 12h3.2M5.5 5.5l2.3 2.3M16.2 16.2l2.3 2.3M18.5 5.5l-2.3 2.3M7.8 16.2l-2.3 2.3' },
  ],
  pixel: [
    { d: 'M3.6 3.6h16.8v16.8H3.6z' },
    { d: 'M9.2 3.6v16.8M14.8 3.6v16.8' },
    { d: 'M3.6 9.2h16.8M3.6 14.8h16.8' },
  ],
  'sin-dibujo': [
    { c: [12, 12, 9.2] },
    { d: 'M5.6 18.4 18.4 5.6' },
  ],
};

/** Formas del icono pedido; si el nombre no existe, un marcador visible. */
const formas = computed(() => {
  const receta = ICONOS[props.nombre];
  if (receta) return receta;
  if (import.meta.env?.DEV) {
    console.warn(`[IconoNawi] nombre desconocido: "${props.nombre}"`);
  }
  return ICONOS['sin-dibujo'];
});

// La etiqueta puede venir por prop (`etiqueta`) o como atributo (`aria-label`):
// el fallthrough de atributos la traía, pero la pisaba un `:aria-label="undefined"`.
const etiquetaFinal = computed(() => props.etiqueta || attrs['aria-label'] || attrs.ariaLabel || '');
const tieneEtiqueta = computed(() => Boolean(etiquetaFinal.value));
const rol = computed(() => attrs.role ?? (tieneEtiqueta.value ? 'img' : undefined));
</script>

<template>
  <svg
    v-bind="attrs"
    class="icono-nawi"
    :width="tamano"
    :height="tamano"
    viewBox="0 0 24 24"
    :role="rol"
    :aria-hidden="tieneEtiqueta ? undefined : 'true'"
    :aria-label="etiquetaFinal || undefined"
    focusable="false"
    fill="none"
    stroke="currentColor"
    :stroke-width="TRAZO"
    stroke-linecap="round"
    stroke-linejoin="round"
  >
    <template v-for="(forma, indice) in formas" :key="indice">
      <path v-if="forma.d" :d="forma.d" />
      <circle v-else-if="forma.c" :cx="forma.c[0]" :cy="forma.c[1]" :r="forma.c[2]" />
    </template>
  </svg>
</template>

<style scoped>
/* El icono es solo geometría: no fija color ni tamaño de línea, así hereda el
   color del contenedor y no pelea con el tema. */
.icono-nawi {
  display: inline-block;
  flex-shrink: 0;
  vertical-align: middle;
  overflow: visible;
}
</style>
