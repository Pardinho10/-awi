#!/usr/bin/env node
/**
 * Verifica que los catálogos de i18n estén sincronizados.
 *
 * Controla:
 *   1. Que `es` y `en` tengan exactamente las mismas claves (ni faltantes ni
 *      sobrantes), comparando rutas anidadas (`rastro.frase`, `motivo.senal_debil`…).
 *   2. Que ningún valor sea una cadena vacía por error.
 *   3. Que los placeholders coincidan entre idiomas: si `es` usa `{n}` y `en`
 *      no, la traducción está rota aunque la clave exista.
 *
 * Uso:  node scripts/verificar-i18n.mjs
 * Sale con código 1 si encuentra problemas (sirve para CI o pre-commit).
 */

import { pathToFileURL } from 'node:url';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const AQUI = dirname(fileURLToPath(import.meta.url));
const RAIZ = resolve(AQUI, '..');

async function cargar(idioma) {
  const ruta = pathToFileURL(resolve(RAIZ, 'src/i18n', `${idioma}.js`)).href;
  const modulo = await import(ruta);
  return modulo.default ?? modulo;
}

/** Aplana { a: { b: 'x' } } → { 'a.b': 'x' }. */
function aplanar(objeto, prefijo = '', salida = {}) {
  for (const [clave, valor] of Object.entries(objeto)) {
    const ruta = prefijo ? `${prefijo}.${clave}` : clave;
    if (valor && typeof valor === 'object' && !Array.isArray(valor)) aplanar(valor, ruta, salida);
    else salida[ruta] = valor;
  }
  return salida;
}

/** Placeholders de una cadena: {n}, {nombre}, … */
function placeholders(texto) {
  if (typeof texto !== 'string') return new Set();
  return new Set([...texto.matchAll(/\{(\w+)\}/g)].map((m) => m[1]));
}

const idiomas = ['es', 'en'];
const planos = {};
for (const idioma of idiomas) planos[idioma] = aplanar(await cargar(idioma));

const errores = [];
const avisos = [];

const base = planos.es;
const baseClaves = Object.keys(base).sort();

for (const idioma of idiomas) {
  const claves = Object.keys(planos[idioma]).sort();

  for (const clave of baseClaves) {
    if (!(clave in planos[idioma])) errores.push(`${idioma}: falta la clave «${clave}»`);
  }
  for (const clave of claves) {
    if (!(clave in base)) errores.push(`${idioma}: sobra la clave «${clave}» (no está en es)`);
  }

  for (const [clave, valor] of Object.entries(planos[idioma])) {
    if (typeof valor === 'string' && valor.trim() === '') avisos.push(`${idioma}: «${clave}» está vacía`);
  }
}

// Placeholders: se comparan contra `es` (idioma de origen).
for (const clave of baseClaves) {
  const esperados = placeholders(base[clave]);
  for (const idioma of idiomas.filter((i) => i !== 'es')) {
    if (!(clave in planos[idioma])) continue;
    const actuales = placeholders(planos[idioma][clave]);
    const faltan = [...esperados].filter((p) => !actuales.has(p));
    const sobran = [...actuales].filter((p) => !esperados.has(p));
    if (faltan.length) errores.push(`${idioma}: «${clave}» no usa el placeholder {${faltan.join('}, {')}}`);
    if (sobran.length) errores.push(`${idioma}: «${clave}» agrega el placeholder {${sobran.join('}, {')}} que no existe en es`);
  }
}

const total = baseClaves.length;
console.log(`Claves: ${idiomas.map((i) => `${i}=${Object.keys(planos[i]).length}`).join(' · ')} (base es=${total})`);

for (const aviso of avisos) console.log(`AVISO  ${aviso}`);
for (const error of errores) console.log(`ERROR  ${error}`);

if (errores.length) {
  console.log(`\n${errores.length} error(es). Los catálogos no están sincronizados.`);
  process.exit(1);
}

console.log('\nCatálogos de i18n: OK');
