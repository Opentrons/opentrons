// @flow
import { TestScheduler } from 'rxjs/testing'

import type { Observable } from 'rxjs'
import { mockRobot } from '../../../robot-api/__fixtures__'
import * as RobotApiHttp from '../../../robot-api/http'
import * as DiscoverySelectors from '../../../discovery/selectors'
import * as Fixtures from '../../__fixtures__'
import * as Actions from '../../actions'
import * as Types from '../../types'
import type {
  RobotHost,
  RobotApiRequestOptions,
  RobotApiResponse,
} from '../../../robot-api/types'
import { robotControlsEpic } from '..'

jest.mock('../../../robot-api/http')
jest.mock('../../../discovery/selectors')

const mockState = { state: true }

const mockFetchRobotApi: JestMockFn<
  [RobotHost, RobotApiRequestOptions],
  Observable<RobotApiResponse>
> = RobotApiHttp.fetchRobotApi

const mockGetRobotByName: JestMockFn<[any, string], mixed> =
  DiscoverySelectors.getRobotByName

describe('homeEpic', () => {
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

  const meta = { requestId: '1234' }
  const action: Types.HomeAction = {
    ...Actions.home(mockRobot.name, 'robot'),
    meta,
  }

  it('calls POST /robot/home with target: robot', () => {
    testScheduler.run(({ hot, cold, expectObservable, flush }) => {
      mockFetchRobotApi.mockReturnValue(
        cold('r', { r: Fixtures.mockHomeSuccess })
      )

      const action$ = hot('--a', { a: action })
      const state$ = hot('a-a', { a: mockState })
      const output$ = robotControlsEpic(action$, state$)

      expectObservable(output$)
      flush()

      expect(mockGetRobotByName).toHaveBeenCalledWith(mockState, mockRobot.name)
      expect(mockFetchRobotApi).toHaveBeenCalledWith(mockRobot, {
        method: 'POST',
        path: '/robot/home',
        body: { target: 'robot' },
      })
    })
  })

  it('calls POST /robot/home with target: pipette', () => {
    const action: Types.HomeAction = {
      ...Actions.home(mockRobot.name, 'pipette', 'right'),
      meta,
    }
    testScheduler.run(({ hot, cold, expectObservable, flush }) => {
      mockFetchRobotApi.mockReturnValue(
        cold('r', { r: Fixtures.mockHomeSuccess })
      )

      const action$ = hot('--a', { a: action })
      const state$ = hot('a-a', { a: mockState })
      const output$ = robotControlsEpic(action$, state$)

      expectObservable(output$)
      flush()

      expect(mockGetRobotByName).toHaveBeenCalledWith(mockState, mockRobot.name)
      expect(mockFetchRobotApi).toHaveBeenCalledWith(mockRobot, {
        method: 'POST',
        path: '/robot/home',
        body: { target: 'pipette', mount: 'right' },
      })
    })
  })

  it('maps successful response to HOME_SUCCESS', () => {
    testScheduler.run(({ hot, cold, expectObservable, flush }) => {
      mockFetchRobotApi.mockReturnValue(
        cold('r', { r: Fixtures.mockHomeSuccess })
      )

      const action$ = hot('--a', { a: action })
      const state$ = hot('a-a', { a: {} })
      const output$ = robotControlsEpic(action$, state$)

      expectObservable(output$).toBe('--a', {
        a: Actions.homeSuccess(mockRobot.name, {
          ...meta,
          response: Fixtures.mockHomeSuccessMeta,
        }),
      })
    })
  })

  it('maps failed response to HOME_FAILURE', () => {
    testScheduler.run(({ hot, cold, expectObservable, flush }) => {
      mockFetchRobotApi.mockReturnValue(
        cold('r', { r: Fixtures.mockHomeFailure })
      )

      const action$ = hot('--a', { a: action })
      const state$ = hot('a-a', { a: {} })
      const output$ = robotControlsEpic(action$, state$)

      expectObservable(output$).toBe('--a', {
        a: Actions.homeFailure(
          mockRobot.name,
          { message: 'AH' },
          { ...meta, response: Fixtures.mockHomeFailureMeta }
        ),
      })
    })
  })
})
