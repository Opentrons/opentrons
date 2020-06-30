// @flow
import { TestScheduler } from 'rxjs/testing'

import type { Observable } from 'rxjs'
import * as RobotApiHttp from '../../../robot-api/http'
import * as DiscoverySelectors from '../../../discovery/selectors'
import * as Fixtures from '../../__fixtures__'

import * as Actions from '../../actions'
import * as Types from '../../types'
import { modulesEpic } from '../../epic'

import type {
  RobotHost,
  RobotApiRequestOptions,
  RobotApiResponse,
} from '../../../robot-api/types'

jest.mock('../../../robot-api/http')
jest.mock('../../../discovery/selectors')

const mockState = { state: true }
const { mockRobot } = Fixtures

const mockFetchRobotApi: JestMockFn<
  [RobotHost, RobotApiRequestOptions],
  Observable<RobotApiResponse>
> = RobotApiHttp.fetchRobotApi

const mockGetRobotByName: JestMockFn<[any, string], mixed> =
  DiscoverySelectors.getRobotByName

describe('updateModuleEpic', () => {
  let testScheduler

  const meta = { requestId: '1234' }
  const action: Types.UpdateModuleAction = {
    ...Actions.updateModule(mockRobot.name, 'abc123'),
    meta,
  }

  beforeEach(() => {
    mockGetRobotByName.mockReturnValue(mockRobot)

    testScheduler = new TestScheduler((actual, expected) => {
      expect(actual).toEqual(expected)
    })
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('calls POST /modules/{serial}/update', () => {
    testScheduler.run(({ hot, cold, expectObservable, flush }) => {
      mockFetchRobotApi.mockReturnValue(
        cold('r', { r: Fixtures.mockUpdateModuleSuccess })
      )

      const action$ = hot('--a', { a: action })
      const state$ = hot('a-a', { a: mockState })
      const output$ = modulesEpic(action$, state$)

      expectObservable(output$)
      flush()

      expect(mockGetRobotByName).toHaveBeenCalledWith(mockState, mockRobot.name)
      expect(mockFetchRobotApi).toHaveBeenCalledWith(mockRobot, {
        method: 'POST',
        path: '/modules/abc123/update',
      })
    })
  })

  it('maps successful response to SEND_MODULE_COMMAND_SUCCESS', () => {
    testScheduler.run(({ hot, cold, expectObservable, flush }) => {
      mockFetchRobotApi.mockReturnValue(
        cold('r', { r: Fixtures.mockUpdateModuleSuccess })
      )

      const action$ = hot('--a', { a: action })
      const state$ = hot('a-a', { a: {} })
      const output$ = modulesEpic(action$, state$)

      expectObservable(output$).toBe('--a', {
        a: Actions.updateModuleSuccess(
          mockRobot.name,
          'abc123',
          'update successful',
          { ...meta, response: Fixtures.mockUpdateModuleSuccessMeta }
        ),
      })
    })
  })

  it('maps failed response to SEND_MODULE_COMMAND_FAILURE', () => {
    testScheduler.run(({ hot, cold, expectObservable, flush }) => {
      mockFetchRobotApi.mockReturnValue(
        cold('r', { r: Fixtures.mockUpdateModuleFailure })
      )

      const action$ = hot('--a', { a: action })
      const state$ = hot('a-a', { a: {} })
      const output$ = modulesEpic(action$, state$)

      expectObservable(output$).toBe('--a', {
        a: Actions.updateModuleFailure(
          mockRobot.name,
          'abc123',
          { message: 'BAD NEWS BEARS' },
          { ...meta, response: Fixtures.mockUpdateModuleFailureMeta }
        ),
      })
    })
  })
})
