// @flow
import { TestScheduler } from 'rxjs/testing'

import * as ApiUtils from '../../robot-api/utils'
import * as Actions from '../actions'
import { robotSettingsEpic } from '../epic'

import type { RobotApiRequest, RequestMeta } from '../../robot-api/types'

jest.mock('../../robot-api/utils')

const mockMakeApiRequest: JestMockFn<[RobotApiRequest, RequestMeta], mixed> =
  ApiUtils.makeRobotApiRequest

const mockRobot = { name: 'robot', ip: '127.0.0.1', port: 31950 }

const setupMockMakeApiRequest = cold => {
  mockMakeApiRequest.mockImplementation((req, meta) =>
    cold('-a', { a: { req, meta } })
  )
}

describe('robotSettingsEpic', () => {
  let testScheduler

  beforeEach(() => {
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
      const state$: any = null
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
      const state$: any = null
      const output$ = robotSettingsEpic(action$, state$)

      expectObservable(output$).toBe('--a', {
        a: {
          req: {
            host: mockRobot,
            method: 'POST',
            path: '/settings',
            body: { id: 'settingId', value: true },
          },
          meta: { settingId: 'settingId' },
        },
      })
    })
  })
})
