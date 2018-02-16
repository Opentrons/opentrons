// health api tests
import configureMockStore from 'redux-mock-store'
import thunk from 'redux-thunk'

import client from '../client'
import {fetchWifiList, fetchWifiStatus, reducer, selectWifi} from '..'

jest.mock('../client')

const middlewares = [thunk]
const mockStore = configureMockStore(middlewares)

const robot = {name: 'opentrons', ip: '1.2.3.4', port: '1234'}

describe('wifi', () => {
  beforeEach(() => client.__clearMock())

  test('selectWifi returns wifi substate', () => {
    const state = {
      api: {
        wifi: {
          opentrons: {}
        }
      }
    }

    expect(selectWifi(state)).toBe(state.api.wifi)
  })

  describe('fetchWifiList action creator', () => {
    const list = ['ssid-1', 'ssid-2', 'ssid-3']

    test('calls GET /wifi/list', () => {
      client.__setMockResponse(list)

      return fetchWifiList(robot)(() => {})
        .then(() => {
          expect(client).toHaveBeenCalledWith(robot, 'GET', 'wifi/list')
        })
    })

    test('dispatches WIFI_REQUEST and WIFI_SUCCESS', () => {
      const store = mockStore({})
      const expectedActions = [
        {type: 'api:WIFI_REQUEST', payload: {robot, path: 'list'}},
        {type: 'api:WIFI_SUCCESS', payload: {robot, list, path: 'list'}}
      ]

      client.__setMockResponse(list)

      return store.dispatch(fetchWifiList(robot))
        .then(() => expect(store.getActions()).toEqual(expectedActions))
    })

    test('dispatches WIFI_REQUEST and WIFI_FAILURE', () => {
      const error = {name: 'ResponseError', status: '400'}
      const store = mockStore({})
      const expectedActions = [
        {type: 'api:WIFI_REQUEST', payload: {robot, path: 'list'}},
        {type: 'api:WIFI_FAILURE', payload: {robot, error, path: 'list'}}
      ]

      client.__setMockError(error)

      return store.dispatch(fetchWifiList(robot))
        .then(() => expect(store.getActions()).toEqual(expectedActions))
    })
  })

  describe('fetchWifiStatus action creator', () => {
    const status = 'full'

    test('calls GET /wifi/status', () => {
      client.__setMockResponse({status})

      return fetchWifiStatus(robot)(() => {})
        .then(() => {
          expect(client).toHaveBeenCalledWith(robot, 'GET', 'wifi/status')
        })
    })

    test('dispatches WIFI_REQUEST and WIFI_SUCCESS', () => {
      const store = mockStore({})
      const expectedActions = [
        {type: 'api:WIFI_REQUEST', payload: {robot, path: 'status'}},
        {type: 'api:WIFI_SUCCESS', payload: {robot, status, path: 'status'}}
      ]

      client.__setMockResponse({status})

      return store.dispatch(fetchWifiStatus(robot))
        .then(() => expect(store.getActions()).toEqual(expectedActions))
    })

    test('dispatches WIFI_REQUEST and WIFI_FAILURE', () => {
      const error = {name: 'ResponseError', status: '400'}
      const store = mockStore({})
      const expectedActions = [
        {type: 'api:WIFI_REQUEST', payload: {robot, path: 'status'}},
        {type: 'api:WIFI_FAILURE', payload: {robot, error, path: 'status'}}
      ]

      client.__setMockError(error)

      return store.dispatch(fetchWifiStatus(robot))
        .then(() => expect(store.getActions()).toEqual(expectedActions))
    })
  })

  describe('reducer with /wifi/list', () => {
    const path = 'list'

    test('handles WIFI_REQUEST', () => {
      const state = {
        wifi: {
          opentrons: {
            list: {
              inProgress: false,
              error: new Error('AH'),
              response: ['ssid-1']
            }
          }
        }
      }
      const action = {type: 'api:WIFI_REQUEST', payload: {path, robot}}

      expect(reducer(state, action).wifi).toEqual({
        opentrons: {
          list: {
            inProgress: true,
            error: null,
            response: ['ssid-1']
          }
        }
      })
    })

    test('handles WIFI_SUCCESS', () => {
      const state = {
        wifi: {
          opentrons: {
            list: {
              inProgress: true,
              error: null,
              response: ['ssid-1']
            }
          }
        }
      }
      const action = {
        type: 'api:WIFI_SUCCESS',
        payload: {robot, path, list: ['ssid-1', 'ssid-2', 'ssid-3']}
      }

      expect(reducer(state, action).wifi).toEqual({
        opentrons: {
          list: {
            inProgress: false,
            error: null,
            response: ['ssid-1', 'ssid-2', 'ssid-3']
          }
        }
      })
    })

    test('handles WIFI_FAILURE', () => {
      const state = {
        wifi: {
          opentrons: {
            list: {
              inProgress: true,
              error: null,
              response: ['ssid-1']
            }
          }
        }
      }
      const action = {
        type: 'api:WIFI_FAILURE',
        payload: {robot, path, error: {name: 'ResponseError'}}
      }

      expect(reducer(state, action).wifi).toEqual({
        opentrons: {
          list: {
            inProgress: false,
            error: {name: 'ResponseError'},
            response: ['ssid-1']
          }
        }
      })
    })
  })

  describe('reducer with /wifi/status', () => {
    const path = 'status'

    test('handles WIFI_REQUEST', () => {
      const state = {
        wifi: {
          opentrons: {
            status: {
              inProgress: false,
              error: new Error('AH'),
              response: 'limited'
            }
          }
        }
      }
      const action = {type: 'api:WIFI_REQUEST', payload: {robot, path}}

      expect(reducer(state, action).wifi).toEqual({
        opentrons: {
          status: {
            inProgress: true,
            error: null,
            response: 'limited'
          }
        }
      })
    })

    test('handles WIFI_SUCCESS', () => {
      const state = {
        wifi: {
          opentrons: {
            status: {
              inProgress: true,
              error: null,
              response: 'limited'
            }
          }
        }
      }
      const action = {
        type: 'api:WIFI_SUCCESS',
        payload: {robot, path, status: 'full'}
      }

      expect(reducer(state, action).wifi).toEqual({
        opentrons: {
          status: {
            inProgress: false,
            error: null,
            response: 'full'
          }
        }
      })
    })

    test('handles WIFI_FAILURE', () => {
      const state = {
        wifi: {
          opentrons: {
            status: {
              inProgress: true,
              error: null,
              response: 'limited'
            }
          }
        }
      }
      const action = {
        type: 'api:WIFI_FAILURE',
        payload: {robot, path, error: {name: 'ResponseError'}}
      }

      expect(reducer(state, action).wifi).toEqual({
        opentrons: {
          status: {
            inProgress: false,
            error: {name: 'ResponseError'},
            response: 'limited'
          }
        }
      })
    })
  })
})
