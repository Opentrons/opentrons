// http api /settings tests
import configureMockStore from 'redux-mock-store'
import thunk from 'redux-thunk'

import client from '../client'
import {fetchSettings, setSettings, makeGetRobotSettings} from '..'

jest.mock('../client')

const middlewares = [thunk]
const mockStore = configureMockStore(middlewares)

const NAME = 'opentrons-dev'

describe('/settings', () => {
  let robot
  let state
  let store

  beforeEach(() => {
    client.__clearMock()

    robot = {name: NAME, ip: '1.2.3.4', port: '1234'}
    state = {api: {api: {}}}
    store = mockStore(state)
  })

  describe('fetchSettings action creator', () => {
    const path = 'settings'
    const response = {
      settings: [{id: 'i', title: 't', description: 'd', value: true}]
    }

    test('calls GET /settings', () => {
      client.__setMockResponse(response)

      return store.dispatch(fetchSettings(robot))
        .then(() =>
          expect(client).toHaveBeenCalledWith(robot, 'GET', 'settings', null))
    })

    test('dispatches api:REQUEST and api:SUCCESS', () => {
      const request = null
      const expectedActions = [
        {type: 'api:REQUEST', payload: {robot, request, path}},
        {type: 'api:SUCCESS', payload: {robot, response, path}}
      ]

      client.__setMockResponse(response)

      return store.dispatch(fetchSettings(robot))
        .then(() => expect(store.getActions()).toEqual(expectedActions))
    })

    test('dispatches api:REQUEST and api:FAILURE', () => {
      const request = null
      const error = {name: 'ResponseError', status: 500, message: ''}
      const expectedActions = [
        {type: 'api:REQUEST', payload: {robot, request, path}},
        {type: 'api:FAILURE', payload: {robot, error, path}}
      ]

      client.__setMockError(error)

      return store.dispatch(fetchSettings(robot))
        .then(() => expect(store.getActions()).toEqual(expectedActions))
    })
  })

  describe('setSettings action creator', () => {
    const path = 'settings'
    const response = {
      settings: [{id: 'i', title: 't', description: 'd', value: true}]
    }

    test('calls GET /settings', () => {
      const request = {id: 'i', value: true}

      client.__setMockResponse(response)

      return store.dispatch(setSettings(robot, request))
        .then(() =>
          expect(client).toHaveBeenCalledWith(robot, 'POST', 'settings', request))
    })

    test('dispatches api:REQUEST and api:SUCCESS', () => {
      const request = {id: 'i', value: true}
      const expectedActions = [
        {type: 'api:REQUEST', payload: {robot, request, path}},
        {type: 'api:SUCCESS', payload: {robot, response, path}}
      ]

      client.__setMockResponse(response)

      return store.dispatch(setSettings(robot, request))
        .then(() => expect(store.getActions()).toEqual(expectedActions))
    })

    test('dispatches api:REQUEST and api:FAILURE', () => {
      const request = {id: 'i', value: true}
      const error = {name: 'ResponseError', status: 500, message: ''}
      const expectedActions = [
        {type: 'api:REQUEST', payload: {robot, request, path}},
        {type: 'api:FAILURE', payload: {robot, error, path}}
      ]

      client.__setMockError(error)

      return store.dispatch(setSettings(robot, request))
        .then(() => expect(store.getActions()).toEqual(expectedActions))
    })
  })

  describe('selectors', () => {
    beforeEach(() => {
      state.api.api[NAME] = {
        settings: {inProgress: true}
      }
    })

    test('makeGetRobotSettings', () => {
      const getSettings = makeGetRobotSettings()

      expect(getSettings(state, robot))
        .toEqual(state.api.api[NAME].settings)

      expect(getSettings(state, {name: 'foo'})).toEqual({inProgress: false})
    })

    test('makeGetRobotSettings with bad response', () => {
      const getSettings = makeGetRobotSettings()

      state.api.api[NAME].settings.response = {foo: 'bar'}

      expect(getSettings(state, robot)).toEqual({
        ...state.api.api[NAME].settings,
        response: {settings: []}
      })
    })
  })
})
