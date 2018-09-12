// pipettes api tests
import configureMockStore from 'redux-mock-store'
import thunk from 'redux-thunk'

import client from '../client'
import {reducer, fetchPipettes, makeGetRobotPipettes} from '..'

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

    state = {api: {pipettes: {}}}
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

    test('fetchPipettes dispatches PIPETTES_REQUEST + SUCCESS', () => {
      const expectedActions = [
        {type: 'api:PIPETTES_REQUEST', payload: {robot}},
        {type: 'api:PIPETTES_SUCCESS', payload: {robot, pipettes}},
      ]

      client.__setMockResponse(pipettes)

      return store.dispatch(fetchPipettes(robot))
        .then(() => expect(store.getActions()).toEqual(expectedActions))
    })

    test('fetchPipettes dispatches PIPETTES_REQUEST + FAILURE', () => {
      const error = new Error('AH')
      const expectedActions = [
        {type: 'api:PIPETTES_REQUEST', payload: {robot}},
        {type: 'api:PIPETTES_FAILURE', payload: {robot, error}},
      ]

      client.__setMockError(error)

      return store.dispatch(fetchPipettes(robot))
        .then(() => expect(store.getActions()).toEqual(expectedActions))
    })
  })

  describe('reducer', () => {
    beforeEach(() => {
      state = state.api
    })

    test('handles PIPETTE_REQUEST with new robot', () => {
      const action = {type: 'api:PIPETTES_REQUEST', payload: {robot}}

      expect(reducer(state, action).pipettes).toEqual({
        [NAME]: {inProgress: true, error: null},
      })
    })

    test('handles PIPETTE_REQUEST with existing robot', () => {
      state.pipettes[NAME] = {
        inProgress: false,
        error: new Error('AH'),
        response: pipettes,
      }

      const action = {type: 'api:PIPETTES_REQUEST', payload: {robot}}

      expect(reducer(state, action).pipettes).toEqual({
        [NAME]: {inProgress: true, error: null, response: pipettes},
      })
    })

    test('handles PIPETTE_SUCCESS', () => {
      state.pipettes[NAME] = {
        inProgress: true,
        error: null,
        response: null,
      }

      const action = {type: 'api:PIPETTES_SUCCESS', payload: {robot, pipettes}}

      expect(reducer(state, action).pipettes).toEqual({
        [NAME]: {inProgress: false, error: null, response: pipettes},
      })
    })

    test('handles PIPETTES_FAILURE', () => {
      state.pipettes[NAME] = {
        inProgress: true,
        error: null,
        response: pipettes,
      }

      const error = new Error('AH')
      const action = {type: 'api:PIPETTES_FAILURE', payload: {robot, error}}

      expect(reducer(state, action).pipettes).toEqual({
        [NAME]: {inProgress: false, response: pipettes, error},
      })
    })
  })

  describe('selectors', () => {
    test('makeGetRobotPipettes with exiting robot', () => {
      const getRobotPipettes = makeGetRobotPipettes()
      const robotPipettes = {
        inProgress: false,
        error: null,
        response: pipettes,
      }

      state.api.pipettes[NAME] = robotPipettes
      expect(getRobotPipettes(state, robot)).toEqual(robotPipettes)
    })

    test('makeGetRobotPipettes with non-existent robot', () => {
      const getRobotPipettes = makeGetRobotPipettes()

      expect(getRobotPipettes(state, robot)).toEqual({
        inProgress: false,
        error: null,
        response: null,
      })
    })
  })
})
