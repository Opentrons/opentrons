// pipettes api tests
import configureMockStore from 'redux-mock-store'
import thunk from 'redux-thunk'

import client from '../client'
import {fetchPipettes, makeGetRobotPipettes} from '..'

jest.mock('../client')

const middlewares = [thunk]
const mockStore = configureMockStore(middlewares)

const NAME = 'opentrons-dev'

describe('pipettes', () => {
  let robot
  let pipettes
  let state
  let store

  beforeEach(() => {
    client.__clearMock()

    robot = {name: NAME, ip: '1.2.3.4', port: '1234'}
    pipettes = {
      left: {model: 'p300_single', mount_axis: 'z', plunger_axis: 'b'},
      right: {model: 'p10_multi', mount_axis: 'a', plunger_axis: 'c'},
    }

    state = {api: {api: {}}}
    store = mockStore(state)
  })

  describe('action creators', () => {
    test('fetchPipettes calls GET /pipettes', () => {
      client.__setMockResponse(pipettes)

      return store.dispatch(fetchPipettes(robot))
        .then(() => expect(client)
          .toHaveBeenCalledWith(robot, 'GET', 'pipettes'))
    })

    test('fetchPipettes with refresh calls GET /pipettes?refresh=true', () => {
      client.__setMockResponse(pipettes)

      return store.dispatch(fetchPipettes(robot, true))
        .then(() => expect(client)
          .toHaveBeenCalledWith(robot, 'GET', 'pipettes?refresh=true'))
    })

    test('dispatches api:REQUEST and api:SUCCESS', () => {
      const path = 'pipettes'
      const request = null
      const response = {pipettes}
      const expectedActions = [
        {type: 'api:REQUEST', payload: {robot, request, path}},
        {type: 'api:SUCCESS', payload: {robot, response, path}},
      ]

      client.__setMockResponse(response)

      return store.dispatch(fetchPipettes(robot))
        .then(() => expect(store.getActions()).toEqual(expectedActions))
    })
  })

  describe('selectors', () => {
    beforeEach(() => {
      state.api.api[NAME] = {
        pipettes: {inProgress: true},
      }
    })

    test('makeGetRobotPipettes with existing robot', () => {
      const getRobotPipettes = makeGetRobotPipettes()

      expect(getRobotPipettes(state, robot))
        .toEqual(state.api.api[NAME].pipettes)
      expect(getRobotPipettes(state, {name: 'foo'})).toEqual({inProgress: false})
    })

    test('makeGetRobotPipettes with non-existent robot', () => {
      const getRobotPipettes = makeGetRobotPipettes()

      expect(getRobotPipettes(state, 'foo')).toEqual({inProgress: false})
    })
  })
})
