import Vue from 'vue'
import VueRouter from 'vue-router'
import VueResource from 'vue-resource'
import store from './store/store'
import { getUserId } from './util'
import {
  Placeable,
  CalibrateInstrument,
  App
} from './components/export'
import { loginRoute, logoutRoute } from './login-routes'

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
  if (getUserId()) window.ot_dataLayer.push({userId: getUserId()})
  const app = new Vue({
    router,
    store,
    ...App
  }).$mount('#app')
}
/* eslint-enable */
