/**
 * i18n de Ñawi.
 *
 * Orden de resolución del idioma:
 *   1. ?lang=es|en  (enlace compartible)
 *   2. localStorage['nawi-lang']  (elección explícita)
 *   3. navigator.language: si empieza con "es" → es, si no → en
 *   4. es (idioma de origen del proyecto)
 *
 * El idioma se refleja en <html lang> (lectores de pantalla, guionado, SEO) y en
 * document.title; el del <title> estático de index.html queda como fallback.
 */

import { createI18n } from 'vue-i18n';
import es from './es.js';
import en from './en.js';

export const LOCALES = ['es', 'en'];
export const LOCALE_KEY = 'nawi-lang';
export const DEFAULT_LOCALE = 'es';

const TITLES = {
  es: 'Ñawi — Explorador SPHEREx',
  en: 'Ñawi — SPHEREx Explorer',
};

const META_DESCRIPTIONS = {
  es: 'Ñawi: explora observaciones infrarrojas de SPHEREx a través del tiempo.',
  en: 'Ñawi: explore SPHEREx infrared observations across time.',
};

/** normaliza 'es-AR' → 'es'; devuelve null si no es un idioma soportado. */
export function normalizarLocale(valor) {
  if (typeof valor !== 'string') return null;
  const base = valor.trim().toLowerCase().split(/[-_]/)[0];
  return LOCALES.includes(base) ? base : null;
}

function leerGuardado() {
  try {
    return normalizarLocale(window.localStorage.getItem(LOCALE_KEY));
  } catch {
    return null;
  }
}

function leerDeUrl() {
  try {
    return normalizarLocale(new URLSearchParams(window.location.search).get('lang'));
  } catch {
    return null;
  }
}

function leerDelNavegador() {
  try {
    const idiomas = navigator.languages?.length ? navigator.languages : [navigator.language];
    for (const idioma of idiomas) {
      const normalizado = normalizarLocale(idioma);
      if (normalizado) return normalizado;
    }
  } catch {
    /* sin navigator (SSR/tests) */
  }
  return null;
}

export function resolverLocaleInicial() {
  return leerDeUrl() ?? leerGuardado() ?? leerDelNavegador() ?? DEFAULT_LOCALE;
}

export const i18n = createI18n({
  legacy: false,
  globalInjection: false,
  locale: resolverLocaleInicial(),
  fallbackLocale: DEFAULT_LOCALE,
  messages: { es, en },
});

/** Idioma activo (ref reactivo de vue-i18n). */
export const locale = i18n.global.locale;

/** Traduce fuera de un componente (capa de datos, helpers). */
export const t = (clave, params) => i18n.global.t(clave, params ?? {});

/**
 * Cambia el idioma y propaga el efecto a <html lang>, al título y（si se pide)
 * a la URL con ?lang=, para que el enlace compartido conserve el idioma.
 */
export function setLocale(valor, { actualizarUrl = true, persistir = true } = {}) {
  const siguiente = normalizarLocale(valor);
  if (!siguiente) return locale.value;
  locale.value = siguiente;

  try {
    if (persistir) window.localStorage.setItem(LOCALE_KEY, siguiente);
    document.documentElement.setAttribute('lang', siguiente);
    document.title = TITLES[siguiente] ?? TITLES[DEFAULT_LOCALE];
    document.querySelector('meta[name="description"]')?.setAttribute('content', META_DESCRIPTIONS[siguiente]);
    if (actualizarUrl) {
      const url = new URL(window.location.href);
      url.searchParams.set('lang', siguiente);
      window.history.replaceState({}, '', url);
    }
  } catch {
    /* modo privado o sin DOM */
  }
  return siguiente;
}

/** Aplica el idioma ya resuelto (al montar la app). */
export function aplicarLocaleInicial() {
  return setLocale(locale.value, { actualizarUrl: false });
}

/** ¿El idioma activo es inglés? Atajo para el switch. */
export const esIngles = () => locale.value === 'en';
