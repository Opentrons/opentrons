// server api tests
import configureMockStore from 'redux-mock-store'
import thunk from 'redux-thunk'

import client from '../client'
import {
  restartRobotServer
} from '..'

jest.mock('electron')
jest.mock('../client')

const middlewares = [thunk]
const mockStore = configureMockStore(middlewares)

const robot = {name: 'opentrons', ip: '1.2.3.4', port: '1234'}

describe('server API client', () => {
  beforeEach(() => client.__clearMock())

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
          payload: {robot, response, path: 'restart'}
        }
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
          payload: {robot, error, path: 'restart'}
        }
      ]

      client.__setMockError(error)

      return store.dispatch(restartRobotServer(robot))
        .then(() => expect(store.getActions()).toEqual(expectedActions))
    })
  })
})
