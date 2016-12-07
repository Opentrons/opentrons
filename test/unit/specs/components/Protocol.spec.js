/* global describe, it */
import { expect } from 'chai'
import Vue from 'vue'
import Vuex from 'vuex'
import Protocol from 'renderer/components/Protocol.vue'

Vue.use(Vuex)

function getMockStore () {
  return {
    state: {
      fileName: 'someProtocol.py',
      lastModified: '12/7/16'
    }
  }
}

function getRenderedVm (Component, store) {
  const Ctor = Vue.extend(Component)
  return new Ctor({store: new Vuex.Store(store)}).$mount()
}

const mockStore = getMockStore()
const protocol = getRenderedVm(Protocol, mockStore)

describe('Protocol.vue', (done) => {
  it('has 2 titles and 2 infos', () => {
    expect(protocol.$el.querySelectorAll('.title').length).to.equal(2)
    expect(protocol.$el.querySelectorAll('.info').length).to.equal(2)
  })

  it('renders fileName and lastModified', () => {
    let infoSelector = protocol.$el.querySelectorAll('.info')
    expect(infoSelector[0].textContent).to.equal(mockStore.state.fileName)
    expect(infoSelector[1].textContent).to.equal(mockStore.state.lastModified)
  })
})
