// wifi/* api tests
import configureMockStore from 'redux-mock-store'
import thunk from 'redux-thunk'

import client from '../client'
import {
  fetchWifiList,
  fetchWifiStatus,
  clearConfigureWifiResponse,
  configureWifi,
  reducer,
  makeGetRobotWifiStatus,
  makeGetRobotWifiList,
  makeGetRobotWifiConfigure,
} from '..'

jest.mock('../client')

const middlewares = [thunk]
const mockStore = configureMockStore(middlewares)

const robot = {name: 'opentrons', ip: '1.2.3.4', port: '1234'}

describe('wifi', () => {
  beforeEach(() => client.__clearMock())

  describe('selectors', () => {
    const state = {
      api: {
        wifi: {
          opentrons: {
            status: {inProgress: false},
            list: {inProgress: false},
            configure: {inProgress: false},
          },
        },
      },
    }

    test('makeGetRobotWifiStatus', () => {
      const getStatus = makeGetRobotWifiStatus()

      expect(getStatus(state, robot))
        .toEqual(state.api.wifi.opentrons.status)

      expect(getStatus(state, {name: 'foo'})).toEqual({
        inProgress: false,
        error: null,
        response: null,
      })
    })

    test('makeGetRobotWifiList', () => {
      const getList = makeGetRobotWifiList()

      expect(getList(state, robot)).toEqual(state.api.wifi.opentrons.list)
      expect(getList(state, {name: 'foo'})).toEqual({
        inProgress: false,
        error: null,
        response: null,
      })
    })

    test('makeGetRobotWifiList dedupes network list', () => {
      const getList = makeGetRobotWifiList()
      const state = {
        api: {
          wifi: {
            opentrons: {
              list: {
                inProgress: false,
                response: {
                  list: [
                    {ssid: 'foo'},
                    {ssid: 'foo', active: true},
                    {ssid: 'bar'},
                  ],
                },
              },
            },
          },
        },
      }

      expect(getList(state, robot).response.list).toEqual([
        {ssid: 'foo', active: true},
        {ssid: 'bar'},
      ])
    })

    test('makeGetRobotWifiConfigure', () => {
      const getConfigure = makeGetRobotWifiConfigure()

      expect(getConfigure(state, robot))
        .toEqual(state.api.wifi.opentrons.configure)
      expect(getConfigure(state, {name: 'foo'})).toEqual({
        inProgress: false,
        error: null,
        request: null,
        response: null,
      })
    })
  })

  describe('fetchWifiList action creator', () => {
    const list = [
      {ssid: 'ssid-1', signal: 42, active: true},
      {ssid: 'ssid-2', signa: 43, active: false},
      {ssid: 'ssid-3', signal: null, active: false},
    ]

    test('calls GET /wifi/list', () => {
      client.__setMockResponse({list})

      return fetchWifiList(robot)(() => {})
        .then(() => {
          expect(client).toHaveBeenCalledWith(robot, 'GET', 'wifi/list')
        })
    })

    test('dispatches WIFI_REQUEST and WIFI_SUCCESS', () => {
      const response = {list}
      const store = mockStore({})
      const expectedActions = [
        {type: 'api:WIFI_REQUEST', payload: {robot, path: 'list'}},
        {type: 'api:WIFI_SUCCESS', payload: {robot, response, path: 'list'}},
      ]

      client.__setMockResponse(response)

      return store.dispatch(fetchWifiList(robot))
        .then(() => expect(store.getActions()).toEqual(expectedActions))
    })

    test('dispatches WIFI_REQUEST and WIFI_FAILURE', () => {
      const error = {name: 'ResponseError', status: '400'}
      const store = mockStore({})
      const expectedActions = [
        {type: 'api:WIFI_REQUEST', payload: {robot, path: 'list'}},
        {type: 'api:WIFI_FAILURE', payload: {robot, error, path: 'list'}},
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
      const response = {status}
      const store = mockStore({})
      const expectedActions = [
        {type: 'api:WIFI_REQUEST', payload: {robot, path: 'status'}},
        {type: 'api:WIFI_SUCCESS', payload: {robot, response, path: 'status'}},
      ]

      client.__setMockResponse(response)

      return store.dispatch(fetchWifiStatus(robot))
        .then(() => expect(store.getActions()).toEqual(expectedActions))
    })

    test('dispatches WIFI_REQUEST and WIFI_FAILURE', () => {
      const error = {name: 'ResponseError', status: '400'}
      const store = mockStore({})
      const expectedActions = [
        {type: 'api:WIFI_REQUEST', payload: {robot, path: 'status'}},
        {type: 'api:WIFI_FAILURE', payload: {robot, error, path: 'status'}},
      ]

      client.__setMockError(error)

      return store.dispatch(fetchWifiStatus(robot))
        .then(() => expect(store.getActions()).toEqual(expectedActions))
    })
  })

  test('clearConfigureWifiResponse action creator', () => {
    const expected = {
      type: 'api:CLEAR_CONFIGURE_WIFI_RESPONSE',
      payload: {robot},
    }

    expect(clearConfigureWifiResponse(robot)).toEqual(expected)
  })

  describe('configureWifi action creator', () => {
    const ssid = 'some-ssid'
    const psk = 'some-psk'
    const response = {ssid, message: 'Success!'}

    test('calls POST /wifi/configure, GET /wifi/list', () => {
      const store = mockStore({})

      client.__setMockResponse(response)

      return store.dispatch(configureWifi(robot, ssid, psk))
        .then(() => expect(client).toHaveBeenCalledWith(
          robot,
          'POST',
          'wifi/configure',
          {ssid, psk}
        ))
    })

    test('dispatches WIFI_REQUEST and WIFI_SUCCESS', () => {
      const store = mockStore({})
      const expectedActions = [
        {type: 'api:WIFI_REQUEST', payload: {robot, path: 'configure'}},
        {
          type: 'api:WIFI_SUCCESS',
          payload: {robot, response, path: 'configure'},
        },
      ]

      client.__setMockResponse(response)

      return store.dispatch(configureWifi(robot, 'ssid', 'psk'))
        .then(() => expect(store.getActions()).toEqual(expectedActions))
    })

    test('dispatches WIFI_REQUEST and WIFI_FAILURE', () => {
      const error = {name: 'ResponseError', status: '400'}
      const store = mockStore({})
      const expectedActions = [
        {type: 'api:WIFI_REQUEST', payload: {robot, path: 'configure'}},
        {type: 'api:WIFI_FAILURE', payload: {robot, error, path: 'configure'}},
      ]

      client.__setMockError(error)

      return store.dispatch(configureWifi(robot, 'ssid', 'psk'))
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
              request: null,
              inProgress: false,
              error: new Error('AH'),
              response: {list: ['ssid-1']},
            },
          },
        },
      }
      const action = {type: 'api:WIFI_REQUEST', payload: {path, robot}}

      expect(reducer(state, action).wifi).toEqual({
        opentrons: {
          list: {
            request: null,
            inProgress: true,
            error: null,
            response: {list: ['ssid-1']},
          },
        },
      })
    })

    test('handles WIFI_SUCCESS', () => {
      const state = {
        wifi: {
          opentrons: {
            list: {
              request: null,
              inProgress: true,
              error: null,
              response: {list: ['ssid-1']},
            },
          },
        },
      }
      const action = {
        type: 'api:WIFI_SUCCESS',
        payload: {robot, path, response: {list: ['ssid-1', 'ssid-2']}},
      }

      expect(reducer(state, action).wifi).toEqual({
        opentrons: {
          list: {
            request: null,
            inProgress: false,
            error: null,
            response: {list: ['ssid-1', 'ssid-2']},
          },
        },
      })
    })

    test('handles WIFI_FAILURE', () => {
      const state = {
        wifi: {
          opentrons: {
            list: {
              request: null,
              inProgress: true,
              error: null,
              response: {list: ['ssid-1']},
            },
          },
        },
      }
      const action = {
        type: 'api:WIFI_FAILURE',
        payload: {robot, path, error: {name: 'ResponseError'}},
      }

      expect(reducer(state, action).wifi).toEqual({
        opentrons: {
          list: {
            request: null,
            inProgress: false,
            error: {name: 'ResponseError'},
            response: {list: ['ssid-1']},
          },
        },
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
              request: null,
              inProgress: false,
              error: new Error('AH'),
              response: {status: 'limited'},
            },
          },
        },
      }
      const action = {type: 'api:WIFI_REQUEST', payload: {robot, path}}

      expect(reducer(state, action).wifi).toEqual({
        opentrons: {
          status: {
            request: null,
            inProgress: true,
            error: null,
            response: {status: 'limited'},
          },
        },
      })
    })

    test('handles WIFI_SUCCESS', () => {
      const state = {
        wifi: {
          opentrons: {
            status: {
              request: null,
              inProgress: true,
              error: null,
              response: {status: 'limited'},
            },
          },
        },
      }
      const action = {
        type: 'api:WIFI_SUCCESS',
        payload: {robot, path, response: {status: 'full'}},
      }

      expect(reducer(state, action).wifi).toEqual({
        opentrons: {
          status: {
            request: null,
            inProgress: false,
            error: null,
            response: {status: 'full'},
          },
        },
      })
    })

    test('handles WIFI_FAILURE', () => {
      const state = {
        wifi: {
          opentrons: {
            status: {
              request: null,
              inProgress: true,
              error: null,
              response: {status: 'limited'},
            },
          },
        },
      }
      const action = {
        type: 'api:WIFI_FAILURE',
        payload: {robot, path, error: {name: 'ResponseError'}},
      }

      expect(reducer(state, action).wifi).toEqual({
        opentrons: {
          status: {
            request: null,
            inProgress: false,
            error: {name: 'ResponseError'},
            response: {status: 'limited'},
          },
        },
      })
    })
  })

  describe('reducer with /wifi/configure', () => {
    const path = 'configure'

    test('handles CLEAR_CONFIGURE_WIFI_RESPONSE', () => {
      const state = {
        wifi: {
          opentrons: {
            configure: {
              request: {ssid: 'baz', psk: ''},
              inProgress: false,
              error: new Error('AH'),
              response: {ssid: 'foo', message: 'bar'},
            },
          },
        },
      }

      const action = {
        type: 'api:CLEAR_CONFIGURE_WIFI_RESPONSE',
        payload: {robot},
      }

      expect(reducer(state, action).wifi).toEqual({
        opentrons: {
          configure: {
            request: {ssid: 'baz', psk: ''},
            inProgress: false,
            error: null,
            response: null,
          },
        },
      })
    })

    test('handles WIFI_REQUEST', () => {
      const state = {
        wifi: {
          opentrons: {
            configure: {
              request: {ssid: 'baz', psk: 'qux'},
              inProgress: false,
              error: new Error('AH'),
              response: {ssid: 'foo', message: 'bar'},
            },
          },
        },
      }
      const action = {type: 'api:WIFI_REQUEST', payload: {robot, path}}

      expect(reducer(state, action).wifi).toEqual({
        opentrons: {
          configure: {
            request: {ssid: 'baz', psk: 'qux'},
            inProgress: true,
            error: null,
            response: {ssid: 'foo', message: 'bar'},
          },
        },
      })
    })

    test('handles WIFI_SUCCESS', () => {
      const state = {
        wifi: {
          opentrons: {
            configure: {
              request: {ssid: 'baz', psk: 'qux'},
              inProgress: true,
              error: null,
              response: {ssid: 'foo', message: 'bar'},
            },
          },
        },
      }
      const action = {
        type: 'api:WIFI_SUCCESS',
        payload: {robot, path, response: {ssid: 'baz', message: 'qux'}},
      }

      expect(reducer(state, action).wifi).toEqual({
        opentrons: {
          configure: {
            request: {ssid: 'baz', psk: ''},
            inProgress: false,
            error: null,
            response: {ssid: 'baz', message: 'qux'},
          },
        },
      })
    })

    test('handles WIFI_FAILURE', () => {
      const state = {
        wifi: {
          opentrons: {
            configure: {
              request: {ssid: 'baz', psk: 'qux'},
              inProgress: true,
              error: null,
              response: {ssid: 'foo', message: 'bar'},
            },
          },
        },
      }
      const action = {
        type: 'api:WIFI_FAILURE',
        payload: {robot, path, error: {name: 'ResponseError'}},
      }

      expect(reducer(state, action).wifi).toEqual({
        opentrons: {
          configure: {
            request: {ssid: 'baz', psk: 'qux'},
            inProgress: false,
            error: {name: 'ResponseError'},
            response: {ssid: 'foo', message: 'bar'},
          },
        },
      })
    })
  })
})
