/* global describe, it */
import { expect } from 'chai'
import sinon from 'sinon'
import Modal from 'src/components/Modal.vue'
import { getRenderedVm } from '../../util.js'

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

let placeable = {
  'slot': 'A1',
  'label': 'tiprack-12ml',
  'sanitizedType': 'tiprack',
  'calibrated': true
}
let instrument = {'axis': 'a', 'channels': 1}

const mockStore = getMockStore()
const propsData = { placeable, instrument }
let modal = getRenderedVm(Modal, propsData, mockStore)

describe('modal', () => {
  it('receives a placeable and intrument objects as a props', () => {
    expect(typeof modal.placeable).to.equal('object')
    expect(modal.instrument).to.exisit
  })

  it('correctly generates a placeableImage URL based on channels', () => {
    let sanitizedType = placeable.sanitizedType
    expect(sanitizedType).to.equal('tiprack')

    let channels = modal.channels
    expect(channels).to.equal('single')

    let imageUrl = modal.placeableImages(sanitizedType, channels)
    expect(typeof imageUrl).to.eq('string')
  })
})
