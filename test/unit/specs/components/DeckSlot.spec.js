/* global describe, it */
import { expect } from 'chai'
import Vue from 'vue'
import sinon from 'sinon'
import DeckSlot from 'renderer/components/DeckSlot.vue'
import { getRenderedVm } from '../../util.js'

function getMockStore () {
  return {
    state: {
      versions: {
        ot_version: {
          version: 'hood'
        }
      }
    },
    actions: { jogToSlot: sinon.spy() }
  }
}

const mockStore = getMockStore()
const propsData = { busy: false }
const deckSlot = getRenderedVm(DeckSlot, propsData, mockStore)

describe('DeckSlot.vue', (done) => {
  it('renders each slot', () => {
    const slotsLength = deckSlot.slots().length
    expect(deckSlot.$el.querySelectorAll('button').length).to.equal(slotsLength)
  })

  it('dispatches a jogToSlot action when a slot is clicked', () => {
    expect(mockStore.actions.jogToSlot.called).to.be.false
    let buttons = [].slice.call(deckSlot.$el.querySelectorAll('button'))
    buttons.map((button, i) => {
      button.click()
      let jogArgs = mockStore.actions.jogToSlot.getCall(i).args.slice(-2)[0]
      expect(jogArgs.slot).to.equal(button.textContent.trim())
    })
    expect(mockStore.actions.jogToSlot.callCount).to.equal(10)
  })

  it('disables buttons when passed a busy prop', () => {
    expect(deckSlot.$el.querySelectorAll('.disabled').length).to.equal(0)
    const busyProp = { busy: true }
    const busyDeckSlot = getRenderedVm(DeckSlot, busyProp, mockStore)
    Vue.nextTick(() => {
      expect(busyDeckSlot.$el.querySelectorAll('.disabled').length).to.equal(1)
    })
  })

  it('has 15 slots when the robot version is not a hood', () => {
    let proStore = getMockStore()
    proStore.state.versions.ot_version.version = 'pro'
    const proDeckSlot = getRenderedVm(DeckSlot, propsData, proStore)
    expect(proDeckSlot.$el.querySelectorAll('button').length).to.equal(15)
    expect(proDeckSlot.slots().length).to.equal(15)
  })
})
