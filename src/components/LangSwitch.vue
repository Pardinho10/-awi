<script setup>
/**
 * Selector de idioma (ES / EN).
 *
 * Reusa el lenguaje visual de la barra superior: una píldora con hairlines y
 * micro-tipografía mono, sin inventar colores (tokens de Helios). El idioma
 * activo se marca con `aria-pressed` y con el acento dorado.
 */
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { LOCALES, locale, setLocale } from '../i18n/index.js';

const { t } = useI18n();
const activo = computed(() => locale.value);

function elegir(codigo) {
  if (codigo !== activo.value) setLocale(codigo);
}
</script>

<template>
  <div class="lang-switch" role="group" :aria-label="t('a11y.langSwitch')">
    <button
      v-for="codigo in LOCALES"
      :key="codigo"
      type="button"
      class="lang-option"
      :class="{ 'is-active': activo === codigo }"
      :aria-pressed="activo === codigo"
      :aria-label="t(`lang.${codigo}`)"
      :title="t(`lang.${codigo}`)"
      :lang="codigo"
      @click="elegir(codigo)"
    >{{ t(`lang.${codigo}Short`) }}</button>
  </div>
</template>

<style scoped>
.lang-switch {
  display: inline-flex;
  align-items: center;
  border: 1px solid var(--hx-line);
  border-radius: 500px;
  overflow: hidden;
}

.lang-option {
  padding: 0 9px;
  height: 32px;
  border: 0;
  background: transparent;
  color: var(--hx-ink-faint);
  font-family: var(--hx-font-mono);
  font-size: var(--hx-fs-micro);
  font-weight: 300;
  letter-spacing: var(--hx-track-label);
  text-transform: uppercase;
  cursor: pointer;
  transition: color var(--hx-t-fast), background var(--hx-t-fast);
}

.lang-option + .lang-option { border-left: 1px solid var(--hx-line); }
.lang-option:hover { color: var(--hx-solar); background: var(--hx-solar-wash); }

.lang-option.is-active {
  color: var(--hx-solar);
  background: var(--hx-solar-wash);
}

.lang-option:focus-visible {
  outline: 1px solid var(--hx-solar);
  outline-offset: -2px;
}
</style>
