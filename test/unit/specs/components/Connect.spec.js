import { expect } from 'chai'
import Vue from 'vue'

// TODO: add link/comment to explain this..
const detectedPorts = ['COM1', '/dev/tty.ccu123']
const ConnectInjector = require('!!vue?inject!renderer/src/components/Connect.vue')
const Connect = ConnectInjector({
  '../rest_api_wrapper': {
    getPortsList: function () {
      return {
        then: function (cb) {
          console.log(arguments)
          return cb(detectedPorts)
        }
      }
    }
  }
})

import store from 'renderer/src/store/store'


describe('Connect Component', () => {
  // TODO: Figure out how to get inject-loader to work...
  it('renders with drop down', () => {
    const vm = new Vue({
      store: store,
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

  it('has methods for business logic', () => {
    expect(typeof Connect.methods.getPortsList).be.a.function
    expect(typeof Connect.methods.searchIfNecessary).be.a.function
    expect(typeof Connect.methods.connectRobot).be.a.function
    expect(typeof Connect.methods.disconnectRobot).be.a.function
  })
})
