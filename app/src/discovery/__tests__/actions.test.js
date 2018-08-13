// discovery actions test
import configureMockStore from 'redux-mock-store'
import thunk from 'redux-thunk'

import {startDiscovery} from '..'

const middlewares = [thunk]
const mockStore = configureMockStore(middlewares)

describe('discovery actions', () => {
  let store

  beforeEach(() => {
    jest.useFakeTimers()
    store = mockStore({config: {discovery: {enabled: true}}})
  })

  afterEach(() => {
    jest.clearAllTimers()
    jest.useRealTimers()
  })

  test('startDiscovery', () => {
    const expectedTimeout = 30000
    const expectedStart = {type: 'discovery:START', meta: {shell: true}}
    const expectedFinish = {type: 'discovery:FINISH', meta: {shell: true}}

    store.dispatch(startDiscovery())
    expect(store.getActions()).toEqual([expectedStart])
    jest.runTimersToTime(expectedTimeout)
    expect(store.getActions()).toEqual([expectedStart, expectedFinish])
  })

  // TODO(mc, 2018-08-10): legacy discovery support; remove
  test('startDiscovery with discovery disabled', () => {
    store = mockStore({config: {discovery: {enabled: false}}})

    const expectedStart = {
      type: 'robot:DISCOVER',
      meta: {robotCommand: true}
    }

    store.dispatch(startDiscovery())
    expect(store.getActions()).toEqual([expectedStart])
  })
})
