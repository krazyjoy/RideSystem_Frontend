import { createApp } from 'vue'
import App from './App.vue'
import axios from 'axios'
import VueAxios from 'vue-axios'

import router from './route'
import VueSweetalert2 from 'vue-sweetalert2';
import 'sweetalert2/dist/sweetalert2.min.css';

import VueGoogleMaps from '@fawmi/vue-google-maps'

const app = createApp(App)
app.use(router)
app.use(VueAxios, axios)
app.use(VueSweetalert2)

app.use(VueGoogleMaps, {
    load:{
        key: 'AIzaSyBaad1eX3MUZ77NSTYQJvyBw0OLzipuaOo',
        libraries: "places"
    }
})
app.mount('#app')

