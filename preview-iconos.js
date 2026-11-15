import { createApp, h } from 'vue';
import IconoNawi from './src/components/IconoNawi.vue';

const NOMBRES = [
  'ojo', 'ayuda', 'estrellas', 'buscar', 'flecha-externa', 'check', 'compartir',
  'regla', 'mira', 'diagonal', 'alerta', 'espera', 'agua', 'historial', 'comparar',
  'sin-camara', 'info', 'check-circulo', 'anterior', 'siguiente', 'zoom', 'pulso',
  'reproducir', 'pausa', 'luna', 'sol', 'pixel',
];

const TAMANOS = [16, 24, 40];

function fila(nombre) {
  return h('div', { class: 'fila' }, [
    h('span', { class: 'nom' }, nombre),
    ...TAMANOS.flatMap((t) => [
      h('span', { class: 'celda' }, [h(IconoNawi, { nombre, tamano: t })]),
      h('span', { class: 'px' }, `${t}`),
    ]),
  ]);
}

function panel(titulo, clase) {
  return h('section', { class: `panel ${clase}` }, [
    h('h2', titulo),
    h('div', { class: 'fila cabecera' }, [
      h('span', { class: 'nom' }, 'icono'),
      ...TAMANOS.flatMap((t) => [h('span', { class: 'celda' }, 'icono'), h('span', { class: 'px' }, `${t}px`)]),
    ]),
    ...NOMBRES.map(fila),
    h('div', { class: 'muestra', id: 'accesibilidad' }, [
      h('span', {}, 'a11y:'),
      h(IconoNawi, { nombre: 'info', id: 'ico-etiqueta', etiqueta: 'Más información' }),
      h(IconoNawi, { nombre: 'alerta', id: 'ico-aria', 'aria-label': 'Advertencia' }),
      h(IconoNawi, { nombre: 'check', id: 'ico-deco' }),
      h('span', {}, '← deco / etiqueta / aria-label'),
    ]),
    h('div', { class: 'muestra' }, [
      h('span', {}, 'En contexto:'),
      h('button', { class: 'btn' }, [h(IconoNawi, { nombre: 'compartir', tamano: 16 }), ' Compartir']),
      h('button', { class: 'btn suave' }, [h(IconoNawi, { nombre: 'alerta', tamano: 16 }), ' Advertencia']),
      h('button', { class: 'btn suave' }, [h(IconoNawi, { nombre: 'luna', tamano: 16 }), ' Modo oscuro']),
      h('button', { class: 'btn chico' }, [h(IconoNawi, { nombre: 'zoom', tamano: 16 })]),
      h('button', { class: 'btn chico' }, [h(IconoNawi, { nombre: 'siguiente', tamano: 16 })]),
    ]),
  ]);
}

createApp({
  render: () => h('main', {}, [
    panel('Fondo oscuro · #07080F · color #E8E6E1', 'oscuro'),
    panel('Fondo claro · #F1F2F7 · color #16181F', 'claro'),
  ]),
}).mount('#app');
