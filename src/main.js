import { createApp } from 'vue';

/* Helios entra ANTES que Bootstrap y que styles.css a propósito.
   Las tres hojas tienen especificidad parecida, así que el orden del bundle
   decide quién gana. El CSS del proyecto se está retirando por fases: mientras
   convivan, el que debe imponerse es el de styles.css, por eso va al final.
   Cuando la migración termine, Helios pasa a ser el último. */
import './styles/helios/helios-tokens.css';

import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import './styles.css';
import './styles/helios/helios-base.css';

/* Capa propia de Ñawi: traduce la interfaz al lenguaje de Helios.
   Va al final porque es la que debe ganar mientras styles.css siga vivo. */
import './styles/nawi.css';

/* Comportamiento opcional de Helios (reveal al hacer scroll, estado del nav,
   cursor). Sólo actúa si existe un elemento con la clase `hx-theme`, así que
   cargarlo ahora no cambia nada hasta que la migración lo active. */
import './styles/helios/helios.js';

import App from './App.vue';

createApp(App).mount('#root');
