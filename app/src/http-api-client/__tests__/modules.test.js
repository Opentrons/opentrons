// http api /modules tests
import configureMockStore from 'redux-mock-store'
import thunk from 'redux-thunk'

import client from '../client'
import {fetchModules, makeGetRobotModules} from '..'

jest.mock('../client')

const middlewares = [thunk]
const mockStore = configureMockStore(middlewares)

const NAME = 'opentrons-dev'

const modules = [
  {
    model: 'model',
    serial: 'serial',
    fwVersion: 'fwVersion',
    status: 'status',
    displayName: 'displayName',
  },
]

describe('/modules', () => {
  let robot
  let state
  let store

  beforeEach(() => {
    client.__clearMock()

    robot = {name: NAME, ip: '1.2.3.4', port: '1234'}
    state = {api: {api: {}}}
    store = mockStore(state)
  })

  describe('fetchModules action creator', () => {
    const path = 'modules'
    const response = {modules}

    test('calls GET /modules', () => {
      client.__setMockResponse(response)

      return store.dispatch(fetchModules(robot))
        .then(() =>
          expect(client).toHaveBeenCalledWith(robot, 'GET', path))
    })

    test('dispatches api:REQUEST and api:SUCCESS', () => {
      const request = null
      const expectedActions = [
        {type: 'api:REQUEST', payload: {robot, request, path}},
        {type: 'api:SUCCESS', payload: {robot, response, path}},
      ]

      client.__setMockResponse(response)

      return store.dispatch(fetchModules(robot))
        .then(() => expect(store.getActions()).toEqual(expectedActions))
    })

    test('dispatches api:REQUEST and api:FAILURE', () => {
      const request = null
      const error = {name: 'ResponseError', status: 500, message: ''}
      const expectedActions = [
        {type: 'api:REQUEST', payload: {robot, request, path}},
        {type: 'api:FAILURE', payload: {robot, error, path}},
      ]

      client.__setMockError(error)

      return store.dispatch(fetchModules(robot))
        .then(() => expect(store.getActions()).toEqual(expectedActions))
    })
  })

  describe('selectors', () => {
    beforeEach(() => {
      state.api.api[NAME] = {
        modules: {inProgress: true},
      }
    })

    test('makeGetRobotModules', () => {
      const getModules = makeGetRobotModules()

      expect(getModules(state, robot)).toEqual(state.api.api[NAME].modules)
      expect(getModules(state, {name: 'foo'})).toEqual({inProgress: false})
    })
  })
})
