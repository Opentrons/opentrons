// @flow
import { TestScheduler } from 'rxjs/testing'

import { mockRobot } from '../../../robot-api/__fixtures__'
import * as RobotApiHttp from '../../../robot-api/http'
import * as DiscoverySelectors from '../../../discovery/selectors'
import * as Fixtures from '../../__fixtures__'
import * as Selectors from '../../selectors'
import * as Actions from '../../actions'
import * as Types from '../../types'
import { robotSettingsEpic } from '..'

import type { Observable } from 'rxjs'
import type { State } from '../../../types'
import type {
  RobotHost,
  RobotApiRequestOptions,
  RobotApiResponse,
} from '../../../robot-api/types'

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

describe('updateSettingEpic', () => {
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
  const action: Types.UpdateSettingAction = {
    ...Actions.updateSetting(mockRobot.name, 'setting-id', true),
    meta,
  }

  test('calls POST /settings', () => {
    testScheduler.run(({ hot, cold, expectObservable, flush }) => {
      mockFetchRobotApi.mockReturnValue(
        cold('r', { r: Fixtures.mockUpdateSettingSuccess })
      )

      const action$ = hot('--a', { a: action })
      const state$ = hot('a-a', { a: mockState })
      const output$ = robotSettingsEpic(action$, state$)

      expectObservable(output$)
      flush()

      expect(mockGetRobotByName).toHaveBeenCalledWith(mockState, mockRobot.name)
      expect(mockFetchRobotApi).toHaveBeenCalledWith(mockRobot, {
        method: 'POST',
        path: '/settings',
        body: { id: 'setting-id', value: true },
      })
    })
  })

  test('maps successful response to UPDATE_SETTING_SUCCESS', () => {
    testScheduler.run(({ hot, cold, expectObservable, flush }) => {
      mockFetchRobotApi.mockReturnValue(
        cold('r', { r: Fixtures.mockUpdateSettingSuccess })
      )

      const action$ = hot('--a', { a: action })
      const state$ = hot('a-a', { a: {} })
      const output$ = robotSettingsEpic(action$, state$)

      expectObservable(output$).toBe('--a', {
        a: Actions.updateSettingSuccess(
          mockRobot.name,
          Fixtures.mockUpdateSettingSuccess.body.settings,
          Fixtures.mockUpdateSettingSuccess.body.links.restart,
          { ...meta, response: Fixtures.mockUpdateSettingSuccessMeta }
        ),
      })
    })
  })

  test('maps failed response to UPDATE_SETTING_FAILURE', () => {
    testScheduler.run(({ hot, cold, expectObservable, flush }) => {
      mockFetchRobotApi.mockReturnValue(
        cold('r', { r: Fixtures.mockUpdateSettingFailure })
      )

      const action$ = hot('--a', { a: action })
      const state$ = hot('a-a', { a: {} })
      const output$ = robotSettingsEpic(action$, state$)

      expectObservable(output$).toBe('--a', {
        a: Actions.updateSettingFailure(
          mockRobot.name,
          { message: 'AH' },
          { ...meta, response: Fixtures.mockUpdateSettingFailureMeta }
        ),
      })
    })
  })
})
