// @flow
import { TestScheduler } from 'rxjs/testing'

import * as RobotApiHttp from '../http'
import * as DiscoverySelectors from '../../discovery/selectors'
import { mockRobot, mockRequestMeta } from '../__fixtures__'

import type { State } from '../../types'
import type {
  RobotHost,
  RobotApiRequestOptions,
  RobotApiResponse,
} from '../types'

jest.mock('../http')
jest.mock('../../discovery/selectors')

const mockFetchRobotApi: JestMockFn<
  [RobotHost, RobotApiRequestOptions],
  $Call<typeof RobotApiHttp.fetchRobotApi, RobotHost, RobotApiRequestOptions>
> = RobotApiHttp.fetchRobotApi

const mockGetRobotByName: JestMockFn<
  [State, string],
  RobotHost
> = (DiscoverySelectors.getRobotByName: any)

export type EpicTestMocks<A, R> = {|
  state: State,
  action: A,
  response: R | void,
  robot: RobotHost,
  meta: typeof mockRequestMeta,
  getRobotByName: typeof mockGetRobotByName,
  fetchRobotApi: typeof mockFetchRobotApi,
  testScheduler: any,
|}

/**
 * Sets up the necessary mocks for robot HTTP API epic testing. Remember to
 * call `jest.resetAllMocks()` in `afterEach`!
 *
 * @returns {EpicTestMocks}
 */
export const setupEpicTestMocks = <
  A: { meta: { requestId: string } },
  R: RobotApiResponse
>(
  makeTriggerAction: (robotName: string) => A,
  mockResponse?: R
): EpicTestMocks<A, R> => {
  const mockState: State = ({ state: true, mock: true }: any)
  const triggerAction = makeTriggerAction(mockRobot.name)

  const mockAction = {
    ...triggerAction,
    meta: { ...(triggerAction.meta || {}), ...mockRequestMeta },
  }

  mockGetRobotByName.mockImplementation((state, robotName) => {
    expect(state).toBe(mockState)
    expect(robotName).toBe(mockRobot.name)

    return mockRobot
  })

  const testScheduler = new TestScheduler((actual, expected) => {
    expect(actual).toEqual(expected)
  })

  return {
    state: mockState,
    action: mockAction,
    response: mockResponse,
    robot: mockRobot,
    meta: mockRequestMeta,
    getRobotByName: mockGetRobotByName,
    fetchRobotApi: mockFetchRobotApi,
    testScheduler,
  }
}

export const runEpicTest = <A, R: RobotApiResponse>(
  epicMocks: EpicTestMocks<A, R>,
  run: (schedularArgs: any) => mixed
) => {
  const { testScheduler, fetchRobotApi, response } = epicMocks

  testScheduler.run(schedulerArgs => {
    const { cold } = schedulerArgs

    if (response) {
      fetchRobotApi.mockReturnValue(cold('r', { r: response }))
    }

    run(schedulerArgs)
  })
}
