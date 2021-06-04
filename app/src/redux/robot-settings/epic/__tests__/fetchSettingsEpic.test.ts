import { TestScheduler } from 'rxjs/testing'

import { mockRobot } from '../../../robot-api/__fixtures__'
import * as RobotApiHttp from '../../../robot-api/http'
import * as DiscoverySelectors from '../../../discovery/selectors'
import * as Fixtures from '../../__fixtures__'
import * as Selectors from '../../selectors'
import * as Actions from '../../actions'
import * as Types from '../../types'
import { robotSettingsEpic } from '..'

import type { Action, State } from '../../../types'
import type { RobotApiRequestMeta } from '../../../robot-api/types'

jest.mock('../../../robot-api/http')
jest.mock('../../../discovery/selectors')
jest.mock('../../selectors')

const mockState: State = { state: true } as any

const mockFetchRobotApi = RobotApiHttp.fetchRobotApi as jest.MockedFunction<
  typeof RobotApiHttp.fetchRobotApi
>

const mockGetRobotByName = DiscoverySelectors.getRobotByName as jest.MockedFunction<
  typeof DiscoverySelectors.getRobotByName
>

const mockGetAllRestartRequiredRobots = Selectors.getAllRestartRequiredRobots as jest.MockedFunction<
  typeof Selectors.getAllRestartRequiredRobots
>

describe('fetchSettingsEpic', () => {
  let testScheduler: TestScheduler

  beforeEach(() => {
    mockGetRobotByName.mockReturnValue(mockRobot as any)
    mockGetAllRestartRequiredRobots.mockReturnValue([])

    testScheduler = new TestScheduler((actual, expected) => {
      expect(actual).toEqual(expected)
    })
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  const meta: RobotApiRequestMeta = { requestId: '1234' } as any
  const action: Types.FetchSettingsAction = {
    ...Actions.fetchSettings(mockRobot.name),
    meta,
  }

  it('calls GET /settings', () => {
    testScheduler.run(({ hot, cold, expectObservable, flush }) => {
      mockFetchRobotApi.mockReturnValue(
        cold('r', { r: Fixtures.mockFetchSettingsSuccess })
      )

      const action$ = hot<Action>('--a', { a: action })
      const state$ = hot<State>('a-a', { a: mockState })
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

      const action$ = hot<Action>('--a', { a: action })
      const state$ = hot<State>('a-a', { a: {} } as any)
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

      const action$ = hot<Action>('--a', { a: action })
      const state$ = hot<State>('a-a', { a: {} } as any)
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
