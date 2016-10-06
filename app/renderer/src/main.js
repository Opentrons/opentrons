import Vue from 'vue'
import Home from './components/Home.vue'
import VueRouter from 'vue-router'

import StepList from './components/StepList.vue'
import Upload from './components/Upload.vue'
import Connect from './components/Connect.vue'

Vue.use(VueRouter)
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
      ...Home
  }).$mount('#app')
}
