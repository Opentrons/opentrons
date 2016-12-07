/* global describe, it */
import { expect } from 'chai'
import Vue from 'vue'
import Vuex from 'vuex'
import ProgressBar from 'renderer/components/ProgressBar.vue'

Vue.use(Vuex)

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

function getRenderedVm (Component, propsData) {
  const Ctor = Vue.extend(Component)
  return new Ctor({
    propsData,
    store: new Vuex.Store(mockStore)
  }).$mount()
}

const propsData = { increments: [1, 2, 5, 10] }
const progressBar = getRenderedVm(ProgressBar, propsData)

describe('ProgressBar.vue', (done) => {
  it('determines run percent correctly, leaving out notifications', () => {
    expect(progressBar.runPercent()).to.equal(33)
  })
})

// check run percent
// percentClass
// running
