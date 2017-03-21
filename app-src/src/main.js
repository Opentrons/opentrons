import Vue from 'vue'
import VueRouter from 'vue-router'
import VueResource from 'vue-resource'
import store from './store/store'
import {
  Placeable,
  CalibrateInstrument,
  App
} from './components/export'

Vue.use(VueRouter)
Vue.use(VueResource)

const router = new VueRouter({
  routes: [
    { path: '/calibrate/:instrument', component: CalibrateInstrument },
    { path: '/calibrate/:instrument/:slot/:placeable', component: Placeable }
  ],
  mode: 'history'
})

console.log('got herboooo')

/* eslint-disable */
window.onload = function () {
  // Google analytics SPA extensions: https://github.com/googleanalytics/autotrack
  require('autotrack')
  window.ga('require', 'eventTracker')
  window.ga('require', 'outboundLinkTracker')
  window.ga('require', 'urlChangeTracker')
  // window.Intercom("boot", {
  //   app_id: "bsgvg3q7"
  // });
    //
  console.log('got here...')
  window.Intercom("boot", {
      app_id: "bsgvg3q7",
      name: "Jane Doe", // Full name
      email: "customer@example.com", // Email address
      created_at: 1312182000 // Signup date as a Unix timestamp
  });

  const app = new Vue({
    router,
    store,
    ...App
  }).$mount('#app')
}
/* eslint-enable */
