/* global describe, it */
import { expect } from 'chai'
import sinon from 'sinon'
import RunScreen from 'renderer/components/RunScreen.vue'
import { getRenderedVm } from '../../util.js'

function getMockStore () {
  return {
    state: {
      runLog: [
        { timestamp: 'today', description: 'some command' },
        { timestamp: 'tomorrow', description: 'other command' }
      ]
    },
    actions: { finishRun: sinon.spy() }
  }
}

const mockStore = getMockStore()
const runScreen = getRenderedVm(RunScreen, {}, mockStore)

describe('RunScreen.vue', () => {
  it('displays each command', () => {
    const runCommandSelector = runScreen.$el.querySelectorAll('.runCommand')
    const runLog = mockStore.state.runLog
    expect(runCommandSelector.length).to.equal(runLog.length)
  })

  it('has the runLog', () => {
    // expect(runScreen.$el.querySelectorAll('input').length).to.equal(4)
  })

  it('dispatches finishRun when the X is clicked', () => {
    // expect(runScreen.$el.querySelectorAll('input').length).to.equal(4)
  })
})
