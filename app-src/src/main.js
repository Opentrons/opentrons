import Vue from 'vue'
import VueRouter from 'vue-router'
import VueResource from 'vue-resource'
import store from './store/store'
import { getUserId } from './util'
import {
  TaskView,
  WelcomeView,
  App
} from './components/export'
import { loginRoute, logoutRoute } from './login-routes'

Vue.use(VueRouter)
Vue.use(VueResource)

const router = new VueRouter({
  routes: [
    { name: 'welcome', path: '/', component: WelcomeView },
    { name: 'instrument', path: '/calibrate/:instrument', component: TaskView },
    { name: 'placeable', path: '/calibrate/:instrument/:slot/:placeable', component: TaskView }
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
