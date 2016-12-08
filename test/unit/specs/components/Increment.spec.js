/* global describe, it */
import { expect } from 'chai'
import sinon from 'sinon'
import Increment from 'renderer/components/Increment.vue'
import { getRenderedVm } from '../../util.js'

function getMockStore () {
  return {
    state: { currentIncrementPlaceable: 10 },
    actions: { selectIncrement: sinon.spy() }
  }
}

const mockStore = getMockStore()
const propsData = { increments: [1, 2, 5, 10] }
const protocol = getRenderedVm(Increment, propsData, mockStore)

describe('Increment.vue', (done) => {
  it('has a radio button for each increment', () => {
    expect(protocol.$el.querySelectorAll('input').length).to.equal(4)
  })

  it('correctly assigns a value and an id to each radio button', () => {
    propsData.increments.map((inc, i) => {
      let incrementSelector = protocol.$el.querySelector(`[id='${inc}']`)
      expect(parseInt(incrementSelector.value)).to.equal(inc)
    })
  })

  it('correctly determines whether an increment is active', () => {
    expect(protocol.$el.querySelector('[id="10"]').checked).to.be.true
    expect(protocol.active(10)).to.be.true
    expect(protocol.active(2)).to.be.false
  })

  it('clicking a radio button selects that increment', () => {
    let selectIncrementAction = mockStore.actions.selectIncrement
    expect(selectIncrementAction.called).to.be.false
    propsData.increments.map((inc, i) => {
      let incrementSelector = protocol.$el.querySelector(`[for='${inc}']`)
      incrementSelector.click()
      let selectArgs = selectIncrementAction.getCall(i).args.slice(-2)[0]
      expect(selectArgs.inc).to.equal(inc)
    })
  })
})
