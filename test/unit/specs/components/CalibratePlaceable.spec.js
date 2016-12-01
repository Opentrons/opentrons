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

let placeable = {
  'slot': 'A1',
  'label': 'tiprack-12ml',
  'sanitizedType': 'tiprack',
  'calibrated': false
}
let instrument = {'axis': 'a'}

describe('CalibratePlaceable.vue', (done) => {
  it('renders pick_up/drop tip if placeable is tiprack', () => {
    expect(getRenderedVm(CalibratePlaceable, {
      placeable,
      instrument
    }).$el.querySelectorAll('button').length).to.equal(4)
  })

  it('does not render tip buttons if placeable is not tiprack', () => {
    let plate = placeable
    plate['sanitizedType'] = 'default'

    expect(getRenderedVm(CalibratePlaceable, {
      placeable: plate,
      instrument
    }).$el.querySelectorAll('button').length).to.equal(2)
  })
})
