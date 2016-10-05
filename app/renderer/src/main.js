import Vue from 'vue'
import App from './App.vue'

window.onload = function() {
  const app = new Vue({
    el: "#app",
    render: h => h(App)
  })
}
