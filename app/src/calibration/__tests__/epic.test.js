// @flow
import { TestScheduler } from 'rxjs/testing'

import * as RobotApiHttp from '../../robot-api/http'
import * as DiscoverySelectors from '../../discovery/selectors'
import * as Fixtures from '../__fixtures__'
import * as Actions from '../actions'
import { calibrationEpic } from '../epic'
import type { Observable } from 'rxjs'
import type {
  RobotHost,
  RobotApiRequestOptions,
  RobotApiResponse,
} from '../../robot-api/types'

jest.mock('../../robot-api/http')
jest.mock('../../discovery/selectors')

const mockFetchRobotApi: JestMockFn<
  [RobotHost, RobotApiRequestOptions],
  Observable<RobotApiResponse>
> = RobotApiHttp.fetchRobotApi

const mockGetRobotByName: JestMockFn<[any, string], mixed> =
  DiscoverySelectors.getRobotByName

const mockRobot = Fixtures.mockRobot
const mockState = { state: true }

describe('calibrationEpics', () => {
  let testScheduler

  beforeEach(() => {
    testScheduler = new TestScheduler((actual, expected) => {
      expect(actual).toEqual(expected)
    })
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('handles explicit CREATE CHECK SESSION', () => {
    const action = Actions.createRobotCalibrationCheckSession(mockRobot.name)
    const expectedRequest = {
      method: 'POST',
      path: '/calibration/check/session',
    }

    it('calls POST /calibration/check/session', () => {
      testScheduler.run(({ hot, cold, expectObservable, flush }) => {
        mockFetchRobotApi.mockReturnValue(
          cold('r', { r: Fixtures.mockCreateCheckSessionSuccess })
        )

        const action$ = hot('--a', { a: action })
        const state$ = hot('a-a', { a: mockState })
        const output$ = calibrationEpic(action$, state$)

        expectObservable(output$)
        flush()

        expect(mockGetRobotByName).toHaveBeenCalledWith(
          mockState,
          mockRobot.name
        )
        expect(mockFetchRobotApi).toHaveBeenCalledWith(
          mockRobot,
          expectedRequest
        )
      })
    })

    it('maps successful response to CREATE_ROBOT_CALIBRATION_CHECK_SESSION_SUCCESS', () => {
      testScheduler.run(({ hot, cold, expectObservable, flush }) => {
        mockFetchRobotApi.mockReturnValue(
          cold('r', { r: Fixtures.mockCreateCheckSessionSuccess })
        )

        const action$ = hot('--a', { a: action })
        const state$ = hot('a-a', { a: {} })
        const output$ = calibrationEpic(action$, state$)

        expectObservable(output$).toBe('--a', {
          a: Actions.restartRobotSuccess(mockRobot.name, {
            response: Fixtures.mockCreateCheckSessionSuccessMeta,
          }),
        })
      })
    })

    it('maps failed response to CREATE_ROBOT_CALIBRATION_CHECK_SESSION_FAILURE', () => {
      testScheduler.run(({ hot, cold, expectObservable, flush }) => {
        mockFetchRobotApi.mockReturnValue(
          cold('r', { r: Fixtures.mockCreateCheckSessionFailure })
        )

        const action$ = hot('--a', { a: action })
        const state$ = hot('a-a', { a: {} })
        const output$ = calibrationEpic(action$, state$)

        expectObservable(output$).toBe('--a', {
          a: Actions.restartRobotFailure(
            mockRobot.name,
            { message: 'AH' },
            { response: Fixtures.mockRestartFailureMeta }
          ),
        })
      })
    })
  })

  describe('handles FETCH_RESET_CONFIG_OPTIONS', () => {
    const action = Actions.fetchResetConfigOptions(mockRobot.name)
    const expectedRequest = { method: 'GET', path: '/settings/reset/options' }

    it('calls GET /settings/reset/options', () => {
      testScheduler.run(({ hot, cold, expectObservable, flush }) => {
        mockFetchRobotApi.mockReturnValue(
          cold('r', { r: Fixtures.mockFetchResetOptionsSuccess })
        )

        const action$ = hot('--a', { a: action })
        const state$ = hot('a-a', { a: mockState })
        const output$ = robotAdminEpic(action$, state$)

        expectObservable(output$)
        flush()

        expect(mockGetRobotByName).toHaveBeenCalledWith(
          mockState,
          mockRobot.name
        )
        expect(mockFetchRobotApi).toHaveBeenCalledWith(
          mockRobot,
          expectedRequest
        )
      })
    })

    it('maps successful response to FETCH_RESET_CONFIG_OPTIONS_SUCCESS', () => {
      testScheduler.run(({ hot, cold, expectObservable, flush }) => {
        mockFetchRobotApi.mockReturnValue(
          cold('r', { r: Fixtures.mockFetchResetOptionsSuccess })
        )

        const action$ = hot('--a', { a: action })
        const state$ = hot('a-a', { a: {} })
        const output$ = robotAdminEpic(action$, state$)

        expectObservable(output$).toBe('--a', {
          a: Actions.fetchResetConfigOptionsSuccess(
            mockRobot.name,
            Fixtures.mockResetOptions,
            { response: Fixtures.mockFetchResetOptionsSuccessMeta }
          ),
        })
      })
    })

    it('maps failed response to FETCH_RESET_CONFIG_OPTIONS_FAILURE', () => {
      testScheduler.run(({ hot, cold, expectObservable, flush }) => {
        mockFetchRobotApi.mockReturnValue(
          cold('r', { r: Fixtures.mockFetchResetOptionsFailure })
        )

        const action$ = hot('--a', { a: action })
        const state$ = hot('a-a', { a: {} })
        const output$ = robotAdminEpic(action$, state$)

        expectObservable(output$).toBe('--a', {
          a: Actions.fetchResetConfigOptionsFailure(
            mockRobot.name,
            { message: 'AH' },
            { response: Fixtures.mockFetchResetOptionsFailureMeta }
          ),
        })
      })
    })
  })

  describe('handles RESET_CONFIG', () => {
    const action = Actions.resetConfig(mockRobot.name, {
      foo: true,
      bar: false,
    })

    it('calls POST /settings/reset', () => {
      const expectedRequest = {
        method: 'POST',
        path: '/settings/reset',
        body: { foo: true, bar: false },
      }

      testScheduler.run(({ hot, cold, expectObservable, flush }) => {
        mockFetchRobotApi.mockReturnValue(
          cold('r', { r: Fixtures.mockResetConfigSuccess })
        )

        const action$ = hot('--a', { a: action })
        const state$ = hot('a-a', { a: mockState })
        const output$ = robotAdminEpic(action$, state$)

        expectObservable(output$)
        flush()

        expect(mockGetRobotByName).toHaveBeenCalledWith(
          mockState,
          mockRobot.name
        )
        expect(mockFetchRobotApi).toHaveBeenCalledWith(
          mockRobot,
          expectedRequest
        )
      })
    })

    it('maps successful response to RESET_CONFIG_SUCCESS', () => {
      testScheduler.run(({ hot, cold, expectObservable, flush }) => {
        mockFetchRobotApi.mockReturnValue(
          cold('r', { r: Fixtures.mockResetConfigSuccess })
        )

        const action$ = hot('--a', { a: action })
        const state$ = hot('a-a', { a: {} })
        const output$ = robotAdminEpic(action$, state$)

        expectObservable(output$).toBe('--a', {
          a: Actions.resetConfigSuccess(mockRobot.name, {
            response: Fixtures.mockResetConfigSuccessMeta,
          }),
        })
      })
    })

    it('maps failed response to RESET_CONFIG_FAILURE', () => {
      testScheduler.run(({ hot, cold, expectObservable, flush }) => {
        mockFetchRobotApi.mockReturnValue(
          cold('r', { r: Fixtures.mockResetConfigFailure })
        )

        const action$ = hot('--a', { a: action })
        const state$ = hot('a-a', { a: {} })
        const output$ = robotAdminEpic(action$, state$)

        expectObservable(output$).toBe('--a', {
          a: Actions.resetConfigFailure(
            mockRobot.name,
            { message: 'AH' },
            { response: Fixtures.mockResetConfigFailureMeta }
          ),
        })
      })
    })

    it('dispatches RESTART on RESET_CONFIG_SUCCESS', () => {
      const action = Actions.resetConfigSuccess(mockRobot.name, {})

      testScheduler.run(({ hot, expectObservable }) => {
        const action$ = hot('-a', { a: action })
        const state$ = hot('a-', { a: mockState })
        const output$ = robotAdminEpic(action$, state$)

        expectObservable(output$).toBe('-a', {
          a: Actions.restartRobot(mockRobot.name),
        })
      })
    })
  })
})
