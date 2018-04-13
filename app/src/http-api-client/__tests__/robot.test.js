// robot/* api tests
import configureMockStore from 'redux-mock-store'
import thunk from 'redux-thunk'

import client from '../client'
import {
  moveToChangePipette,
  reducer
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

  describe('reducer with /robot/move', () => {
    beforeEach(() => {
      state = state.api
    })

    const path = 'move'
    const request = {target: 'mount', mount: 'left', point: [1, 2, 3]}
    const response = {message: 'we did it!'}

    test('handles ROBOT_REQUEST', () => {
      const action = {
        type: 'api:ROBOT_REQUEST',
        payload: {path, robot, request}
      }

      expect(reducer(state, action).robot).toEqual({
        [NAME]: {
          move: {
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
        move: {
          request,
          inProgress: true,
          error: null,
          response: null
        }
      }

      expect(reducer(state, action).robot).toEqual({
        [NAME]: {
          move: {
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
        move: {
          request,
          inProgress: true,
          error: null,
          response: null
        }
      }

      expect(reducer(state, action).robot).toEqual({
        [NAME]: {
          move: {
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
