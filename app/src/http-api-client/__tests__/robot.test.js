// robot/* api tests
import configureMockStore from 'redux-mock-store'
import thunk from 'redux-thunk'

import client from '../client'
import {
  moveToChangePipette,
  home,
  reducer,
  makeGetRobotMove,
  makeGetRobotHome
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
    client.__clearMock()

    robot = {name: NAME, ip: '1.2.3.4', port: '1234'}
    state = {api: {robot: {}}}
    store = mockStore(state)
  })

  describe('moveToChangePipette action creator', () => {
    const mockPositionsResponse = {
      positions: {
        change_pipette: {
          target: 'mount',
          left: [1, 2, 3],
          right: [4, 5, 6]
        }
      }
    }

    test('calls GET /robot/positions', () => {
      client.__setMockResponse(mockPositionsResponse)

      return store.dispatch(moveToChangePipette(robot, 'left'))
        .then(() => expect(client)
          .toHaveBeenCalledWith(robot, 'GET', 'robot/positions'))
    })

    test('calls POST /robot/move with positions response', () => {
      const expected = {
        target: 'mount',
        mount: 'left',
        point: [1, 2, 3]
      }

      client.__setMockResponse(mockPositionsResponse)

      return store.dispatch(moveToChangePipette(robot, 'left'))
        .then(() => expect(client)
          .toHaveBeenCalledWith(robot, 'POST', 'robot/move', expected))
    })

    // TODO(mc, 2018-04-10): need to improve client mock to handle successive
    //   mock responses in order to test these
    test('dispatches ROBOT_REQUEST and ROBOT_SUCCESS')
    test('dispatches ROBOT_REQUEST and ROBOT_FAILURE')
  })

  describe('home action creator', () => {
    const path = 'home'
    const response = {message: 'success'}

    test('calls POST /robot/home to home robot', () => {
      const expectedBody = {target: 'robot'}

      client.__setMockResponse(response)

      return store.dispatch(home(robot))
        .then(() => expect(client)
          .toHaveBeenCalledWith(robot, 'POST', 'robot/home', expectedBody))
    })

    test('calls POST /robot/home to home a pipette', () => {
      const expectedBody = {target: 'pipette', mount: 'right'}

      client.__setMockResponse(response)

      return store.dispatch(home(robot, 'right'))
        .then(() => expect(client)
          .toHaveBeenCalledWith(robot, 'POST', 'robot/home', expectedBody))
    })

    test('dispatches ROBOT_REQUEST and ROBOT_SUCCESS', () => {
      const request = {target: 'pipette', mount: 'left'}
      const expectedActions = [
        {type: 'api:ROBOT_REQUEST', payload: {robot, request, path}},
        {type: 'api:ROBOT_SUCCESS', payload: {robot, response, path}}
      ]

      client.__setMockResponse(response)

      return store.dispatch(home(robot, 'left'))
        .then(() => expect(store.getActions()).toEqual(expectedActions))
    })

    test('dispatches ROBOT_REQUEST and ROBOT_FAILURE', () => {
      const request = {target: 'robot'}
      const error = {name: 'ResponseError', status: '400'}
      const expectedActions = [
        {type: 'api:ROBOT_REQUEST', payload: {robot, request, path}},
        {type: 'api:ROBOT_FAILURE', payload: {robot, error, path}}
      ]

      client.__setMockError(error)

      return store.dispatch(home(robot))
        .then(() => expect(store.getActions()).toEqual(expectedActions))
    })
  })

  test('reducer handles SET_ROBOT_MOVE_POSITION', () => {
    state = state.api
    const action = {
      type: 'api:SET_ROBOT_MOVE_POSITION',
      payload: {robot, position: 'change_pipette'}
    }

    expect(reducer(state, action).robot).toEqual({
      [NAME]: {
        movePosition: 'change_pipette'
      }
    })
  })

  const REDUCER_REQUEST_RESPONSE_TESTS = [
    {
      path: 'move',
      request: {target: 'mount', mount: 'left', point: [1, 2, 3]},
      response: {message: 'we did it!'}
    },
    {
      path: 'home',
      request: {target: 'pipette', mount: 'left'},
      response: {message: 'we did it!'}
    }
  ]

  REDUCER_REQUEST_RESPONSE_TESTS.forEach((spec) => {
    const {path, request, response} = spec

    describe(`reducer with /robot/${path}`, () => {
      beforeEach(() => {
        state = state.api
      })

      test('handles ROBOT_REQUEST', () => {
        const action = {
          type: 'api:ROBOT_REQUEST',
          payload: {path, robot, request}
        }

        expect(reducer(state, action).robot).toEqual({
          [NAME]: {
            [path]: {
              request,
              inProgress: true,
              error: null,
              response: null
            }
          }
        })
      })

      test('handles ROBOT_SUCCESS', () => {
        const action = {
          type: 'api:ROBOT_SUCCESS',
          payload: {path, robot, response}
        }

        state.robot[NAME] = {
          [path]: {
            request,
            inProgress: true,
            error: null,
            response: null
          }
        }

        expect(reducer(state, action).robot).toEqual({
          [NAME]: {
            [path]: {
              request,
              response,
              inProgress: false,
              error: null
            }
          }
        })
      })

      test('handles ROBOT_FAILURE', () => {
        const error = {message: 'we did not do it!'}
        const action = {
          type: 'api:ROBOT_FAILURE',
          payload: {path, robot, error}
        }

        state.robot[NAME] = {
          [path]: {
            request,
            inProgress: true,
            error: null,
            response: null
          }
        }

        expect(reducer(state, action).robot).toEqual({
          [NAME]: {
            [path]: {
              request,
              error,
              response: null,
              inProgress: false
            }
          }
        })
      })
    })
  })

  describe('selectors', () => {
    beforeEach(() => {
      state.api.robot[NAME] = {
        home: {inProgress: true},
        move: {inProgress: true},
        movePosition: 'change_pipette'
      }
    })

    test('makeGetRobotMove', () => {
      const getMove = makeGetRobotMove()

      expect(getMove(state, robot)).toEqual({
        ...state.api.robot[NAME].move,
        position: 'change_pipette'
      })

      expect(getMove(state, {name: 'foo'})).toEqual({
        inProgress: false,
        error: null,
        request: null,
        response: null,
        position: null
      })
    })

    test('makeGetRobotHome', () => {
      const getHome = makeGetRobotHome()

      expect(getHome(state, robot)).toEqual(state.api.robot[NAME].home)
      expect(getHome(state, {name: 'foo'})).toEqual({
        inProgress: false,
        error: null,
        request: null,
        response: null
      })
    })
  })
})
