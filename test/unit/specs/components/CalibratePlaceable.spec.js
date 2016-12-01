/* global describe, it */
import { expect } from 'chai'
import Vue from 'vue'
import Vuex from 'vuex'
// import sinon from 'sinon'
import CalibratePlaceable from 'renderer/components/CalibratePlaceable.vue'
// const CalibratePlaceableInjector = require('!!vue?inject!renderer/components/CalibratePlaceable.vue')

Vue.use(Vuex)

// function getMockStore () {
//   return {
//     actions: {
//       pickUpTip: sinon.spy(),
//       dropTip: sinon.spy(),
//       moveToPosition: sinon.spy(),
//       calibrate: sinon.spy()
//     }
//   }
// }

describe('CalibratePlaceable.vue', (done) => {
  it('renders with tiprack based on prop', () => {
    // let mockStore = getMockStore()
    let placeable = {
      'slot': 'A1',
      'label': 'tiprack-12ml',
      'sanitizedType': 'tiprack',
      'calibrated': false
    }
    let instrument = {'axis': 'a'}

    function getRenderedText (Component, propsData) {
      const Ctor = Vue.extend(Component)
      const vm = new Ctor({ propsData }).$mount()
      return vm.$el.textContent
    }

    // const vm = new Vue({
    //   // store: new Vuex.Store(mockStore),
    //   el: document.createElement('div'),
    //   render: h => h(CalibratePlaceable)
    // }).$mount()

    // console.log(vm)

    // expect(vm.$el.querySelector('button').length).to.equal('foo')
    expect(getRenderedText(CalibratePlaceable, {
      placeable,
      instrument
    })).to.equal('Hello')
  })
})
