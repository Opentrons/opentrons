/* global describe, it */
import { expect } from 'chai'
import Vue from 'vue'
import Vuex from 'vuex'
import sinon from 'sinon'
import DeckSlot from 'renderer/components/DeckSlot.vue'

Vue.use(Vuex)

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

function getRenderedVm (Component, propsData, store) {
  const Ctor = Vue.extend(Component)
  return new Ctor({
    propsData,
    store: new Vuex.Store(store)
  }).$mount()
}

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
      expect(jogArgs.slot).to.equal(button.innerHTML.trim())
    })
    expect(mockStore.actions.jogToSlot.callCount).to.equal(10)
  })

  it('disables buttons when passed a busy prop', () => {
    // expect(deckSlot.percentClass()).to.equal('width:33%;')
  })

  it('has 15 slots when the robot version is not a hood', () => {
    // expect(deckSlot.percentClass()).to.equal('width:33%;')
  })
})
