import Vue from 'vue'
import VueRouter from 'vue-router'
import VueResource from 'vue-resource'
import store from './store'
import {Home, StepList, Upload, Connect, Container, Pipette} from './components/export.js'


Vue.use(VueRouter)
Vue.use(VueResource)
Vue.component('StepList', StepList)
Vue.component('Upload', Upload)
Vue.component('Connect', Connect)

const routes = [
  { path: '/connect', component: Connect },
  { path: '/upload', component: Upload },
  { path: '/calibrate/:pipette/:container', component: Container },
  { path: '/calibrate/:pipette', component: Pipette },
  { path: '*', redirect: "/connect" },
]

const router = new VueRouter({
  routes
})

window.onload = function() {
  const app = new Vue({
    router,
    store,
    ...Home
  }).$mount('#app')
}
