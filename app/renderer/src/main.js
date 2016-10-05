import Vue from 'vue'
import App from './App.vue'
import VueRouter from 'vue-router'

Vue.use(VueRouter)

window.onload = function() {
  const Foo = { template: '<div><em>foo</em></div>' }
  const Bar = { template: '<div>bar</div>' }
  const Welcome = { template: 'Welcome to your OT EXPERIENCE'}

  const routes = [
    { path: '/', component: Welcome },
    { path: '/foo', component: Foo },
    { path: '/bar', component: Bar }
  ]

  const router = new VueRouter({
    routes
  })

  const app = new Vue({
    router,
    el: "#app",
    render: h => h(App)
  })
}
