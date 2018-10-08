// health api tests
import configureMockStore from 'redux-mock-store'
import thunk from 'redux-thunk'

import client from '../client'
import {fetchHealth, makeGetRobotHealth} from '..'

jest.mock('../client')

const middlewares = [thunk]
const mockStore = configureMockStore(middlewares)

const path = 'health'
const name = 'opentrons-dev'
const robot = {name, ip: '1.2.3.4', port: '1234'}
const response = {name, api_version: '1.2.3', fw_version: '4.5.6'}

describe('health', () => {
  beforeEach(() => client.__clearMock())

  test('makeGetRobotHealth returns health of existing robot', () => {
    const state = {
      api: {
        api: {
          [name]: {
            [path]: {
              inProgress: true,
              error: null,
              response: {name, api_version: '1.2.3', fw_version: '4.5.6'},
            },
          },
        },
      },
    }

    const getRobotHealth = makeGetRobotHealth()

    expect(getRobotHealth(state, {name})).toEqual({
      inProgress: true,
      error: null,
      response: {name, api_version: '1.2.3', fw_version: '4.5.6'},
    })
  })

  test('makeGetRobotHealth returns health of non-robot', () => {
    const state = {
      api: {
        api: {
          health: {},
        },
      },
    }

    const getRobotHealth = makeGetRobotHealth()

    expect(getRobotHealth(state, {name})).toEqual({inProgress: false})
  })

  test('fetchHealth calls GET /health', () => {
    client.__setMockResponse(response)

    return fetchHealth(robot)(() => {}).then(
      () => expect(client).toHaveBeenCalledWith(robot, 'GET', 'health', null)
    )
  })

  test('fetchHealth dispatches api:REQUEST and api:SUCCESS', () => {
    const store = mockStore({})
    const expectedActions = [
      {type: 'api:REQUEST', payload: {robot, path, request: null}},
      {type: 'api:SUCCESS', payload: {robot, path, response}},
    ]

    client.__setMockResponse(response)

    return store.dispatch(fetchHealth(robot))
      .then(() => expect(store.getActions()).toEqual(expectedActions))
  })

  test('fetchHealth dispatches api:REQUEST and api:FAILURE', () => {
    const error = new Error('AH')
    const store = mockStore({})
    const expectedActions = [
      {type: 'api:REQUEST', payload: {robot, path, request: null}},
      {type: 'api:FAILURE', payload: {robot, path, error}},
    ]

    client.__setMockError(error)

    return store.dispatch(fetchHealth(robot))
      .then(() => expect(store.getActions()).toEqual(expectedActions))
  })
})
