import { expect } from 'chai'

// TODO: Figure out how to get inject-loader to work...
const ConnectInjector = require('!!vue?inject!renderer/src/components/Connect.vue')
const ConnectMock = ConnectInjector({
  '../rest_api_wrapper': {}
})


describe('Connect Component', () => {
  // TODO: Figure out how to get inject-loader to work...
  // it('renders with drop down', () => {
  //    const vm = new Vue(ConnectMock).$mount()
  // })

  it('has methods for business logic', () => {
    expect(typeof ConnectComponent.methods.getPortsList).be.a.function
    expect(typeof ConnectComponent.methods.searchIfNecessary).be.a.function
    expect(typeof ConnectComponent.methods.connectRobot).be.a.function
    expect(typeof ConnectComponent.methods.disconnectRobot).be.a.function
  })
})
