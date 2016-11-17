import { expect } from 'chai'
import Vue from 'vue'

// TODO: add link/comment to explain this..
const ConnectInjector = require('!!vue?inject!renderer/src/components/Connect.vue')
const ConnectComponent = ConnectInjector({
  '../rest_api_wrapper': {
    getPortsList: function () {
      return {
        then: function () {
          return ['COM1', '/dev/tty.ccu123']
        }
      }
    }
  }
})


describe('Connect Component', () => {
  // TODO: Figure out how to get inject-loader to work...
  it('renders with drop down', () => {
    const vm = new Vue(ConnectComponent).$mount()
    console.log(vm.$el)
    expect(vm.$el.querySelector('select')).to.be.true
  })

  it('has methods for business logic', () => {
    expect(typeof ConnectComponent.methods.getPortsList).be.a.function
    expect(typeof ConnectComponent.methods.searchIfNecessary).be.a.function
    expect(typeof ConnectComponent.methods.connectRobot).be.a.function
    expect(typeof ConnectComponent.methods.disconnectRobot).be.a.function
  })
})
