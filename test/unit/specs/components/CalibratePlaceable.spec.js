/* global describe, it */
import { expect } from 'chai'
import Vue from 'vue'
import Vuex from 'vuex'
import sinon from 'sinon'
import CalibratePlaceable from 'renderer/components/CalibratePlaceable.vue'

Vue.use(Vuex)

function getMockStore () {
  return {
    actions: {
      pickUpTip: sinon.spy(),
      dropTip: sinon.spy(),
      moveToPosition: sinon.spy(),
      calibrate: sinon.spy()
    }
  }
}

const mockStore = getMockStore()

function getRenderedVm (Component, propsData) {
  const Ctor = Vue.extend(Component)
  const vm = new Ctor({
    propsData,
    store: new Vuex.Store(mockStore)
  }).$mount()
  return vm
}

let placeable = {
  'slot': 'A1',
  'label': 'tiprack-12ml',
  'sanitizedType': 'tiprack',
  'calibrated': true
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
    let plate = JSON.parse(JSON.stringify(placeable))
    plate['sanitizedType'] = 'default'

    expect(getRenderedVm(CalibratePlaceable, {
      placeable: plate,
      instrument
    }).$el.querySelectorAll('button').length).to.equal(2)
  })

  it('disables all buttons except for save when not calibrated', () => {
    let uncalibratedPlate = JSON.parse(JSON.stringify(placeable))
    uncalibratedPlate['calibrated'] = false

    expect(getRenderedVm(CalibratePlaceable, {
      placeable: uncalibratedPlate,
      instrument
    }).$el.querySelectorAll('button.disabled').length).to.equal(3)
  })

  it('enables all buttons when calibrated', () => {
    expect(getRenderedVm(CalibratePlaceable, {
      placeable,
      instrument
    }).$el.querySelectorAll('button.disabled').length).to.equal(0)
  })

  it('calls the correct actions for each button click', () => {
    let renderedCalibratePlaceable = getRenderedVm(CalibratePlaceable, {
      placeable,
      instrument
    })

    renderedCalibratePlaceable.calibrate()
    renderedCalibratePlaceable.moveToPosition()
    renderedCalibratePlaceable.pickUpTip()
    renderedCalibratePlaceable.dropTip()

    expect(mockStore.actions.calibrate.called).to.be.true
    expect(mockStore.actions.moveToPosition.called).to.be.true
    expect(mockStore.actions.pickUpTip.called).to.be.true
    expect(mockStore.actions.dropTip.called).to.be.true
  })
})
