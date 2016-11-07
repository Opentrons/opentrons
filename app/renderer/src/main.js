import Vue from 'vue'
import VueRouter from 'vue-router'
import VueResource from 'vue-resource'
import store from './store/store'
import {
  StepList,
  Placeable,
  Instrument,
  App
} from './components/export'


Vue.use(VueRouter)
Vue.use(VueResource)

const router = new VueRouter({
  routes: [
    { path: '/calibrate/:instrument', component: Instrument },
    { path: '/calibrate/:instrument/:placeable', component: Placeable }
  ]
})

window.onload = function() {
  const app = new Vue({
    router,
    store,
    ...App
  }).$mount('#app')
}
