import Vue from 'vue'
import VueRouter from 'vue-router'
import VueResource from 'vue-resource'
import store from './store/store'
import {
  Home,
  Upload,
  Connect,
  Placeable,
  Instrument,
  Run
} from './components/export'


Vue.use(VueRouter)
Vue.use(VueResource)

const routes = [
  { path: '/connect', component: Connect },
  { path: '/upload', component: Upload },
  { path: '/calibrate/:instrument', component: Instrument },
  { path: '/calibrate/:instrument/:placeable', component: Placeable },
  { path: '/run', component: Run },
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
