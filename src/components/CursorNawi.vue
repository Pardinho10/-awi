<script setup>
/**
 * Cursor propio: un anillo fino que persigue al puntero con retardo y un punto
 * que lo sigue exacto.
 *
 * Decisiones:
 * - Sólo se activa con puntero fino. En táctil no hay cursor que reemplazar y
 *   los elementos quedarían ocultos sin motivo.
 * - Los listeners de movimiento son `passive`: no se llama a preventDefault y no
 *   se frena el scroll.
 * - El bucle de animación se corta cuando el anillo alcanza al puntero. Un rAF
 *   perpetuo gastando batería para mover un círculo quieto no tiene sentido.
 * - Con `prefers-reduced-motion` no se anima el retardo: el anillo va pegado al
 *   puntero o directamente no aparece.
 * - `pointer-events: none` para que nunca robe un clic.
 */
import { onBeforeUnmount, onMounted, ref } from 'vue';

const anillo = ref(null);
const punto = ref(null);
const activo = ref(false);
const sobreElemento = ref(false);

let mx = 0;
let my = 0;
let rx = 0;
let ry = 0;
let raf = null;
let reducido = false;

const HOVERABLES = 'a, button, [role="option"], input, .object-option, .date-tick, .zoom-button';

function moverPunto() {
  if (punto.value) {
    punto.value.style.transform = `translate(${mx}px, ${my}px) translate(-50%, -50%)`;
  }
}

function animar() {
  rx += (mx - rx) * 0.16;
  ry += (my - ry) * 0.16;

  if (anillo.value) {
    anillo.value.style.transform = `translate(${rx}px, ${ry}px) translate(-50%, -50%)`;
  }

  // Se detiene al alcanzar el objetivo (o antes, si el movimiento es reducido).
  if (reducido || (Math.abs(mx - rx) < 0.15 && Math.abs(my - ry) < 0.15)) {
    if (anillo.value) {
      anillo.value.style.transform = `translate(${mx}px, ${my}px) translate(-50%, -50%)`;
    }
    raf = null;
    return;
  }

  raf = requestAnimationFrame(animar);
}

function alMover(evento) {
  mx = evento.clientX;
  my = evento.clientY;
  activo.value = true;
  moverPunto();
  if (!raf) raf = requestAnimationFrame(animar);
}

function alPasar(evento) {
  sobreElemento.value = Boolean(evento.target.closest?.(HOVERABLES));
}

function alSalir(evento) {
  if (evento.relatedTarget) return;
  activo.value = false;
  sobreElemento.value = false;
}

onMounted(() => {
  const punteroFino = window.matchMedia('(pointer: fine)').matches;
  if (!punteroFino) return;

  reducido = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  window.addEventListener('mousemove', alMover, { passive: true });
  document.addEventListener('mouseover', alPasar, { passive: true });
  document.addEventListener('mouseout', alPasar, { passive: true });
  document.addEventListener('mouseleave', alSalir);
});

onBeforeUnmount(() => {
  window.removeEventListener('mousemove', alMover);
  document.removeEventListener('mouseover', alPasar);
  document.removeEventListener('mouseout', alPasar);
  document.removeEventListener('mouseleave', alSalir);
  if (raf) cancelAnimationFrame(raf);
});
</script>

<template>
  <div
    class="nawi-cursor"
    :class="{ 'is-activo': activo, 'is-sobre': sobreElemento }"
    aria-hidden="true"
  >
    <span ref="anillo" class="nawi-cursor-anillo" />
    <span ref="punto" class="nawi-cursor-punto" />
  </div>
</template>
