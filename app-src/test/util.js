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

function renderComponentWithProps (Component, propsData, storeData, store, router) {
  var vm = new Vue({
    el: document.createElement('div'),
    router: router || new VueRouter({}),
    store: store || new Vuex.Store(storeData),
    render: h => h(Component, {props: propsData})
  }).$mount()
  return vm
}

module.exports = { getRenderedVm, renderComponentWithProps }
