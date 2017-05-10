/* global describe, it */
import { expect } from 'chai'
import sinon from 'sinon'
import InstrumentCalibration from 'src/components/InstrumentCalibration.vue'
import { getRenderedVm } from '../../util.js'

function getMockStore () {
  return {
    actions: {
      moveToPlungerPosition: sinon.spy(),
      calibrateInstrument: sinon.spy()
    }
  }
}

let instrument = {
  axis: 'a',
  blow_out: 0,
  bottom: 0,
  channels: 8,
  drop_tip: 0,
  href: '/calibrate/a',
  label: 'p200',
  max_volume: 200,
  top: null,
  calibrated: false
}

let position = 'top'

const mockStore = getMockStore()
const propsData = { instrument, position }
let instrumentCalibration = getRenderedVm(InstrumentCalibration, propsData, mockStore)

describe('InstrumentCalibration.vue', () => {
  it('receives an instrument object as a prop', () => {
    expect(typeof instrumentCalibration.instrument).to.equal('object')
    expect(instrumentCalibration.position).to.exisit
  })
  it('renders plunger position in save and move buttons', () => {
    const saveButton = instrumentCalibration.$el.querySelector('button.save')
    const moveButton = instrumentCalibration.$el.querySelector('button.move-to')
    expect(saveButton.innerHTML).to.include('top')
    expect(moveButton.innerHTML).to.include('top')
  })

  it('disables move to button when not calibrated', () => {
    expect(instrumentCalibration.$el.querySelectorAll('button.disabled').length).to.equal(1)
  })

  it('calls the correct actions for each button click', () => {
    // const axis = instrumentCalibration.instrument.axis
    // const position = instrumentCalibration.postion

    // instrumentCalibration.calibrateInstrument(axis, position)
    // instrumentCalibration.moveToPlungerPosition(axis, position)

    // expect(mockStore.actions.calibrateInstrument.called).to.be.true
    // expect(mockStore.actions.moveToPlungerPosition.called).to.be.true
  })
})
