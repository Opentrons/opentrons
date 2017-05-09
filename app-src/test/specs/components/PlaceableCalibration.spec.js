/* global describe, it */
import { expect } from 'chai'
import sinon from 'sinon'
import PlaceableCalibration from 'src/components/PlaceableCalibration.vue'
import { getRenderedVm } from '../../util.js'

function getMockStore () {
  return {
    actions: {
      moveToPosition: sinon.spy(),
      calibrate: sinon.spy()
    }
  }
}

let placeable = {
  'slot': 'A1',
  'label': 'tiprack-12ml',
  'sanitizedType': 'tiprack',
  instruments: [
    {
      label: 'p200',
      axis: 'a',
      calibrated: false
    }
  ]
}
let instrument = {'axis': 'a'}

const mockStore = getMockStore()
const propsData = { placeable, instrument }
let placeableCalibration = getRenderedVm(PlaceableCalibration, propsData, mockStore)

describe('PlaceableCalibration.vue', () => {
  it('renders container name in save button', () => {
    // expect(buttons.length).to.equal(2)
    const button = placeableCalibration.$el.querySelector('button.save')
    expect(button.innerHTML).to.include('tiprack-12ml')
  })

  it('disables move to button when not calibrated', () => {
    let uncalibratedPlate = JSON.parse(JSON.stringify(placeable))
    uncalibratedPlate.instruments[0]['calibrated'] = false

    expect(getRenderedVm(PlaceableCalibration, {
      placeable: uncalibratedPlate,
      instrument
    }).$el.querySelectorAll('button.disabled').length).to.equal(1)
  })

  it('calls the correct actions for each button click', () => {
    placeableCalibration.calibrate()
    placeableCalibration.moveToPosition()

    expect(mockStore.actions.calibrate.called).to.be.true
    expect(mockStore.actions.moveToPosition.called).to.be.true
    
  })
})
