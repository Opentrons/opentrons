// server api tests
import configureMockStore from 'redux-mock-store'
import thunk from 'redux-thunk'

import client from '../client'
import { makeGetRobotRestartRequest, restartRobotServer, reducer } from '..'

jest.mock('../client')

const REQUESTS_TO_TEST = [
  { path: 'restart', response: { message: 'restarting' } },
]

const middlewares = [thunk]
const mockStore = configureMockStore(middlewares)

describe('server API client', () => {
  let robot

  beforeEach(() => {
    robot = {
      name: 'opentrons',
      ip: '1.2.3.4',
      port: '1234',
      local: false,
      ok: true,
      serverOk: true,
      health: {},
      serverHealth: {},
    }
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('selectors', () => {
    let state
    beforeEach(() => {
      state = {
        api: {
          server: {
            [robot.name]: {
              restart: { inProgress: true, error: null, response: null },
            },
          },
        },
      }
    })

    test('makeGetRobotUpdateRequest', () => {
      const getRestartRequest = makeGetRobotRestartRequest()

      expect(getRestartRequest(state, robot)).toBe(
        state.api.server[robot.name].restart
      )
      expect(getRestartRequest(state, { name: 'foo' })).toEqual({
        inProgress: false,
      })
    })
  })

  describe('restartRobotServer action creator', () => {
    test('calls POST /server/restart', () => {
      client.__setMockResponse({ message: 'restarting' })

      return restartRobotServer(robot)(() => {}).then(() =>
        expect(client).toHaveBeenCalledWith(robot, 'POST', 'server/restart')
      )
    })

    test('dispatches SERVER_REQUEST and SERVER_SUCCESS', () => {
      const response = { message: 'restarting' }
      const store = mockStore({})
      const expectedActions = [
        { type: 'api:SERVER_REQUEST', payload: { robot, path: 'restart' } },
        {
          type: 'api:SERVER_SUCCESS',
          payload: { robot, response, path: 'restart' },
          meta: { robot: true },
        },
      ]

      client.__setMockResponse(response)

      return store
        .dispatch(restartRobotServer(robot))
        .then(() => expect(store.getActions()).toEqual(expectedActions))
    })

    test('dispatches SERVER_REQUEST and SERVER_FAILURE', () => {
      const error = { name: 'ResponseError', status: '400' }
      const store = mockStore({})
      const expectedActions = [
        { type: 'api:SERVER_REQUEST', payload: { robot, path: 'restart' } },
        {
          type: 'api:SERVER_FAILURE',
          payload: { robot, error, path: 'restart' },
        },
      ]

      client.__setMockError(error)

      return store
        .dispatch(restartRobotServer(robot))
        .then(() => expect(store.getActions()).toEqual(expectedActions))
    })
  })

  describe('reducer', () => {
    let state

    beforeEach(
      () =>
        (state = {
          server: {
            [robot.name]: {},
          },
        })
    )

    REQUESTS_TO_TEST.forEach(request => {
      const { path, response } = request

      test(`handles SERVER_REQUEST for /server/${path}`, () => {
        const action = { type: 'api:SERVER_REQUEST', payload: { robot, path } }

        expect(reducer(state, action).server).toEqual({
          [robot.name]: {
            [path]: { inProgress: true, error: null, response: null },
          },
        })
      })

      test(`handles SERVER_SUCCESS for /server/${path}`, () => {
        const action = {
          type: 'api:SERVER_SUCCESS',
          payload: { robot, path, response },
        }

        state.server[robot.name][path] = {
          inProgress: true,
          error: null,
          response: null,
        }

        expect(reducer(state, action).server).toEqual({
          [robot.name]: {
            [path]: { response, inProgress: false, error: null },
          },
        })
      })

      test(`handles SERVER_FAILURE for /server/${path}`, () => {
        const error = { message: 'ahhhh' }
        const action = {
          type: 'api:SERVER_FAILURE',
          payload: { robot, path, error },
        }

        state.server[robot.name][path] = {
          inProgress: true,
          error: null,
          response,
        }

        expect(reducer(state, action).server).toEqual({
          [robot.name]: {
            [path]: { error, inProgress: false, response: null },
          },
        })
      })
    })
  })
})
