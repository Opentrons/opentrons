/* global describe, it */
import { expect } from 'chai'
import sinon from 'sinon'
import Placeable from 'renderer/components/Placeable.vue'
import { getRenderedVm } from '../../util.js'

function getMockStore () {
  return {
    actions: { loadProtocol: sinon.spy() },
    state: {
      tasks: [
        {
          axis: 'a',
          channels: 1,
          placeables: [
              {label: 'plate', type: ''},
              {label: 'tiprack', type: 'tiprack'}
          ]
        },
        {
          axis: 'b',
          channels: 8,
          placeables: [
              {label: 'trash', type: 'point'},
              {label: 'tiprack', type: 'tiprack'}
          ]
        }
      ]
    }
  }
}

const mockStore = getMockStore()
Placeable.methods.params = () => {
  return { 'instrument': 'a', 'placeable': 'plate' }
}
const placeable = getRenderedVm(Placeable, {}, mockStore)

describe('Placeable.vue', (done) => {
  it('correctly filters instruments and placeables', () => {
    let pipette = mockStore.state.tasks[0]
    expect(placeable.instrument()).to.equal(pipette)
    expect(placeable.placeable()).to.equal(pipette.placeables[0])
  })

  it('correctly generates a placeableImage URL based on channels', () => {
    let sanitizedType = placeable.placeable().sanitizedType
    expect(sanitizedType).to.equal('default')

    let channels = placeable.channels
    expect(channels).to.equal('single')

    let imageUrl = placeable.placeableImages(sanitizedType, channels)
    expect(typeof imageUrl).to.eq('string')
  })

  it('loads a protocol before being created if there are no tasks', () => {
    expect(mockStore.actions.loadProtocol.called).to.be.false

    let emptyStore = getMockStore()
    emptyStore.state.tasks = []
    getRenderedVm(Placeable, {}, emptyStore)
    expect(emptyStore.actions.loadProtocol.calledOnce).to.be.true
  })

  it('correctly determins its calibration point', () => {
    expect(placeable.calibrationPoint).to.equal('of the A1 well')

    let troughStore = getMockStore()
    troughStore.state.tasks[0].placeables[0].type = 'trough'
    expect(getRenderedVm(Placeable, {}, troughStore).calibrationPoint).to.equal('of the A1 slot')

    let pointStore = getMockStore()
    pointStore.state.tasks[0].placeables[0].type = 'point'
    expect(getRenderedVm(Placeable, {}, pointStore).calibrationPoint).to.equal('')

    let tiprackStore = getMockStore()
    tiprackStore.state.tasks[0].placeables[0].type = 'tiprack'
    tiprackStore.state.tasks[0].channels = 8
    expect(getRenderedVm(Placeable, {}, tiprackStore).calibrationPoint).to.equal('of the A1 row')

    let defaultStore = getMockStore()
    defaultStore.state.tasks[0].placeables[0].type = 'plate'
    defaultStore.state.tasks[0].channels = 8
    expect(getRenderedVm(Placeable, {}, defaultStore).calibrationPoint).to.equal('of the A1 row')

    let tiprackSingleStore = getMockStore()
    tiprackSingleStore.state.tasks[0].placeables[0].type = 'plate'
    expect(getRenderedVm(Placeable, {}, tiprackSingleStore).calibrationPoint).to.equal('of the A1 well')
  })
})
