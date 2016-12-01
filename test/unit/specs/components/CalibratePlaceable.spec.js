/* global describe, it */
import { expect } from 'chai'
import Vue from 'vue'
import Vuex from 'vuex'
// import sinon from 'sinon'
import CalibratePlaceable from 'renderer/components/CalibratePlaceable.vue'

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

function getRenderedVm (Component, propsData) {
  const Ctor = Vue.extend(Component)
  const vm = new Ctor({ propsData }).$mount()
  return vm
}

describe('CalibratePlaceable.vue', (done) => {
  it('renders with tiprack based on prop', () => {
    let placeable = {
      'slot': 'A1',
      'label': 'tiprack-12ml',
      'sanitizedType': 'tiprack',
      'calibrated': false
    }
    let instrument = {'axis': 'a'}

    expect(getRenderedVm(CalibratePlaceable, {
      placeable,
      instrument
    }).$el.querySelectorAll('button').length).to.equal(4)

    let plate = placeable
    plate['sanitizedType'] = 'default'

    console.log(getRenderedVm(CalibratePlaceable, {
      placeable: plate,
      instrument
    }).placeable)

    expect(getRenderedVm(CalibratePlaceable, {
      placeable: plate,
      instrument
    }).$el.querySelectorAll('button').length).to.equal(2)
  })
})
