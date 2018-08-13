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
    store = mockStore({})
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
})
