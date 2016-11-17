import { expect } from 'chai'

import Vue from 'vue'
import VueRouter from 'vue-router'

import Home from 'renderer/src/components/Home.vue'
import store from 'renderer/src/store/store'


import {
  CalibratePlaceable,
  CalibrateInstrument,
  App
} from 'renderer/src/components/export'

Vue.use(VueRouter)

const router = new VueRouter({
  routes: [
    { path: '/calibrate/:instrument', component: CalibrateInstrument },
    { path: '/calibrate/:instrument/:placeable', component: CalibratePlaceable }
  ]
})

describe('Home.vue', () => {
  it('should render home page child nodes', () => {
    const vm = new Vue({
      template: '<div><home></home></div>',
      ...Home
    }).$mount()
    console.log('what is el', typeof vm.$el)
    console.log(vm.$el.querySelector)
    console.log(vm.$el.querySelector('nav'))

    // expect(vm.$el.querySelector('nav').hasChildNodes()).to.equal(true)
    // expect(vm.$el.querySelector('nav').textContent).to.equal('Home: ')
  })
})
