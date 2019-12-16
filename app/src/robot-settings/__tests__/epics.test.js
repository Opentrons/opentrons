// @flow
import { TestScheduler } from 'rxjs/testing'

import * as ApiUtils from '../../robot-api/deprecated'
import * as RobotAdminSelectors from '../../robot-admin/selectors'
import * as Actions from '../actions'
import * as Selectors from '../selectors'
import { robotSettingsEpic } from '../epic'

import type { State } from '../../types'
import type { RobotApiRequest, RequestMeta } from '../../robot-api/deprecated'

jest.mock('../../robot-api/deprecated')
jest.mock('../../robot-admin/selectors')
jest.mock('../selectors')

const mockMakeApiRequest: JestMockFn<[RobotApiRequest, RequestMeta], mixed> =
  ApiUtils.makeRobotApiRequest

const mockGetRobotAdminStatus: JestMockFn<[State, string], mixed> =
  RobotAdminSelectors.getRobotAdminStatus

const mockGetAllRestartRequiredRobots: JestMockFn<[State], Array<string>> =
  Selectors.getAllRestartRequiredRobots

const mockRobot = { name: 'robot', ip: '127.0.0.1', port: 31950 }

const setupMockMakeApiRequest = cold => {
  mockMakeApiRequest.mockImplementation((req, meta) =>
    cold('-a', { a: { req, meta } })
  )
}

describe('robotSettingsEpic', () => {
  let testScheduler

  beforeEach(() => {
    mockGetAllRestartRequiredRobots.mockReturnValue([])
    mockGetRobotAdminStatus.mockReturnValue(null)

    testScheduler = new TestScheduler((actual, expected) => {
      expect(actual).toEqual(expected)
    })
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  test('makes GET /settings request on FETCH_SETTINGS', () => {
    const action = Actions.fetchSettings(mockRobot)

    testScheduler.run(({ hot, cold, expectObservable }) => {
      setupMockMakeApiRequest(cold)

      const action$ = hot('-a', { a: action })
      const state$ = hot('a-', { a: {} })
      const output$ = robotSettingsEpic(action$, state$)

      expectObservable(output$).toBe('--a', {
        a: {
          req: { host: mockRobot, method: 'GET', path: '/settings' },
          meta: {},
        },
      })
    })
  })

  test('makes POST /settings request on UPDATE_SETTING', () => {
    const action = Actions.updateSetting(mockRobot, 'settingId', true)

    testScheduler.run(({ hot, cold, expectObservable }) => {
      setupMockMakeApiRequest(cold)

      const action$ = hot('-a', { a: action })
      const state$ = hot('a-', { a: {} })
      const output$ = robotSettingsEpic(action$, state$)

      expectObservable(output$).toBe('--a', {
        a: {
          req: {
            host: mockRobot,
            method: 'POST',
            path: '/settings',
            body: { id: 'settingId', value: true },
          },
          meta: {},
        },
      })
    })
  })

  test('dispatches CLEAR_RESTART_PATH on robot restart', () => {
    mockGetAllRestartRequiredRobots.mockReturnValue(['a', 'b'])
    mockGetRobotAdminStatus.mockReturnValue('restarting')

    testScheduler.run(({ hot, cold, expectObservable }) => {
      const action$ = cold('--')
      const state$ = hot('-a', { a: {} })
      const output$ = robotSettingsEpic(action$, state$)

      expectObservable(output$).toBe('-(ab)', {
        a: Actions.clearRestartPath('a'),
        b: Actions.clearRestartPath('b'),
      })
    })
  })
})
