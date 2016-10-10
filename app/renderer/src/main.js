import Vue from 'vue'
import VueRouter from 'vue-router'
import VueResource from 'vue-resource'
import Store from './store'


Vue.use(VueRouter)
Vue.use(VueResource)

import Home from './components/Home.vue'
import StepList from './components/StepList.vue'
import Upload from './components/Upload.vue'
import Connect from './components/Connect.vue'


Vue.component('StepList', StepList)
Vue.component('Upload', Upload)
Vue.component('Connect', Connect)

const routes = [
  { path: '/connect', component: Connect },
  { path: '/upload', component: Upload }
]

const router = new VueRouter({
  routes
})

window.onload = function() {
  const app = new Vue({
    router,
    Store,
      ...Home
  }).$mount('#app')
}
