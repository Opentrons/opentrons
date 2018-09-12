// server api tests
import configureMockStore from 'redux-mock-store'
import thunk from 'redux-thunk'
import electron from 'electron'

import client from '../client'
import {
  makeGetAvailableRobotUpdate,
  makeGetRobotIgnoredUpdateRequest,
  makeGetRobotUpdateRequest,
  makeGetRobotRestartRequest,
  getAnyRobotUpdateAvailable,
  restartRobotServer,
  fetchIgnoredUpdate,
  setIgnoredUpdate,
  reducer,
} from '..'

jest.mock('electron')
jest.mock('../client')

const REQUESTS_TO_TEST = [
  {path: 'update', response: {message: 'foo', filename: 'bar'}},
  {path: 'restart', response: {message: 'restarting'}},
  {path: 'update/ignore', response: {version: '42.0.0'}},
]

const middlewares = [thunk]
const mockStore = configureMockStore(middlewares)

const robot = {name: 'opentrons', ip: '1.2.3.4', port: '1234'}
const mockApiUpdate = electron.__mockRemotes['./api-update']
const availableUpdate = '42.0.0'

describe('server API client', () => {
  beforeEach(() => {
    client.__clearMock()
    electron.__clearMock()
  })

  describe('selectors', () => {
    let state

    beforeEach(() => {
      state = {
        api: {
          server: {
            [robot.name]: {
              availableUpdate: '42.0.0',
              update: {inProgress: true, error: null, response: null},
              restart: {inProgress: true, error: null, response: null},
              'update/ignore': {inProgress: true, error: null, response: null},
            },
          },
        },
      }
    })

    test('makeGetRobotAvailableUpdate', () => {
      const getAvailableUpdate = makeGetAvailableRobotUpdate()

      expect(getAvailableUpdate(state, robot)).toEqual('42.0.0')
      expect(getAvailableUpdate(state, {name: 'foo'})).toEqual(null)
    })

    test('makeGetRobotUpdateRequest', () => {
      const getUpdateRequest = makeGetRobotUpdateRequest()

      expect(getUpdateRequest(state, robot))
        .toBe(state.api.server[robot.name].update)
      expect(getUpdateRequest(state, {name: 'foo'}))
        .toEqual({inProgress: false})
    })

    test('makeGetRobotUpdateRequest', () => {
      const getRestartRequest = makeGetRobotRestartRequest()

      expect(getRestartRequest(state, robot))
        .toBe(state.api.server[robot.name].restart)
      expect(getRestartRequest(state, {name: 'foo'}))
        .toEqual({inProgress: false})
    })

    test('makeGetRobotIgnoredUpdateRequest', () => {
      const getIngoredUpdate = makeGetRobotIgnoredUpdateRequest()

      expect(getIngoredUpdate(state, robot)).toEqual(state.api.server[robot.name]['update/ignore'])
      expect(getIngoredUpdate(state, {name: 'foo'})).toEqual({inProgress: false})
    })

    test('getAnyRobotUpdateAvailable is true if any robot has update', () => {
      state.api.server.anotherBot = {availableUpdate: null}
      expect(getAnyRobotUpdateAvailable(state)).toBe(true)

      state = {
        api: {
          server: {
            ...state.api.server,
            [robot.name]: {availableUpdate: null},
          },
        },
      }
      expect(getAnyRobotUpdateAvailable(state)).toBe(false)
    })
  })

  // TODO(mc, 2018-03-16): write tests for this action creator; skipping
  //   because mocking electron, FormData, and Blob would be more work
  describe.skip('updateRobotServer action creator')

  describe('restartRobotServer action creator', () => {
    test('calls POST /server/restart', () => {
      client.__setMockResponse({message: 'restarting'})

      return restartRobotServer(robot)(() => {})
        .then(() => expect(client)
          .toHaveBeenCalledWith(robot, 'POST', 'server/restart')
        )
    })

    test('dispatches SERVER_REQUEST and SERVER_SUCCESS', () => {
      const response = {message: 'restarting'}
      const store = mockStore({})
      const expectedActions = [
        {type: 'api:SERVER_REQUEST', payload: {robot, path: 'restart'}},
        {
          type: 'api:SERVER_SUCCESS',
          payload: {robot, response, path: 'restart'},
        },
      ]

      client.__setMockResponse(response)

      return store.dispatch(restartRobotServer(robot))
        .then(() => expect(store.getActions()).toEqual(expectedActions))
    })

    test('dispatches SERVER_REQUEST and SERVER_FAILURE', () => {
      const error = {name: 'ResponseError', status: '400'}
      const store = mockStore({})
      const expectedActions = [
        {type: 'api:SERVER_REQUEST', payload: {robot, path: 'restart'}},
        {
          type: 'api:SERVER_FAILURE',
          payload: {robot, error, path: 'restart'},
        },
      ]

      client.__setMockError(error)

      return store.dispatch(restartRobotServer(robot))
        .then(() => expect(store.getActions()).toEqual(expectedActions))
    })
  })

  describe('fetchIgnoredUpdate action creator', () => {
    test('calls GET /server/update/ignore', () => {
      client.__setMockResponse({inProgress: true, error: null, response: {version: '42.0.0'}})

      return fetchIgnoredUpdate(robot)(() => {})
        .then(() => expect(client)
          .toHaveBeenCalledWith(robot, 'GET', 'server/update/ignore')
        )
    })

    test('dispatches SERVER_REQUEST and SERVER_SUCCESS', () => {
      const response = {version: '42.0.0'}
      const store = mockStore({})
      const expectedActions = [
        {type: 'api:SERVER_REQUEST', payload: {robot, path: 'update/ignore'}},
        {
          type: 'api:SERVER_SUCCESS',
          payload: {robot, response, path: 'update/ignore'},
        },
      ]

      client.__setMockResponse(response)

      return store.dispatch(fetchIgnoredUpdate(robot))
        .then(() => expect(store.getActions()).toEqual(expectedActions))
    })

    test('dispatches SERVER_REQUEST and SERVER_FAILURE', () => {
      const error = {name: 'ResponseError', status: '400'}
      const store = mockStore({})
      const expectedActions = [
        {type: 'api:SERVER_REQUEST', payload: {robot, path: 'update/ignore'}},
        {
          type: 'api:SERVER_FAILURE',
          payload: {robot, error, path: 'update/ignore'},
        },
      ]

      client.__setMockError(error)

      return store.dispatch(fetchIgnoredUpdate(robot))
        .then(() => expect(store.getActions()).toEqual(expectedActions))
    })
  })

  describe('setIgnoredUpdate action creator', () => {
    test('calls POST /server/update/ignore', () => {
      client.__setMockResponse({inProgress: true, error: null, response: {version: '42.0.0'}})

      return setIgnoredUpdate(robot, availableUpdate)(() => {})
        .then(() => expect(client)
          .toHaveBeenCalledWith(robot, 'POST', 'server/update/ignore', {version: availableUpdate})
        )
    })

    test('dispatches SERVER_REQUEST and SERVER_SUCCESS', () => {
      const response = {version: '42.0.0'}
      const store = mockStore({})
      const expectedActions = [
        {type: 'api:SERVER_REQUEST', payload: {robot, path: 'update/ignore'}},
        {
          type: 'api:SERVER_SUCCESS',
          payload: {robot, response, path: 'update/ignore'},
        },
      ]

      client.__setMockResponse(response)

      return store.dispatch(setIgnoredUpdate(robot, availableUpdate))
        .then(() => expect(store.getActions()).toEqual(expectedActions))
    })

    test('dispatches SERVER_REQUEST and SERVER_FAILURE', () => {
      const error = {name: 'ResponseError', status: '400'}
      const store = mockStore({})
      const expectedActions = [
        {type: 'api:SERVER_REQUEST', payload: {robot, path: 'update/ignore'}},
        {
          type: 'api:SERVER_FAILURE',
          payload: {robot, error, path: 'update/ignore'},
        },
      ]

      client.__setMockError(error)

      return store.dispatch(setIgnoredUpdate(robot, availableUpdate))
        .then(() => expect(store.getActions()).toEqual(expectedActions))
    })
  })

  describe('reducer', () => {
    let state

    beforeEach(() => (state = {
      server: {
        [robot.name]: {},
      },
    }))

    test('sets availableUpdate on /health api:SUCCESS', () => {
      const health = {name, api_version: 'foobar', fw_version: '7.8.9'}
      const action = {
        type: 'api:SUCCESS',
        payload: {robot, path: 'health', response: health},
      }

      // test update available
      state.server[robot.name].availableUpdate = null
      expect(reducer(state, action).server).toEqual({
        [robot.name]: {
          availableUpdate: mockApiUpdate.AVAILABLE_UPDATE,
          update: null,
          restart: null,
        },
      })

      // test no update available
      action.payload.response.api_version = mockApiUpdate.AVAILABLE_UPDATE
      state.server[robot.name].availableUpdate = mockApiUpdate.AVAILABLE_UPDATE
      expect(reducer(state, action).server).toEqual({
        [robot.name]: {availableUpdate: null, update: null, restart: null},
      })
    })

    REQUESTS_TO_TEST.forEach((request) => {
      const {path, response} = request

      test(`handles SERVER_REQUEST for /server/${path}`, () => {
        const action = {type: 'api:SERVER_REQUEST', payload: {robot, path}}

        expect(reducer(state, action).server).toEqual({
          [robot.name]: {
            [path]: {inProgress: true, error: null, response: null},
          },
        })
      })

      test(`handles SERVER_SUCCESS for /server/${path}`, () => {
        const action = {
          type: 'api:SERVER_SUCCESS',
          payload: {robot, path, response},
        }

        state.server[robot.name][path] = {
          inProgress: true,
          error: null,
          response: null,
        }

        expect(reducer(state, action).server).toEqual({
          [robot.name]: {
            [path]: {response, inProgress: false, error: null},
          },
        })
      })

      test(`handles SERVER_FAILURE for /server/${path}`, () => {
        const error = {message: 'ahhhh'}
        const action = {
          type: 'api:SERVER_FAILURE',
          payload: {robot, path, error},
        }

        state.server[robot.name][path] = {
          inProgress: true,
          error: null,
          response,
        }

        expect(reducer(state, action).server).toEqual({
          [robot.name]: {
            [path]: {error, inProgress: false, response: null},
          },
        })
      })
    })
  })
})
