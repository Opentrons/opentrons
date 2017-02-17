import Vue from 'vue'
import Vuex from 'vuex'
import VueRouter from 'vue-router'

Vue.use(Vuex)
Vue.use(VueRouter)

function getRenderedVm (Component, propsData, storeData) {
  const Ctor = Vue.extend(Component)
  const store = new Vuex.Store(storeData)
  const router = new VueRouter({})
  return new Ctor({
    propsData,
    store,
    router
  }).$mount()
}

module.exports = { getRenderedVm }
