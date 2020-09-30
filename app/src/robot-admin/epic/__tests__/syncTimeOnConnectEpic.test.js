// @flow
import { cloneDeep, set, get } from 'lodash'
import { subSeconds, differenceInSeconds, parseISO } from 'date-fns'

import { setupEpicTestMocks, runEpicTest } from '../../../robot-api/__utils__'
import { GET, PUT } from '../../../robot-api'
import { actions as RobotActions } from '../../../robot'
import {
  mockFetchSystemTimeSuccess,
  mockFetchSystemTimeFailure,
} from '../../__fixtures__'
import { robotAdminEpic } from '..'

const createConnectAction = robotName => (RobotActions.connect(robotName): any)

const createTimeSuccessResponse = (time: Date) => {
  const response = cloneDeep(mockFetchSystemTimeSuccess)
  set(response, 'body.data.attributes.systemTime', time.toISOString())
  return response
}

const createEpicOutput = (mocks, createHotObservable) => {
  const action$ = createHotObservable('--a', { a: mocks.action })
  const state$ = createHotObservable('s-s', { s: mocks.state })
  const output$ = robotAdminEpic(action$, state$)

  return output$
}

describe('syncTimeOnConnectEpic', () => {
  afterEach(() => {
    jest.resetAllMocks()
  })

  it("should fetch the robot's time on connect request", () => {
    const mocks = setupEpicTestMocks(
      createConnectAction,
      createTimeSuccessResponse(new Date())
    )

    runEpicTest(mocks, ({ hot, expectObservable, flush }) => {
      const output$ = createEpicOutput(mocks, hot)
      expectObservable(output$, '---')
      flush()

      expect(mocks.fetchRobotApi).toHaveBeenCalledTimes(1)
      expect(mocks.fetchRobotApi).toHaveBeenCalledWith(mocks.robot, {
        method: 'GET',
        path: '/system/time',
      })
    })
  })

  it('should update time if off by more than a minute', () => {
    const mocks = setupEpicTestMocks(createConnectAction)

    runEpicTest(mocks, ({ hot, cold, expectObservable, flush }) => {
      mocks.fetchRobotApi.mockImplementation((robot, request) => {
        if (request.method === GET && request.path === '/system/time') {
          const robotDate = subSeconds(new Date(), 61)
          return cold('r', { r: createTimeSuccessResponse(robotDate) })
        }

        if (request.method === PUT && request.path === '/system/time') {
          return cold('r', { r: createTimeSuccessResponse(new Date()) })
        }

        return cold('#')
      })

      const output$ = createEpicOutput(mocks, hot)
      expectObservable(output$, '---')
      flush()

      expect(mocks.fetchRobotApi).toHaveBeenCalledTimes(2)
      expect(mocks.fetchRobotApi).toHaveBeenNthCalledWith(2, mocks.robot, {
        method: 'PUT',
        path: '/system/time',
        body: {
          data: {
            type: 'SystemTimeAttributes',
            attributes: { systemTime: expect.any(String) },
          },
        },
      })

      const updatedTime = get(
        mocks.fetchRobotApi.mock.calls[1][1],
        'body.data.attributes.systemTime'
      )

      expect(
        Math.abs(differenceInSeconds(new Date(), parseISO(updatedTime)))
      ).toBe(0)
    })
  })

  it('should not try to update time if fetch fails', () => {
    const mocks = setupEpicTestMocks(
      createConnectAction,
      mockFetchSystemTimeFailure
    )

    runEpicTest(mocks, ({ hot, expectObservable, flush }) => {
      const output$ = createEpicOutput(mocks, hot)
      expectObservable(output$, '---')
      flush()

      expect(mocks.fetchRobotApi).toHaveBeenCalledTimes(1)
    })
  })

  it('should not try to update time if off by less than a minute', () => {
    const mocks = setupEpicTestMocks(
      createConnectAction,
      createTimeSuccessResponse(subSeconds(new Date(), 55))
    )

    runEpicTest(mocks, ({ hot, cold, expectObservable, flush }) => {
      const output$ = createEpicOutput(mocks, hot)
      expectObservable(output$, '---')
      flush()

      expect(mocks.fetchRobotApi).toHaveBeenCalledTimes(1)
    })
  })
})
