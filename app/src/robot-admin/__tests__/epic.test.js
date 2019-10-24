// @flow
import { TestScheduler } from 'rxjs/testing'

import * as ApiUtils from '../../robot-api/utils'
import * as SettingsSelectors from '../../robot-settings/selectors'
import * as DiscoveryActions from '../../discovery/actions'
import * as Actions from '../actions'
import { robotAdminEpic } from '../epic'

import type { Action, ActionLike } from '../../types'
import type {
  RobotApiRequest,
  RobotApiResponseAction,
  RequestMeta,
} from '../../robot-api/types'

jest.mock('../../robot-api/utils')
jest.mock('../../robot-settings/selectors')

const mockMakeApiRequest: JestMockFn<[RobotApiRequest, RequestMeta], mixed> =
  ApiUtils.makeRobotApiRequest

const mockPassRobotApiResponseAction: JestMockFn<
  [Action | ActionLike],
  RobotApiResponseAction | null
> = ApiUtils.passRobotApiResponseAction

const mockGetRestartPath: JestMockFn<Array<any>, string | null> =
  SettingsSelectors.getRobotRestartPath

const mockRobot = { name: 'robot', ip: '127.0.0.1', port: 31950 }
const mockState = { mock: true }

const setupMockMakeApiRequest = cold => {
  mockMakeApiRequest.mockImplementation((req, meta) =>
    cold('-a', { a: { req, meta } })
  )
}

describe('robotAdminEpic', () => {
  let testScheduler

  beforeEach(() => {
    testScheduler = new TestScheduler((actual, expected) => {
      expect(actual).toEqual(expected)
    })
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  test('makes POST /server/restart request on RESTART', () => {
    const action = Actions.restartRobot(mockRobot)

    testScheduler.run(({ hot, cold, expectObservable }) => {
      setupMockMakeApiRequest(cold)
      mockGetRestartPath.mockReturnValue(null)

      const action$ = hot('-a', { a: action })
      const state$ = hot('a-', { a: mockState })
      const output$ = robotAdminEpic(action$, state$)

      expectObservable(output$).toBe('--a', {
        a: {
          req: { host: mockRobot, method: 'POST', path: '/server/restart' },
          meta: {},
        },
      })
    })
  })

  test('makes a POST to the settings restart path on RESTART is applicable', () => {
    const action = Actions.restartRobot(mockRobot)

    testScheduler.run(({ hot, cold, expectObservable }) => {
      setupMockMakeApiRequest(cold)
      mockGetRestartPath.mockReturnValue('/restart')

      const action$ = hot('-a', { a: action })
      const state$ = hot('a-', { a: mockState })
      const output$ = robotAdminEpic(action$, state$)

      expectObservable(output$).toBe('--a', {
        a: {
          req: { host: mockRobot, method: 'POST', path: '/restart' },
          meta: {},
        },
      })
    })
  })

  test('starts discovery on restart request success', () => {
    testScheduler.run(({ hot, expectObservable }) => {
      const serverSuccessAction = {
        type: 'robotApi:RESPONSE__POST__/server/restart',
        meta: {},
        payload: {
          host: mockRobot,
          method: 'POST',
          path: '/server/restart',
          body: {},
          ok: true,
          status: 200,
        },
      }

      mockPassRobotApiResponseAction.mockReturnValue(serverSuccessAction)

      const action$ = hot('-a', { a: serverSuccessAction })
      const state$ = hot('a-', { a: mockState })
      const output$ = robotAdminEpic(action$, state$)

      expectObservable(output$).toBe('-a', {
        a: DiscoveryActions.startDiscovery(60000),
      })
    })
  })
})
