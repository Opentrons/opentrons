// health api tests
import configureMockStore from 'redux-mock-store'
import thunk from 'redux-thunk'

import client from '../client'
import {fetchHealth, reducer, selectHealth} from '..'

jest.mock('../client')

const middlewares = [thunk]
const mockStore = configureMockStore(middlewares)

const robot = {name: 'opentrons', ip: '1.2.3.4', port: '1234'}

describe('health', () => {
  beforeEach(() => client.__clearMock())

  test('selectHealth returns health substate', () => {
    const state = {
      api: {
        health: {
          opentrons: {
            inProgress: true,
            error: null,
            response: {api_version: '1.2.3', fw_version: '4.5.6'}
          }
        }
      }
    }

    expect(selectHealth(state)).toBe(state.api.health)
  })

  test('fetchHealth calls GET /health', () => {
    const health = {api_version: '1.2.3', fw_version: '4.5.6'}

    client.__setMockResponse(health)

    return fetchHealth(robot)(() => {})
      .then(() => expect(client).toHaveBeenCalledWith(robot, 'GET', 'health'))
  })

  test('fetchHealth dispatches HEALTH_REQUEST and HEALTH_SUCCESS', () => {
    const health = {api_version: '1.2.3', fw_version: '4.5.6'}
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
        opentrons: {
          inProgress: false,
          error: new Error('AH'),
          response: {api_version: '1.2.3', fw_version: '4.5.6'}
        }
      }
    }
    const action = {type: 'api:HEALTH_REQUEST', payload: {robot}}

    expect(reducer(state, action).health).toEqual({
      opentrons: {
        inProgress: true,
        error: null,
        response: {api_version: '1.2.3', fw_version: '4.5.6'}
      }
    })
  })

  test('reducer handles HEALTH_SUCCESS', () => {
    const health = {api_version: '4.5.6', fw_version: '7.8.9'}
    const state = {
      health: {
        opentrons: {
          inProgress: true,
          error: null,
          response: {api_version: '1.2.3', fw_version: '4.5.6'}
        }
      }
    }
    const action = {type: 'api:HEALTH_SUCCESS', payload: {robot, health}}

    expect(reducer(state, action).health).toEqual({
      opentrons: {
        inProgress: false,
        error: null,
        response: {api_version: '4.5.6', fw_version: '7.8.9'}
      }
    })
  })

  test('reducer handles HEALTH_FAILURE', () => {
    const error = new Error('AH')
    const state = {
      health: {
        opentrons: {
          inProgress: true,
          error: null,
          response: {api_version: '1.2.3', fw_version: '4.5.6'}
        }
      }
    }
    const action = {type: 'api:HEALTH_FAILURE', payload: {robot, error}}

    expect(reducer(state, action).health).toEqual({
      opentrons: {
        inProgress: false,
        error,
        response: {api_version: '1.2.3', fw_version: '4.5.6'}
      }
    })
  })
})
