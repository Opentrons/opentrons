// networking api tests
import configureMockStore from 'redux-mock-store'
import thunk from 'redux-thunk'

import { client } from '../client'
import * as networking from '../networking'

jest.mock('../client')

const middlewares = [thunk]
const mockStore = configureMockStore(middlewares)

describe('networking', () => {
  beforeEach(() => jest.clearAllMocks())

  describe('selector creators', () => {
    const SPECS = [
      {
        name: 'makeGetRobotWifiList',
        selector: networking.makeGetRobotWifiList,
        state: {
          superDeprecatedRobotApi: {
            api: {
              someName: {
                'wifi/list': {
                  inProgress: false,
                  response: {
                    list: [
                      { ssid: 'foo', active: false, signal: 100 },
                      { ssid: 'foo', active: true, signal: 42 },
                      { ssid: 'baz', active: false, signal: 50 },
                      { ssid: 'baz', active: false, signal: 65 },
                      { ssid: 'bar', active: false, signal: 42 },
                    ],
                  },
                },
              },
            },
          },
        },
        props: { name: 'someName' },
        expected: {
          inProgress: false,
          response: {
            list: [
              { ssid: 'foo', active: true, signal: 42 },
              { ssid: 'bar', active: false, signal: 42 },
              { ssid: 'baz', active: false, signal: 65 },
            ],
          },
        },
      },
      {
        name: 'makeGetRobotWifiConfigure',
        selector: networking.makeGetRobotWifiConfigure,
        state: {
          superDeprecatedRobotApi: {
            api: {
              someName: {
                'wifi/configure': { response: { ssid: 'some-ssid' } },
              },
            },
          },
        },
        props: { name: 'someName' },
        expected: { response: { ssid: 'some-ssid' } },
      },
    ]

    SPECS.forEach(spec => {
      const { name, selector, state, props, expected } = spec

      test(`${name} with known robot`, () =>
        expect(selector()(state, props)).toEqual(expected))

      test(`${name} with unknown robot`, () =>
        expect(selector()(state, { name: 'foo' })).toEqual({
          inProgress: false,
        }))
    })
  })

  test('clearConfigureWifiResponse action creator', () => {
    expect(networking.clearConfigureWifiResponse({ name: 'foo' })).toEqual({
      type: 'api:CLEAR_RESPONSE',
      payload: { robot: { name: 'foo' }, path: 'wifi/configure' },
    })
  })

  describe('HTTP request action creators', () => {
    let store
    let robot

    beforeEach(() => {
      store = mockStore({})
      robot = { name: 'opentrons', ip: '1.2.3.4', port: '1234' }
    })

    const SPECS = [
      {
        name: 'fetchWifiList',
        action: networking.fetchWifiList,
        method: 'GET',
        path: 'wifi/list',
        request: null,
        success: { list: [] },
        failure: { name: 'ResponseError', status: '400', message: 'oh no' },
      },
      {
        name: 'configureWifi',
        action: networking.configureWifi,
        method: 'POST',
        path: 'wifi/configure',
        request: { ssid: 'some-ssid', psk: 'some-psk' },
        success: { ssid: 'some-ssid', message: 'success!' },
        failure: { name: 'ResponseError', status: '400', message: 'oh no' },
      },
    ]

    SPECS.forEach(spec => {
      const { name, action, method, path, request, success, failure } = spec

      test(`${name} makes HTTP call`, () => {
        client.__setMockResponse(success)
        return store
          .dispatch(action(robot, request))
          .then(() =>
            expect(client).toHaveBeenCalledWith(robot, method, path, request)
          )
      })

      test(`${name} handles success`, () => {
        const expectedActions = [
          { type: 'api:REQUEST', payload: { robot, path, request } },
          { type: 'api:SUCCESS', payload: { robot, path, response: success } },
        ]

        client.__setMockResponse(success)

        return store
          .dispatch(action(robot, request))
          .then(() => expect(store.getActions()).toEqual(expectedActions))
      })

      test(`${name} handles failure`, () => {
        const expectedActions = [
          { type: 'api:REQUEST', payload: { robot, path, request } },
          { type: 'api:FAILURE', payload: { robot, path, error: failure } },
        ]

        client.__setMockError(failure)

        return store
          .dispatch(action(robot, request))
          .then(() => expect(store.getActions()).toEqual(expectedActions))
      })
    })
  })
})
