/* global describe, it */
import { expect } from 'chai'
import Vue from 'vue'
import Vuex from 'vuex'
import sinon from 'sinon'
import Home from 'renderer/components/Home.vue'

Vue.use(Vuex)

function getMockStore () {
  return {
    actions: { loadProtocol: sinon.spy() },
    state: {}
  }
}

const mockStore = getMockStore()

function getRenderedVm (Component, store) {
  const Ctor = Vue.extend(Component)
  const vm = new Ctor({store: new Vuex.Store(store)}).$mount()
  return vm
}

describe('Home.vue', (done) => {
  it('has 6 btn-homes', () => {
    let home = getRenderedVm(Home, mockStore)
    expect(home.$el.querySelectorAll('.btn-home').length).to.equal(6)
  })
})
