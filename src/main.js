import { createApp } from 'vue';

/* Helios entra ANTES que styles.css a propósito.
   Las dos hojas tienen especificidad parecida, así que el orden del bundle
   decide quién gana. El CSS viejo se está retirando por fases: mientras
   convivan, el que debe imponerse es el de styles.css. Cuando la migración
   termine, Helios pasa a ser el último.

   Bootstrap y bootstrap-icons ya no se cargan: la grilla del workspace pasó a
   un grid propio y los 28 iconos son SVG de IconoNawi. */
import './styles/helios/helios-tokens.css';

import './styles.css';
import './styles/helios/helios-base.css';

/* Variante clara derivada de Helios. Va después de la base porque incluye
   parches para los valores rgba hardcodeados de helios-base.css. */
import './styles/helios/helios-tokens-light.css';

/* Capa propia de Ñawi: traduce la interfaz al lenguaje de Helios.
   Va al final porque es la que debe ganar mientras styles.css siga vivo. */
import './styles/nawi.css';

/* Comportamiento opcional de Helios (reveal al hacer scroll, estado del nav,
   cursor). Sólo actúa si existe un elemento con la clase `hx-theme`, así que
   cargarlo ahora no cambia nada hasta que la migración lo active. */
import './styles/helios/helios.js';

import App from './App.vue';

createApp(App).mount('#root');
