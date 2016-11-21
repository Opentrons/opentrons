import { expect } from 'chai'
import Vue from 'vue'
import Vuex from 'vuex'


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
    },
    connectToRobot: function () {
      console.log('connecToRobot called')
      return {
        then: function (cb) {
          return cb()
        }
      }
    }
  }
})


// import store from 'renderer/src/store/store'

import sinon from 'sinon'

Vue.use(Vuex)


const mockedStore = {
  state: {
    is_connected: false,
    port: null,
  },
  actions: {
    connect_robot: new sinon.spy(),
    disconnect_robot: new sinon.spy(),
  }

}


describe('Connect Component', () => {
  // TODO: Figure out how to get inject-loader to work...
  it('renders with drop down', () => {
    const vm = new Vue({
      store: new Vuex.Store(mockedStore),
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

  it('connects to a robot', done => {
    // console.log(Connect.__file)
    // console.log(Object.keys(Connect))
    // console.log(Connect.store)

    // Connect.methods.connectToRobot()
    const vm = new Vue({
      // store: store,
      store: new Vuex.Store(mockedStore),
      el: document.createElement('div'),
      render: h => h(Connect)
    }).$mount()

    console.log(Connect.data())
    Connect.methods.searchIfNecessary()

    Vue.nextTick(() => {
      console.log(vm.$el)
      expect(vm.$store.state.is_connected).to.be.true
      done()
    })

    //
    // // vm.$store.state.selected = detectedPorts[0]
    // // console.log(Object.keys(vm))
    // // vm.methods.connectToRobot()
    // expect(vm.$store.state.is_connected).to.be.true
  })


  it('has methods for business logic', () => {
    expect(typeof Connect.methods.getPortsList).be.a.function
    expect(typeof Connect.methods.searchIfNecessary).be.a.function
    expect(typeof Connect.methods.connectRobot).be.a.function
    expect(typeof Connect.methods.disconnectRobot).be.a.function
  })
})
