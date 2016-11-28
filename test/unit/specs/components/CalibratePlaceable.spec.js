import { expect } from 'chai'
import Vue from 'vue'
import Vuex from 'vuex'
import sinon from 'sinon'

Vue.use(Vuex)

const CalibratePlaceableInjector = require('!!vue?inject!renderer/components/CalibratePlaceable.vue')
const CalibratePlaceable = CalibratePlaceableInjector({
  '../rest_api_wrapper': {
    getPortsList: function () {
      return {
        then: function () {
          return 'hi'
        }
      }
    }
  }
})

function getMockStore () {
  return {
    state: {
      is_connected: false,
      port: null
    },
    actions: {
      connect_robot: sinon.spy(),
      disconnect_robot: sinon.spy()
    }
  }
}

describe('CalibratePlaceable.vue', (done) => {
  it('renders with tiprack based on prop', () => {
    let mockStore = getMockStore()
    let placeable = {
      'slot': 'A1',
      'label': 'tiprack-12ml',
      'sanitizedType': 'tiprack'
    }
    let instrument = {'axis': 'a'}
    const vm = new Vue({
      store: new Vuex.Store(mockStore),
      el: document.createElement('div'),
      render: h => h(CalibratePlaceable),
      props: {placeable, instrument}
    }).$mount()
    console.log('************************')
    console.log(vm)
    console.log('************************')
    Vue.nextTick(() => {
      expect(vm.$el.querySelector('span').length).to.equal(1)
      done()
    })
  })
})
