import Vue from 'vue'
import VueRouter from 'vue-router'
import VueResource from 'vue-resource'
import store from './store'
import Home from './components/Home.vue'
import StepList from './components/StepList.vue'
import Upload from './components/Upload.vue'
import Connect from './components/Connect.vue'
import Container from './components/Container.vue'
import Pipette from './components/Pipette.vue'


Vue.use(VueRouter)
Vue.use(VueResource)
Vue.component('StepList', StepList)
Vue.component('Upload', Upload)
Vue.component('Connect', Connect)

const routes = [
  { path: '/connect', component: Connect },
  { path: '/upload', component: Upload },
  { path: '*', redirect: "/connect" },
  { path: '/calibrate/:pipette/:container', component: Container },
  { path: '/calibrate/:pipette', component: Pipette }
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
