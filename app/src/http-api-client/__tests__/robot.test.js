// robot/* api tests
import configureMockStore from 'redux-mock-store'
import thunk from 'redux-thunk'

import client from '../client'
import {
  moveRobotTo,
  home,
  clearHomeResponse,
  clearMoveResponse,
  superDeprecatedRobotApiReducer as reducer,
  makeGetRobotMove,
  makeGetRobotHome,
} from '..'

jest.mock('../client')

const middlewares = [thunk]
const mockStore = configureMockStore(middlewares)

const NAME = 'opentrons-dev'

describe('robot/*', () => {
  let robot
  let state
  let store

  beforeEach(() => {
    robot = { name: NAME, ip: '1.2.3.4', port: '1234' }
    state = { superDeprecatedRobotApi: { robot: {} } }
    store = mockStore(state)
  })

  afterEach(() => {
    client.__clearMock()
  })

  describe('moveRobotTo action creator', () => {
    const path = 'robot/move'
    const request = { position: 'change_pipette', mount: 'left' }
    const mockPositionsResponse = {
      positions: {
        change_pipette: {
          target: 'mount',
          left: [1, 2, 3],
          right: [4, 5, 6],
        },
      },
    }
    const response = { message: 'we did it' }

    test('calls GET /robot/positions then POST /robot/move', () => {
      const expected = {
        target: 'mount',
        mount: 'left',
        point: [1, 2, 3],
      }

      client.__setMockResponse(mockPositionsResponse, response)

      return store
        .dispatch(moveRobotTo(robot, request))
        .then(() =>
          expect(client.mock.calls).toEqual([
            [robot, 'GET', 'robot/positions'],
            [robot, 'POST', 'robot/move', expected],
          ])
        )
    })

    test('dispatches api:REQUEST and api:SUCCESS', () => {
      const expectedActions = [
        { type: 'api:REQUEST', payload: { robot, request, path } },
        { type: 'api:SUCCESS', payload: { robot, response, path } },
      ]

      client.__setMockResponse(mockPositionsResponse, response)

      return store
        .dispatch(moveRobotTo(robot, request))
        .then(() => expect(store.getActions()).toEqual(expectedActions))
    })

    test('dispatches api:REQUEST amd api:FAILURE', () => {
      const error = { name: 'ResponseError', status: '400' }
      const expectedActions = [
        { type: 'api:REQUEST', payload: { robot, request, path } },
        { type: 'api:FAILURE', payload: { robot, error, path } },
      ]

      client.__setMockError(error)

      return store
        .dispatch(moveRobotTo(robot, request))
        .then(() => expect(store.getActions()).toEqual(expectedActions))
    })

    test('clearMoveResponse action creator', () => {
      expect(clearMoveResponse(robot)).toEqual({
        type: 'api:CLEAR_RESPONSE',
        payload: { robot, path },
      })
    })
  })

  describe('home action creator', () => {
    const path = 'robot/home'
    const response = { message: 'success' }

    test('calls POST /robot/home to home robot', () => {
      const expectedBody = { target: 'robot' }

      client.__setMockResponse(response)

      return store
        .dispatch(home(robot))
        .then(() =>
          expect(client).toHaveBeenCalledWith(
            robot,
            'POST',
            'robot/home',
            expectedBody
          )
        )
    })

    test('calls POST /robot/home to home a pipette', () => {
      const expectedBody = { target: 'pipette', mount: 'right' }

      client.__setMockResponse(response)

      return store
        .dispatch(home(robot, 'right'))
        .then(() =>
          expect(client).toHaveBeenCalledWith(
            robot,
            'POST',
            'robot/home',
            expectedBody
          )
        )
    })

    test('dispatches api:REQUEST and api:SUCCESS', () => {
      const request = { target: 'pipette', mount: 'left' }
      const expectedActions = [
        { type: 'api:REQUEST', payload: { robot, request, path } },
        { type: 'api:SUCCESS', payload: { robot, response, path } },
      ]

      client.__setMockResponse(response)

      return store
        .dispatch(home(robot, 'left'))
        .then(() => expect(store.getActions()).toEqual(expectedActions))
    })

    test('dispatches api:REQUEST and api:FAILURE', () => {
      const request = { target: 'robot' }
      const error = { name: 'ResponseError', status: '400' }
      const expectedActions = [
        { type: 'api:REQUEST', payload: { robot, request, path } },
        { type: 'api:FAILURE', payload: { robot, error, path } },
      ]

      client.__setMockError(error)

      return store
        .dispatch(home(robot))
        .then(() => expect(store.getActions()).toEqual(expectedActions))
    })

    test('clearHomeResponse action creator', () => {
      expect(clearHomeResponse(robot)).toEqual({
        type: 'api:CLEAR_RESPONSE',
        payload: { robot, path },
      })
    })
  })

  const REDUCER_REQUEST_RESPONSE_TESTS = [
    {
      path: 'robot/move',
      request: { target: 'mount', mount: 'left', point: [1, 2, 3] },
      response: { message: 'we did it!' },
    },
    {
      path: 'robot/home',
      request: { target: 'pipette', mount: 'left' },
      response: { message: 'we did it!' },
    },
  ]

  REDUCER_REQUEST_RESPONSE_TESTS.forEach(spec => {
    const { path, request, response } = spec

    describe(`reducer with ${path}`, () => {
      beforeEach(() => {
        state = state.superDeprecatedRobotApi
      })

      test('handles api:REQUEST', () => {
        const action = {
          type: 'api:REQUEST',
          payload: { path, robot, request },
        }

        expect(reducer(state, action).robot).toEqual({
          [NAME]: {
            [path]: {
              request,
              inProgress: true,
              error: null,
              response: null,
            },
          },
        })
      })

      test('handles api:SUCCESS', () => {
        const action = {
          type: 'api:SUCCESS',
          payload: { path, robot, response },
        }

        state.robot[NAME] = {
          [path]: {
            request,
            inProgress: true,
            error: null,
            response: null,
          },
        }

        expect(reducer(state, action).robot).toEqual({
          [NAME]: {
            [path]: {
              request,
              response,
              inProgress: false,
              error: null,
            },
          },
        })
      })

      test('handles api:FAILURE', () => {
        const error = { message: 'we did not do it!' }
        const action = {
          type: 'api:FAILURE',
          payload: { path, robot, error },
        }

        state.robot[NAME] = {
          [path]: {
            request,
            inProgress: true,
            error: null,
            response: null,
          },
        }

        expect(reducer(state, action).robot).toEqual({
          [NAME]: {
            [path]: {
              request,
              error,
              response: null,
              inProgress: false,
            },
          },
        })
      })
    })
  })

  describe('reducer with api:CLEAR_RESPONSE', () => {
    const PATHS = ['robot/move', 'robot/home']

    beforeEach(() => {
      state = state.superDeprecatedRobotApi
    })

    PATHS.forEach(path =>
      test(`with ${path}`, () => {
        const action = {
          type: 'api:CLEAR_RESPONSE',
          payload: { robot, path },
        }

        state.robot[NAME] = {
          [path]: {
            inProgress: false,
            request: {},
            response: 'foo',
            error: 'bar',
          },
        }

        expect(reducer(state, action).robot[NAME][path]).toEqual({
          inProgress: false,
          request: {},
          response: null,
          error: null,
        })
      })
    )
  })

  describe('selectors', () => {
    beforeEach(() => {
      state.superDeprecatedRobotApi.robot[NAME] = {
        'robot/home': { inProgress: true },
        'robot/move': { inProgress: true },
        'robot/lights': { inProgress: true },
      }
    })

    test('makeGetRobotMove', () => {
      const getMove = makeGetRobotMove()

      expect(getMove(state, robot)).toEqual(
        state.superDeprecatedRobotApi.robot[NAME]['robot/move']
      )
      expect(getMove(state, { name: 'foo' })).toEqual({ inProgress: false })
    })

    test('makeGetRobotHome', () => {
      const getHome = makeGetRobotHome()

      expect(getHome(state, robot)).toEqual(
        state.superDeprecatedRobotApi.robot[NAME]['robot/home']
      )
      expect(getHome(state, { name: 'foo' })).toEqual({ inProgress: false })
    })
  })
})
