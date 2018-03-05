// health api tests
import configureMockStore from 'redux-mock-store'
import thunk from 'redux-thunk'

import client from '../client'
import {fetchHealth, reducer, makeGetRobotHealth} from '..'

jest.mock('../client')

const middlewares = [thunk]
const mockStore = configureMockStore(middlewares)

const name = 'opentrons-dev'
const robot = {name, ip: '1.2.3.4', port: '1234'}
const health = {name, api_version: '1.2.3', fw_version: '4.5.6'}

describe('health', () => {
  beforeEach(() => client.__clearMock())

  test('makeGetRobotHealth returns health of existing robot', () => {
    const state = {
      api: {
        health: {
          [name]: {
            inProgress: true,
            error: null,
            response: {name, api_version: '1.2.3', fw_version: '4.5.6'}
          }
        }
      }
    }

    const getRobotHealth = makeGetRobotHealth()

    expect(getRobotHealth(state, {name})).toEqual({
      inProgress: true,
      error: null,
      response: {name, api_version: '1.2.3', fw_version: '4.5.6'}
    })
  })

  test('makeGetRobotHealth returns health of non-robot', () => {
    const state = {
      api: {
        health: {}
      }
    }

    const getRobotHealth = makeGetRobotHealth()

    expect(getRobotHealth(state, {name})).toEqual({
      inProgress: false,
      error: null,
      response: null
    })
  })

  test('fetchHealth calls GET /health', () => {
    client.__setMockResponse(health)

    return fetchHealth(robot)(() => {})
      .then(() => expect(client).toHaveBeenCalledWith(robot, 'GET', 'health'))
  })

  test('fetchHealth dispatches HEALTH_REQUEST and HEALTH_SUCCESS', () => {
    const store = mockStore({})
    const expectedActions = [
      {type: 'api:HEALTH_REQUEST', payload: {robot}},
      {type: 'api:HEALTH_SUCCESS', payload: {robot, health}}
    ]

    client.__setMockResponse(health)

    return store.dispatch(fetchHealth(robot))
      .then(() => expect(store.getActions()).toEqual(expectedActions))
  })

  test('fetchHealth dispatches HEALTH_REQUEST and HEALTH_FAILURE', () => {
    const error = new Error('AH')
    const store = mockStore({})
    const expectedActions = [
      {type: 'api:HEALTH_REQUEST', payload: {robot}},
      {type: 'api:HEALTH_FAILURE', payload: {robot, error}}
    ]

    client.__setMockError(error)

    return store.dispatch(fetchHealth(robot))
      .then(() => expect(store.getActions()).toEqual(expectedActions))
  })

  test('reducer handles HEALTH_REQUEST', () => {
    const state = {
      health: {
        [name]: {
          inProgress: false,
          error: new Error('AH'),
          response: {name, api_version: '1.2.3', fw_version: '4.5.6'}
        }
      }
    }
    const action = {type: 'api:HEALTH_REQUEST', payload: {robot}}

    expect(reducer(state, action).health).toEqual({
      [name]: {
        inProgress: true,
        error: null,
        response: {name, api_version: '1.2.3', fw_version: '4.5.6'}
      }
    })
  })

  test('reducer handles HEALTH_SUCCESS', () => {
    const health = {name, api_version: '4.5.6', fw_version: '7.8.9'}
    const state = {
      health: {
        [name]: {
          inProgress: true,
          error: null,
          response: {name, api_version: '1.2.3', fw_version: '4.5.6'}
        }
      }
    }
    const action = {type: 'api:HEALTH_SUCCESS', payload: {robot, health}}

    expect(reducer(state, action).health).toEqual({
      [name]: {
        inProgress: false,
        error: null,
        response: {name, api_version: '4.5.6', fw_version: '7.8.9'}
      }
    })
  })

  test('reducer handles HEALTH_FAILURE', () => {
    const error = new Error('AH')
    const state = {
      health: {
        [name]: {
          inProgress: true,
          error: null,
          response: {name, api_version: '1.2.3', fw_version: '4.5.6'}
        }
      }
    }
    const action = {type: 'api:HEALTH_FAILURE', payload: {robot, error}}

    expect(reducer(state, action).health).toEqual({
      [name]: {
        inProgress: false,
        error,
        response: {name, api_version: '1.2.3', fw_version: '4.5.6'}
      }
    })
  })
})
