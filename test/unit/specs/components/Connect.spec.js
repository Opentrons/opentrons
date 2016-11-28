import { expect } from 'chai'
import Vue from 'vue'
import Vuex from 'vuex'
import sinon from 'sinon'

Vue.use(Vuex)

const detectedPorts = ['COM1', '/dev/tty.ccu123']
const ConnectInjector = require('!!vue?inject!renderer/components/Connect.vue')
const Connect = ConnectInjector({
  '../rest_api_wrapper': {
    getPortsList: function () {
      return {
        then: function (cb) {
          return cb(detectedPorts)
        }
      }
    }
  }
})

function getMockStore () {
  return {
    state: {
      isConnected: false,
      port: null
    },
    actions: {
      connectRobot: sinon.spy(),
      disconnectRobot: sinon.spy()
    }
  }
}

describe('Connect.vue', () => {
  it('renders with drop down', () => {
    let mockStore = getMockStore()
    const vm = new Vue({
      store: new Vuex.Store(mockStore),
      el: document.createElement('div'),
      render: h => h(Connect)
    }).$mount()

    let options = vm.$el.querySelectorAll('nav.connect select#connections option')
    let dropdownPorts = []
    options.forEach(el => dropdownPorts.push(el.innerHTML))
    expect(vm.$el.querySelector('nav.connect select#connections').length).to.equal(4)
    expect(dropdownPorts[2]).to.equal(detectedPorts[0])
    expect(dropdownPorts[3]).to.equal(detectedPorts[1])
  })

  it('connects to a robot', done => {
    let mockStore = getMockStore()
    const vm = new Vue({
      store: new Vuex.Store(mockStore),
      el: document.createElement('div'),
      render: h => h(Connect)
    }).$mount()
    expect(vm.$store.state.isConnected).to.be.false

    let connect = vm.$children[0]
    connect.ports.selected = detectedPorts[0]
    connect.searchIfNecessary()
    expect(mockStore.actions.connectRobot.called).to.be.true
    mockStore.state.port = detectedPorts

    Vue.nextTick(() => {
      let selectEl = vm.$el.querySelector('select#connections')
      expect(selectEl.options[selectEl.selectedIndex].innerHTML).to.equal(detectedPorts[0])
      done()
    })
  })

  it('disconnects from robot', () => {
    let mockStore = getMockStore()
    mockStore.state.isConnected = true
    mockStore.state.port = detectedPorts[0]

    const vm = new Vue({
      store: new Vuex.Store(mockStore),
      el: document.createElement('div'),
      render: h => h(Connect)
    }).$mount()

    expect(vm.$children[0].connected).to.be.true
    let connect = vm.$children[0]
    connect.selected = detectedPorts[0]
    connect.disconnectRobot()
    expect(mockStore.actions.disconnectRobot.called).to.be.true
    mockStore.state.port = detectedPorts
    Vue.nextTick(() => {
      let selectEl = vm.$el.querySelector('select#connections')
      expect(selectEl.options[selectEl.selectedIndex].innerHTML).to.equal('Select a port')
      done()
    })
  })

  it('does not change connected port after refresh', () => {
    let mockStore = getMockStore()
    mockStore.state.isConnected = true
    mockStore.state.port = detectedPorts[0]

    const vm = new Vue({
      store: new Vuex.Store(mockStore),
      el: document.createElement('div'),
      render: h => h(Connect)
    }).$mount()
    expect(vm.$children[0].connected).to.be.true

    let connect = vm.$children[0]
    connect.selected = detectedPorts[0]
    connect.searchIfNecessary()
    expect(mockStore.actions.disconnectRobot.called).to.be.true
  })

  it('has methods for business logic', () => {
    expect(typeof Connect.methods.getPortsList).be.a.function
    expect(typeof Connect.methods.searchIfNecessary).be.a.function
    expect(typeof Connect.methods.connectRobot).be.a.function
    expect(typeof Connect.methods.disconnectRobot).be.a.function
  })
})
