/* global describe, it */
import { expect } from 'chai'
import Vue from 'vue'
import Vuex from 'vuex'
import VueRouter from 'vue-router'
import sinon from 'sinon'
import { getRenderedVm } from '../../util'

Vue.use(Vuex)

const detectedPorts = ['COM1', '/dev/tty.ccu123']
const ConnectInjector = require('!!vue?inject!src/components/Connect.vue')
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

function getMockRouter () {
  return new VueRouter({
    routes: [
      {path: '/login'},
      {path: '/logout'}
    ],
    mode: 'hash'
  })
}

describe('Connect.vue', () => {
  it('renders with drop down', () => {
    let mockStoreData = getMockStore()
    const connect = getRenderedVm(Connect, null, mockStoreData)

    let options = connect.$el.querySelectorAll('nav.connect select#connections option')
    let dropdownPorts = []
    options.forEach(el => dropdownPorts.push(el.textContent))
    expect(connect.$el.querySelector('nav.connect select#connections').length).to.equal(4)
    expect(dropdownPorts[2]).to.equal(detectedPorts[0])
    expect(dropdownPorts[3]).to.equal(detectedPorts[1])
  })

  it('connects to a robot', done => {
    let mockStoreData = getMockStore()
    const connect = getRenderedVm(Connect, null, mockStoreData)

    expect(connect.$store.state.isConnected).to.be.false

    connect.ports.selected = detectedPorts[0]
    connect.searchIfNecessary()
    expect(mockStoreData.actions.connectRobot.called).to.be.true
    mockStoreData.state.port = detectedPorts

    Vue.nextTick(() => {
      let selectEl = connect.$el.querySelector('select#connections')
      expect(selectEl.options[selectEl.selectedIndex].textContent).to.equal(detectedPorts[0])
      done()
    })
  })

  it('disconnects from robot', done => {
    let mockStoreData = getMockStore()
    mockStoreData.state.isConnected = true
    mockStoreData.state.port = detectedPorts[0]

    const connect = getRenderedVm(Connect, null, mockStoreData)

    expect(connect.connected).to.be.true
    connect.selected = detectedPorts[0]
    connect.disconnectRobot()
    expect(mockStoreData.actions.disconnectRobot.called).to.be.true
    mockStoreData.state.port = null
    mockStoreData.state.isConnected = false

    // Ensure that HTML is rendered correctly after state is updated after disconnect
    Vue.nextTick(() => {
      let selectEl = connect.$el.querySelector('select#connections')
      let msg = 'Select a port'
      expect(selectEl.options[selectEl.selectedIndex].textContent).to.equal(msg)
      expect(selectEl.options[selectEl.selectedIndex].textContent).to.equal('Select a port')
      done()
    })
  })

  it('does not change connected port after refresh', () => {
    let mockStoreData = getMockStore()
    mockStoreData.state.isConnected = true
    mockStoreData.state.port = detectedPorts[0]

    const connect = getRenderedVm(Connect, null, mockStoreData)
    expect(connect.connected).to.be.true

    connect.selected = detectedPorts[0]
    connect.searchIfNecessary()
    expect(mockStoreData.actions.disconnectRobot.called).to.be.true
  })

  it('redirects to login route when login button is clicked', () => {
    let mockStore = getMockStore()
    let mockRouter = getMockRouter()
    const connect = getRenderedVm(Connect, null, null, mockStore, mockRouter)

    connect.login()
    expect(connect.$router.currentRoute.path).to.equal('/login')
    connect.logout()
    expect(connect.$router.currentRoute.path).to.equal('/logout')
  })

  it('has methods for business logic', () => {
    expect(typeof Connect.methods.getPortsList).be.a.function
    expect(typeof Connect.methods.searchIfNecessary).be.a.function
    expect(typeof Connect.methods.connectRobot).be.a.function
    expect(typeof Connect.methods.disconnectRobot).be.a.function
    expect(typeof Connect.methods.login).be.a.function
  })
})
