// @flow
import type { Observable } from 'rxjs'
import { TestScheduler } from 'rxjs/testing'

import { robotSettingsEpic } from '..'
import * as Fixtures from '../../__fixtures__'
import * as DiscoverySelectors from '../../../discovery/selectors'
import { mockRobot } from '../../../robot-api/__fixtures__'
import * as RobotApiHttp from '../../../robot-api/http'
import type {
  RobotApiRequestOptions,
  RobotApiResponse,
  RobotHost,
} from '../../../robot-api/types'
import type { State } from '../../../types'
import * as Actions from '../../actions'
import * as Selectors from '../../selectors'
import * as Types from '../../types'

jest.mock('../../../robot-api/http')
jest.mock('../../../discovery/selectors')
jest.mock('../../selectors')

const mockState = { state: true }

const mockFetchRobotApi: JestMockFn<
  [RobotHost, RobotApiRequestOptions],
  Observable<RobotApiResponse>
> = RobotApiHttp.fetchRobotApi

const mockGetRobotByName: JestMockFn<[any, string], mixed> =
  DiscoverySelectors.getRobotByName

const mockGetAllRestartRequiredRobots: JestMockFn<[State], Array<string>> =
  Selectors.getAllRestartRequiredRobots

describe('fetchSettingsEpic', () => {
  let testScheduler

  beforeEach(() => {
    mockGetRobotByName.mockReturnValue(mockRobot)
    mockGetAllRestartRequiredRobots.mockReturnValue([])

    testScheduler = new TestScheduler((actual, expected) => {
      expect(actual).toEqual(expected)
    })
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  const meta = { requestId: '1234' }
  const action: Types.FetchSettingsAction = {
    ...Actions.fetchSettings(mockRobot.name),
    meta,
  }

  it('calls GET /settings', () => {
    testScheduler.run(({ hot, cold, expectObservable, flush }) => {
      mockFetchRobotApi.mockReturnValue(
        cold('r', { r: Fixtures.mockFetchSettingsSuccess })
      )

      const action$ = hot('--a', { a: action })
      const state$ = hot('a-a', { a: mockState })
      const output$ = robotSettingsEpic(action$, state$)

      expectObservable(output$)
      flush()

      expect(mockGetRobotByName).toHaveBeenCalledWith(mockState, mockRobot.name)
      expect(mockFetchRobotApi).toHaveBeenCalledWith(mockRobot, {
        method: 'GET',
        path: '/settings',
      })
    })
  })

  it('maps successful response to FETCH_SETTINGS_SUCCESS', () => {
    testScheduler.run(({ hot, cold, expectObservable, flush }) => {
      mockFetchRobotApi.mockReturnValue(
        cold('r', { r: Fixtures.mockFetchSettingsSuccess })
      )

      const action$ = hot('--a', { a: action })
      const state$ = hot('a-a', { a: {} })
      const output$ = robotSettingsEpic(action$, state$)

      expectObservable(output$).toBe('--a', {
        a: Actions.fetchSettingsSuccess(
          mockRobot.name,
          Fixtures.mockFetchSettingsSuccess.body.settings,
          Fixtures.mockFetchSettingsSuccess.body.links.restart,
          { ...meta, response: Fixtures.mockFetchSettingsSuccessMeta }
        ),
      })
    })
  })

  it('maps failed response to FETCH_SETTINGS_FAILURE', () => {
    testScheduler.run(({ hot, cold, expectObservable, flush }) => {
      mockFetchRobotApi.mockReturnValue(
        cold('r', { r: Fixtures.mockFetchSettingsFailure })
      )

      const action$ = hot('--a', { a: action })
      const state$ = hot('a-a', { a: {} })
      const output$ = robotSettingsEpic(action$, state$)

      expectObservable(output$).toBe('--a', {
        a: Actions.fetchSettingsFailure(
          mockRobot.name,
          { message: 'AH' },
          { ...meta, response: Fixtures.mockFetchSettingsFailureMeta }
        ),
      })
    })
  })
})
