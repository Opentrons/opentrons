import Vue from 'vue'
import VueRouter from 'vue-router'
import VueResource from 'vue-resource'
import store from './store/store'
import {
  PlaceableView,
  InstrumentView,
  App
} from './components/export'

Vue.use(VueRouter)
Vue.use(VueResource)

const router = new VueRouter({
  routes: [
    { name: 'instrument', path: '/calibrate/:instrument', component: InstrumentView },
    { name: 'placeable', path: '/calibrate/:instrument/:slot/:placeable', component: PlaceableView }
  ],
  mode: 'history'
})

/* eslint-disable */
window.onload = function () {
  // Google analytics SPA extensions: https://github.com/googleanalytics/autotrack
  require('autotrack')
  window.ga('require', 'eventTracker')
  window.ga('require', 'outboundLinkTracker')
  window.ga('require', 'urlChangeTracker')

  const app = new Vue({
    router,
    store,
    ...App
  }).$mount('#app')
}
/* eslint-enable */
