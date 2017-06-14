import Vue from 'vue'
import Vuex from 'vuex'
import VueRouter from 'vue-router'

Vue.use(Vuex)
Vue.use(VueRouter)

function getRenderedVm (Component, propsData, storeData, store, router) {
  const Ctor = Vue.extend(Component)
  return new Ctor({
    propsData,
    store: store || new Vuex.Store(storeData),
    router: router || new VueRouter({})
  }).$mount()
}

module.exports = { getRenderedVm }
