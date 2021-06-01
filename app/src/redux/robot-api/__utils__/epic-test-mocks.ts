import { TestScheduler } from 'rxjs/testing'

import * as RobotApiHttp from '../http'
import * as DiscoverySelectors from '../../discovery/selectors'
import { mockRobot, mockRequestMeta } from '../__fixtures__'

import type { State } from '../../types'
import type { RobotHost, RobotApiResponse } from '../types'

jest.mock('../http')
jest.mock('../../discovery/selectors')

const mockFetchRobotApi = RobotApiHttp.fetchRobotApi as jest.MockedFunction<
  typeof RobotApiHttp.fetchRobotApi
>
const mockGetRobotByName = DiscoverySelectors.getRobotByName as jest.MockedFunction<
  typeof DiscoverySelectors.getRobotByName
>

export interface EpicTestMocks<A, R> {
  state: State
  action: A
  response: R | undefined
  robot: RobotHost
  meta: typeof mockRequestMeta
  getRobotByName: typeof mockGetRobotByName
  fetchRobotApi: typeof mockFetchRobotApi
  testScheduler: TestScheduler
}

interface TriggerAction {
  meta: { requestId: string; [key: string]: unknown }
  [key: string]: unknown
}
/**
 * Sets up the necessary mocks for robot HTTP API epic testing. Remember to
 * call `jest.resetAllMocks()` in `afterEach`!
 *
 * @returns {EpicTestMocks}
 */
export const setupEpicTestMocks = <A = TriggerAction, R = RobotApiResponse>(
  makeTriggerAction?: (robotName: string) => A,
  mockResponse?: R
): EpicTestMocks<A, R> => {
  const mockState: State = { state: true, mock: true } as any
  const triggerAction =
    typeof makeTriggerAction === 'function'
      ? (makeTriggerAction(mockRobot.name) as A & { meta: any })
      : ({} as A & { meta: any })

  const mockAction = {
    ...triggerAction,
    meta: { ...(triggerAction.meta || {}), ...mockRequestMeta },
  }
  // @ts-expect-error(sa, 2021-05-17): mockRobot does not have all properties in the return value of getRobotByName
  mockGetRobotByName.mockImplementation((state: State, robotName: string) => {
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

export const runEpicTest = <A, R = RobotApiResponse>(
  epicMocks: EpicTestMocks<A, R>,
  run: (schedularArgs: any) => unknown
): void => {
  const { testScheduler, fetchRobotApi, response } = epicMocks

  testScheduler.run(schedulerArgs => {
    const { cold } = schedulerArgs

    if (response) {
      fetchRobotApi.mockReturnValue(
        cold<RobotApiResponse>('r', { r: response } as any)
      )
    }

    run(schedulerArgs)
  })
}
