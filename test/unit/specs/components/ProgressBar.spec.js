/* global describe, it */
import { expect } from 'chai'
import ProgressBar from 'renderer/components/ProgressBar.vue'
import { getRenderedVm } from '../../util.js'

function getMockStore () {
  return {
    state: {
      runLog: [
        {'notification': false},
        {'notification': true}
      ],
      runLength: 3,
      running: false,
      protocolFinished: true
    }
  }
}

const mockStore = getMockStore()
const propsData = { increments: [1, 2, 5, 10] }
const progressBar = getRenderedVm(ProgressBar, propsData, mockStore)

describe('ProgressBar.vue', (done) => {
  it('determines run percent correctly, leaving out notifications', () => {
    expect(progressBar.runPercent()).to.equal(33)
  })

  it('determines percent class correctly', () => {
    expect(progressBar.percentClass()).to.equal('width:33%;')
  })

  it('determines whether it is running correctly', () => {
    expect(progressBar.running()).to.be.true

    let finishedStore = getMockStore()
    finishedStore.state.protocolFinished = false
    const newProgressBar = getRenderedVm(ProgressBar, propsData, finishedStore)
    expect(newProgressBar.running()).to.be.false

    let unfinishedStore = getMockStore()
    unfinishedStore.state.running = true
    const unfinishedBar = getRenderedVm(ProgressBar, propsData, unfinishedStore)
    expect(unfinishedBar.running()).to.be.true
  })
})
