// @flow
import { TestScheduler } from 'rxjs/testing'

import * as RobotApiHttp from '../../robot-api/http'
import * as DiscoverySelectors from '../../discovery/selectors'
import * as SettingsSelectors from '../../robot-settings/selectors'
import * as DiscoveryActions from '../../discovery/actions'
import * as Fixtures from '../__fixtures__'
import * as Actions from '../actions'
import { robotAdminEpic } from '../epic'

import type { Observable } from 'rxjs'
import type {
  RobotHost,
  RobotApiRequestOptions,
  RobotApiResponse,
} from '../../robot-api/types'

jest.mock('../../robot-api/http')
jest.mock('../../discovery/selectors')
jest.mock('../../robot-settings/selectors')

const mockFetchRobotApi: JestMockFn<
  [RobotHost, RobotApiRequestOptions],
  Observable<RobotApiResponse>
> = RobotApiHttp.fetchRobotApi

const mockGetRobotByName: JestMockFn<[any, string], mixed> =
  DiscoverySelectors.getRobotByName

const mockGetRestartPath: JestMockFn<[any, string], string | null> =
  SettingsSelectors.getRobotRestartPath

const { mockRobot } = Fixtures
const mockState = { state: true }

describe('robotAdminEpic', () => {
  let testScheduler

  beforeEach(() => {
    mockGetRobotByName.mockReturnValue(mockRobot)

    testScheduler = new TestScheduler((actual, expected) => {
      expect(actual).toEqual(expected)
    })
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('handles RESTART', () => {
    const action = Actions.restartRobot(mockRobot.name)
    const expectedRequest = { method: 'POST', path: '/server/restart' }

    it('calls POST /server/restart', () => {
      testScheduler.run(({ hot, cold, expectObservable, flush }) => {
        mockFetchRobotApi.mockReturnValue(
          cold('r', { r: Fixtures.mockRestartSuccess })
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

    it('calls POST with restart path in settings capabilities', () => {
      testScheduler.run(({ hot, cold, expectObservable, flush }) => {
        mockFetchRobotApi.mockReturnValue(
          cold('r', { r: Fixtures.mockRestartSuccess })
        )
        mockGetRestartPath.mockReturnValue('/restart')

        const expectedRequest = { method: 'POST', path: '/restart' }
        const action$ = hot('--a', { a: action })
        const state$ = hot('a-a', { a: mockState })
        const output$ = robotAdminEpic(action$, state$)

        expectObservable(output$)
        flush()

        expect(mockGetRestartPath).toHaveBeenCalledWith(
          mockState,
          mockRobot.name
        )
        expect(mockFetchRobotApi).toHaveBeenCalledWith(
          mockRobot,
          expectedRequest
        )
      })
    })

    it('maps successful response to RESTART_ROBOT_SUCCESS', () => {
      testScheduler.run(({ hot, cold, expectObservable, flush }) => {
        mockFetchRobotApi.mockReturnValue(
          cold('r', { r: Fixtures.mockRestartSuccess })
        )

        const action$ = hot('--a', { a: action })
        const state$ = hot('a-a', { a: {} })
        const output$ = robotAdminEpic(action$, state$)

        expectObservable(output$).toBe('--a', {
          a: Actions.restartRobotSuccess(mockRobot.name, {
            response: Fixtures.mockRestartSuccessMeta,
          }),
        })
      })
    })

    it('maps failed response to RESTART_ROBOT_FAILURE', () => {
      testScheduler.run(({ hot, cold, expectObservable, flush }) => {
        mockFetchRobotApi.mockReturnValue(
          cold('r', { r: Fixtures.mockRestartFailure })
        )

        const action$ = hot('--a', { a: action })
        const state$ = hot('a-a', { a: {} })
        const output$ = robotAdminEpic(action$, state$)

        expectObservable(output$).toBe('--a', {
          a: Actions.restartRobotFailure(
            mockRobot.name,
            { message: 'AH' },
            { response: Fixtures.mockRestartFailureMeta }
          ),
        })
      })
    })

    it('starts discovery on RESTART_SUCCESS', () => {
      const action = Actions.restartRobotSuccess(mockRobot.name, {})

      testScheduler.run(({ hot, expectObservable }) => {
        const action$ = hot('-a', { a: action })
        const state$ = hot('a-', { a: mockState })
        const output$ = robotAdminEpic(action$, state$)

        expectObservable(output$).toBe('-a', {
          a: DiscoveryActions.startDiscovery(60000),
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
