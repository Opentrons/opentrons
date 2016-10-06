import Vue from 'vue'
import Home from './components/Home.vue'
import VueRouter from 'vue-router'

import StepList from './components/StepList.vue'
import Upload from './components/Upload.vue'

Vue.use(VueRouter)
Vue.component('StepList', StepList)
Vue.component('Upload', Upload)

const routes = [
  { path: '/upload', component: Upload }
  // { path: '/bar', component: Bar }
]

const router = new VueRouter({
  router: routes
})

window.onload = function() {
  const app = new Vue({
    router,
    el: "#app",
    render: h => h(Home)
  })
}
