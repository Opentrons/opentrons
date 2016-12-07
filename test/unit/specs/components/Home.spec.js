/* global describe, it */
import { expect } from 'chai'
import Vue from 'vue'
import Vuex from 'vuex'
import sinon from 'sinon'
import Home from 'renderer/components/Home.vue'

Vue.use(Vuex)

function getMockStore () {
  return {
    actions: { home: sinon.spy() }
  }
}

const mockStore = getMockStore()
const home = getRenderedVm(Home, mockStore)

function getRenderedVm (Component, store) {
  const Ctor = Vue.extend(Component)
  const vm = new Ctor({store: new Vuex.Store(store)}).$mount()
  return vm
}

describe('Home.vue', (done) => {
  it('has 6 btn-home classes', () => {
    expect(home.$el.querySelectorAll('.btn-home').length).to.equal(6)
  })

  it('has each button send a home dispatch with the correct axis', () => {
    let buttons = [].slice.call(home.$el.querySelectorAll('.btn-home'))
    expect(mockStore.actions.home.called).to.be.false
    buttons.map((button, i) => {
      button.click()
      let homeArgs = mockStore.actions.home.getCall(i).args.slice(-2)[0]
      expect(homeArgs.axis).to.equal(button.innerHTML.toLowerCase())
    })
    expect(mockStore.actions.home.callCount).to.equal(6)
  })
})
