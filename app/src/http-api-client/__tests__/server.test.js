// server api tests
import configureMockStore from 'redux-mock-store'
import thunk from 'redux-thunk'
import electron from 'electron'
import {setter} from '@thi.ng/paths'

import client from '../client'
import {
  makeGetRobotUpdateInfo,
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
  // {path: 'update/ignore', response: {version: '42.0.0'}},
]

const middlewares = [thunk]
const mockStore = configureMockStore(middlewares)

const robot = {name: 'opentrons', ip: '1.2.3.4', port: '1234'}
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
              update: {inProgress: true, error: null, response: null},
              restart: {inProgress: true, error: null, response: null},
              'update/ignore': {inProgress: true, error: null, response: null},
            },
          },
          api: {
            [robot.name]: {
              health: {
                response: {
                  api_version: '3.0.0',
                },
              },
            },
          },
        },
        shell: {
          apiUpdate: {
            version: '4.0.0',
          },
        },
      }
    })

    test('makeGetRobotUpdateInfo', () => {
      const version = state.shell.apiUpdate.version
      const getRobotUpdateInfo = makeGetRobotUpdateInfo()
      const setCurrent = setter(`api.api.${robot.name}.health.response.api_version`)

      // test upgrade available
      expect(getRobotUpdateInfo(state, robot)).toEqual({version, type: 'upgrade'})

      // test downgrade
      state = setCurrent(state, '5.0.0')
      expect(getRobotUpdateInfo(state, robot)).toEqual({version, type: 'downgrade'})

      // test no upgrade
      state = setCurrent(state, '4.0.0')
      expect(getRobotUpdateInfo(state, robot)).toEqual({version, type: null})

      // test unknown robot
      expect(getRobotUpdateInfo(state, {name: 'foo'})).toEqual({version, type: null})
    })

    test('makeGetRobotUpdateRequest', () => {
      const getUpdateRequest = makeGetRobotUpdateRequest()

      expect(getUpdateRequest(state, robot)).toBe(
        state.api.server[robot.name].update
      )
      expect(getUpdateRequest(state, {name: 'foo'})).toEqual({
        inProgress: false,
      })
    })

    test('makeGetRobotUpdateRequest', () => {
      const getRestartRequest = makeGetRobotRestartRequest()

      expect(getRestartRequest(state, robot)).toBe(
        state.api.server[robot.name].restart
      )
      expect(getRestartRequest(state, {name: 'foo'})).toEqual({
        inProgress: false,
      })
    })

    test('makeGetRobotIgnoredUpdateRequest', () => {
      const getIngoredUpdate = makeGetRobotIgnoredUpdateRequest()

      expect(getIngoredUpdate(state, robot)).toEqual(
        state.api.server[robot.name]['update/ignore']
      )
      expect(getIngoredUpdate(state, {name: 'foo'})).toEqual({
        inProgress: false,
      })
    })

    // TODO(mc, 2018-09-25): re-evaluate this selector
    test.skip('getAnyRobotUpdateAvailable is true if any robot has update', () => {
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

      return restartRobotServer(robot)(() => {}).then(() =>
        expect(client).toHaveBeenCalledWith(robot, 'POST', 'server/restart')
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

      return store
        .dispatch(restartRobotServer(robot))
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

      return store
        .dispatch(restartRobotServer(robot))
        .then(() => expect(store.getActions()).toEqual(expectedActions))
    })
  })

  describe('fetchIgnoredUpdate action creator', () => {
    test('calls GET /update/ignore', () => {
      client.__setMockResponse({
        inProgress: true,
        error: null,
        response: {version: '42.0.0'},
      })

      return fetchIgnoredUpdate(robot)(() => {}).then(() =>
        expect(client).toHaveBeenCalledWith(
          robot,
          'GET',
          'update/ignore'
        )
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

      return store
        .dispatch(fetchIgnoredUpdate(robot))
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

      return store
        .dispatch(fetchIgnoredUpdate(robot))
        .then(() => expect(store.getActions()).toEqual(expectedActions))
    })
  })

  describe('setIgnoredUpdate action creator', () => {
    test('calls POST update/ignore', () => {
      client.__setMockResponse({
        inProgress: true,
        error: null,
        response: {version: '42.0.0'},
      })

      return setIgnoredUpdate(robot, availableUpdate)(() => {}).then(() =>
        expect(client).toHaveBeenCalledWith(
          robot,
          'POST',
          'update/ignore',
          {version: availableUpdate}
        )
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

      return store
        .dispatch(setIgnoredUpdate(robot, availableUpdate))
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

      return store
        .dispatch(setIgnoredUpdate(robot, availableUpdate))
        .then(() => expect(store.getActions()).toEqual(expectedActions))
    })
  })

  describe('reducer', () => {
    let state

    beforeEach(() =>
      (state = {
        server: {
          [robot.name]: {},
        },
      }))

    REQUESTS_TO_TEST.forEach(request => {
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
