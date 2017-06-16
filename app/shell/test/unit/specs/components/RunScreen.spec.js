/* global describe, it */
import { expect } from 'chai'
import sinon from 'sinon'
import RunScreen from 'renderer/components/RunScreen.vue'
import { getRenderedVm } from '../../util.js'

function getMockStore () {
  return {
    state: {
      runLog: [
        { timestamp: 'today', command_description: 'some command' },
        { timestamp: 'tomorrow', command_description: 'other command' }
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
    const firstCommand = 'today - some command'
    const secondCommand = 'tomorrow - other command'
    expect(runCommandSelector[0].textContent.trim()).to.equal(firstCommand)
    expect(runCommandSelector[1].textContent.trim()).to.equal(secondCommand)
  })

  it('has the runLog', () => {
    expect(runScreen.runLog()).to.equal(mockStore.state.runLog)
  })

  it('dispatches finishRun when the X is clicked', () => {
    const exitSelector = runScreen.$el.querySelector('#exit')
    exitSelector.click()
    expect(mockStore.actions.finishRun.calledOnce).to.be.true
  })
})
