// http api /calibration/** tests
import configureMockStore from 'redux-mock-store'
import thunk from 'redux-thunk'

import { client } from '../client'
import {
  superDeprecatedRobotApiReducer as reducer,
  startDeckCalibration,
  deckCalibrationCommand,
  makeGetDeckCalibrationStartState,
  makeGetDeckCalibrationCommandState,
} from '..'

jest.mock('../client')

const middlewares = [thunk]
const mockStore = configureMockStore(middlewares)

const NAME = 'opentrons-dev'

describe('/calibration/**', () => {
  let robot
  let state
  let store

  beforeEach(() => {
    client.__clearMock()

    robot = { name: NAME, ip: '1.2.3.4', port: '1234' }
    state = { superDeprecatedRobotApi: { calibration: {} } }
    store = mockStore(state)
  })

  describe('startDeckCalibration action creator', () => {
    const path = 'calibration/deck/start'
    const response = {
      token: 'token',
      pipette: { mount: 'left', model: 'p300_single_v1' },
    }

    test('calls POST /calibration/deck/start', () => {
      const expected = { force: false }

      client.__setMockResponse(response)

      return store
        .dispatch(startDeckCalibration(robot))
        .then(() =>
          expect(client).toHaveBeenCalledWith(
            robot,
            'POST',
            'calibration/deck/start',
            expected
          )
        )
    })

    test('calls POST /calibration/deck/start with force: true', () => {
      const expected = { force: true }

      client.__setMockResponse(response)

      return store
        .dispatch(startDeckCalibration(robot, true))
        .then(() =>
          expect(client).toHaveBeenCalledWith(
            robot,
            'POST',
            'calibration/deck/start',
            expected
          )
        )
    })

    test('dispatches api:REQUEST and api:SUCCESS', () => {
      const request = { force: false }
      const expectedActions = [
        { type: 'api:REQUEST', payload: { robot, request, path } },
        { type: 'api:SUCCESS', payload: { robot, response, path } },
      ]

      client.__setMockResponse(response)

      return store
        .dispatch(startDeckCalibration(robot))
        .then(() => expect(store.getActions()).toEqual(expectedActions))
    })

    test('dispatches api:REQUEST and api:FAILURE', () => {
      const request = { force: false }
      const error = { name: 'ResponseError', status: 409, message: '' }
      const expectedActions = [
        { type: 'api:REQUEST', payload: { robot, request, path } },
        { type: 'api:FAILURE', payload: { robot, error, path } },
      ]

      client.__setMockError(error)

      return store
        .dispatch(startDeckCalibration(robot))
        .then(() => expect(store.getActions()).toEqual(expectedActions))
    })
  })

  describe('deckCalibrationCommand action creator', () => {
    const path = 'calibration/deck'
    const token = 'mock-token'
    const request = { command: 'save z' }
    const response = { message: 'mock-response' }

    beforeEach(() => {
      state.superDeprecatedRobotApi.calibration[NAME] = {
        'calibration/deck/start': { response: { token } },
      }
    })

    test('calls POST /calibration/deck and adds token to request', () => {
      client.__setMockResponse(response)

      return store
        .dispatch(deckCalibrationCommand(robot, request))
        .then(() =>
          expect(client).toHaveBeenCalledWith(
            robot,
            'POST',
            'calibration/deck',
            { ...request, token }
          )
        )
    })

    test('dispatches api:REQUEST and api:SUCCESS', () => {
      const expectedActions = [
        { type: 'api:REQUEST', payload: { robot, request, path } },
        { type: 'api:SUCCESS', payload: { robot, response, path } },
      ]

      client.__setMockResponse(response)

      return store
        .dispatch(deckCalibrationCommand(robot, request))
        .then(() => expect(store.getActions()).toEqual(expectedActions))
    })

    test('dispatches api:REQUEST and api:FAILURE', () => {
      const error = { name: 'ResponseError', message: 'AH' }
      const expectedActions = [
        { type: 'api:REQUEST', payload: { robot, request, path } },
        { type: 'api:FAILURE', payload: { robot, error, path } },
      ]

      client.__setMockError(error)

      return store
        .dispatch(deckCalibrationCommand(robot, request))
        .then(() => expect(store.getActions()).toEqual(expectedActions))
    })

    test('dispatchs api:CLEAR_RESPONSE if command is "release"', () => {
      const request = { command: 'release' }
      const expectedActions = [
        {
          type: 'api:CLEAR_RESPONSE',
          payload: { robot, path: 'calibration/deck/start' },
        },
        { type: 'api:REQUEST', payload: { robot, request, path } },
        { type: 'api:SUCCESS', payload: { robot, response, path } },
      ]

      client.__setMockResponse(response)

      return store
        .dispatch(deckCalibrationCommand(robot, request))
        .then(() => expect(store.getActions()).toEqual(expectedActions))
    })
  })

  describe('reducer with api-call actions', () => {
    beforeEach(() => {
      state = state.superDeprecatedRobotApi
    })

    const REDUCER_REQUEST_RESPONSE_TESTS = [
      {
        path: 'calibration/deck/start',
        request: {},
        response: {
          token: 'token',
          pipette: { mount: 'left', model: 'p300_single_v1' },
        },
      },
      {
        path: 'calibration/deck',
        request: { command: 'save transform' },
        response: { message: 'saved' },
      },
    ]

    REDUCER_REQUEST_RESPONSE_TESTS.forEach(spec => {
      const { path, request, response } = spec

      // TODO(mc, 2019-04-23): these tests (and the module they test) are
      // brittle; rewrite tests when HTTP request state is redone
      describe(`reducer with /calibration/${path}`, () => {
        test('handles api:REQUEST', () => {
          const action = {
            type: 'api:REQUEST',
            payload: { path, robot, request },
          }

          expect(reducer(state, action).calibration).toMatchObject({
            [NAME]: {
              [path]: {
                request,
                inProgress: true,
                error: null,
                response: null,
              },
            },
          })
        })

        test('handles api:SUCCESS', () => {
          const action = {
            type: 'api:SUCCESS',
            payload: { path, robot, response },
          }

          state.calibration[NAME] = {
            [path]: {
              request,
              inProgress: true,
              error: null,
              response: null,
            },
          }

          expect(reducer(state, action).calibration).toEqual({
            [NAME]: {
              [path]: {
                request,
                response,
                inProgress: false,
                error: null,
              },
            },
          })
        })

        test('handles api:FAILURE', () => {
          const error = { message: 'we did not do it!' }
          const action = {
            type: 'api:FAILURE',
            payload: { path, robot, error },
          }

          state.calibration[NAME] = {
            [path]: {
              request,
              inProgress: true,
              error: null,
              response: null,
            },
          }

          expect(reducer(state, action).calibration).toEqual({
            [NAME]: {
              [path]: {
                request,
                error,
                response: null,
                inProgress: false,
              },
            },
          })
        })
      })
    })
  })

  test('reducer with api:CLEAR_RESPONSE', () => {
    state = state.superDeprecatedRobotApi

    const path = 'calibration/deck/start'
    const action = { type: 'api:CLEAR_RESPONSE', payload: { robot, path } }

    state.calibration[NAME] = {
      [path]: {
        inProgress: false,
        request: {},
        response: 'foo',
        error: 'bar',
      },
    }

    expect(reducer(state, action).calibration[NAME][path]).toEqual({
      inProgress: false,
      request: {},
      response: null,
      error: null,
    })
  })

  describe('selectors', () => {
    beforeEach(() => {
      state.superDeprecatedRobotApi.calibration[NAME] = {
        'calibration/deck': { inProgress: true },
        'calibration/deck/start': { inProgress: true },
      }
    })

    test('makeGetDeckCalibrationStartState', () => {
      const getStartState = makeGetDeckCalibrationStartState()

      expect(getStartState(state, robot)).toEqual(
        state.superDeprecatedRobotApi.calibration[NAME][
          'calibration/deck/start'
        ]
      )

      expect(getStartState(state, { name: 'foo' })).toEqual({
        inProgress: false,
      })
    })

    test('makeGetDeckCalibrationCommandState', () => {
      const getCommandState = makeGetDeckCalibrationCommandState()

      expect(getCommandState(state, robot)).toEqual(
        state.superDeprecatedRobotApi.calibration[NAME]['calibration/deck']
      )

      expect(getCommandState(state, { name: 'foo' })).toEqual({
        inProgress: false,
      })
    })
  })
})
