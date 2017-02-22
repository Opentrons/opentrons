import Vue from 'vue'
import VueRouter from 'vue-router'
import VueResource from 'vue-resource'
import store from './store/store'
import {
  Placeable,
  CalibrateInstrument,
  App
} from './components/export'

Vue.use(VueRouter)
Vue.use(VueResource)

const router = new VueRouter({
  routes: [
    { path: '/calibrate/:instrument', component: CalibrateInstrument },
    { path: '/calibrate/:instrument/:placeable', component: Placeable }
  ]
})

/* eslint-disable */
const __webpack_public_path__ = window.location.host
window.onload = function () {
  const app = new Vue({
    router,
    store,
    ...App
  }).$mount('#app')
}
/* eslint-enable */
