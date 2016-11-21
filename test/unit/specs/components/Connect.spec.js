import { expect } from 'chai'
import Vue from 'vue'
import Vuex from 'vuex'
import sinon from 'sinon'


Vue.use(Vuex)

// TODO: add link/comment to explain this..
const detectedPorts = ['COM1', '/dev/tty.ccu123']
const ConnectInjector = require('!!vue?inject!renderer/src/components/Connect.vue')
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

// import store from 'renderer/src/store/store'
const mockStore = {
  state: {
    is_connected: false,
    port: null
  },
  actions: {
    connect_robot: sinon.spy(),
    disconnect_robot: sinon.spy(),
  }
}


describe('Connect.vue', () => {
  it('renders with drop down', () => {
    const vm = new Vue({
      store: new Vuex.Store(mockStore),
      el: document.createElement('div'),
      render: h => h(Connect)
    }).$mount()

    let options = vm.$el.querySelectorAll('nav.connect select#connections option')
    let dropdownPorts = []
    options.forEach(el => dropdownPorts.push(el.innerHTML))
    expect(vm.$el.querySelector('nav.connect select#connections').length).to.equal(4)

    expect(/COM/.test(dropdownPorts[2])).to.be.true
    expect(/ccu/.test(dropdownPorts[3])).to.be.true
  })

  it('connects to a robot', () => {
    const vm = new Vue({
      store: new Vuex.Store(mockStore),
      el: document.createElement('div'),
      render: h => h(Connect)
    }).$mount()
    expect(vm.$store.state.is_connected).to.be.false

    let connect = vm.$children[0]
    connect.selected = detectedPorts[0]
    connect.connectToRobot()
    expect(mockStore.actions.connect_robot.called).to.be.true
  })


  it('disconnects from robot', () => {
    mockStore.state.is_connected = true
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
    expect(mockStore.actions.disconnect_robot.called).to.be.true
  })

  // it('doesnt change connected port after refresh', () => {
  //   mockStore.state.is_connected = true
  //   mockStore.state.port = detectedPorts[0]
  //
  //   const vm = new Vue({
  //     store: new Vuex.Store(mockStore),
  //     el: document.createElement('div'),
  //     render: h => h(Connect)
  //   }).$mount()
  //
  //   expect(vm.$children[0].connected).to.be.true
  //   let connect = vm.$children[0]
  //   connect.selected = detectedPorts[0]
  //   connect.refre()
  //   expect(mockStore.actions.disconnect_robot.called).to.be.true
  // })


  it('has methods for business logic', () => {
    expect(typeof Connect.methods.getPortsList).be.a.function
    expect(typeof Connect.methods.searchIfNecessary).be.a.function
    expect(typeof Connect.methods.connectRobot).be.a.function
    expect(typeof Connect.methods.disconnectRobot).be.a.function
  })
})
