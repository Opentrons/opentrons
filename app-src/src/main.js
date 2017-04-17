import Vue from 'vue'
import VueRouter from 'vue-router'
import VueResource from 'vue-resource'
import store from './store/store'
import { getUserEmail, getUserId } from './util'
import {
  Placeable,
  CalibrateInstrument,
  App
} from './components/export'
import { loginRoute, logoutRoute } from './routes'

Vue.use(VueRouter)
Vue.use(VueResource)

const router = new VueRouter({
  routes: [
    { path: '/calibrate/:instrument', component: CalibrateInstrument },
    { path: '/calibrate/:instrument/:slot/:placeable', component: Placeable },
    loginRoute,
    logoutRoute
  ],
  mode: 'hash'
})

/* eslint-disable */
window.onload = function () {
  window.ot_dataLayer.push({userId: getUserId()})
  window.ot_dataLayer.push({userEmail: getUserEmail()})
  const app = new Vue({
    router,
    store,
    ...App
  }).$mount('#app')
}
/* eslint-enable */
