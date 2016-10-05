import Vue from 'vue'
import Home from './components/Home.vue'
import StepList from './components/StepList.vue'
import VueRouter from 'vue-router'

Vue.use(VueRouter)
Vue.component('StepList', StepList)

const routes = [
  // { path: '/foo', component: Foo },
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
