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

export type EpicTestMocks<A> = {|
  state: State,
  action: A,
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
export const setupEpicTestMocks = <A: { meta: { requestId: string } }>(
  makeTriggerAction: (robotName: string) => A
): EpicTestMocks<A> => {
  const mockState: State = ({ state: true, mock: true }: any)
  const mockAction = {
    ...makeTriggerAction(mockRobot.name),
    meta: mockRequestMeta,
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
    robot: mockRobot,
    meta: mockRequestMeta,
    getRobotByName: mockGetRobotByName,
    fetchRobotApi: mockFetchRobotApi,
    testScheduler,
  }
}

export const scheduleEpicTest = <A, R: RobotApiResponse>(
  epicMocks: EpicTestMocks<A>,
  response: R,
  run: (schedularArgs: any) => mixed
) => {
  const { testScheduler, fetchRobotApi } = epicMocks

  testScheduler.run(schedulerArgs => {
    const { cold } = schedulerArgs
    fetchRobotApi.mockReturnValue(cold('r', { r: response }))
    run(schedulerArgs)
  })
}
