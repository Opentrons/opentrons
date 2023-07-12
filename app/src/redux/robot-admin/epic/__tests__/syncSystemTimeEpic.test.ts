import cloneDeep from 'lodash/cloneDeep'
import set from 'lodash/set'
import get from 'lodash/get'
import { subSeconds, differenceInSeconds, parseISO } from 'date-fns'

import { setupEpicTestMocks, runEpicTest } from '../../../robot-api/__utils__'
import { GET, PUT } from '../../../robot-api'
import { syncSystemTime } from '../../actions'
import {
  mockFetchSystemTimeSuccess,
  mockFetchSystemTimeFailure,
} from '../../__fixtures__'
import { syncSystemTimeEpic } from '../syncSystemTimeEpic'

const createTimeSuccessResponse = (
  time: Date
): typeof mockFetchSystemTimeSuccess => {
  const response = cloneDeep(mockFetchSystemTimeSuccess)
  set(response, 'body.data.systemTime', time.toISOString())
  return response
}

const createEpicOutput = (
  mocks: any,
  createHotObservable: any
): ReturnType<typeof syncSystemTimeEpic> => {
  const action$ = createHotObservable('--a', { a: mocks.action })
  const state$ = createHotObservable('s-s', { s: mocks.state })
  const output$ = syncSystemTimeEpic(action$, state$)

  return output$
}

describe('syncSystemTimeEpic', () => {
  afterEach(() => {
    jest.resetAllMocks()
  })

  it("should fetch the robot's time on sync system time request", () => {
    const mocks = setupEpicTestMocks(
      syncSystemTime,
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
    const mocks = setupEpicTestMocks(syncSystemTime)

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
            systemTime: expect.any(String),
          },
        },
      })

      const updatedTime = get(
        mocks.fetchRobotApi.mock.calls[1][1],
        'body.data.systemTime'
      )

      expect(
        Math.abs(differenceInSeconds(new Date(), parseISO(updatedTime)))
      ).toBe(0)
    })
  })

  it('should not try to update time if fetch fails', () => {
    const mocks = setupEpicTestMocks(syncSystemTime, mockFetchSystemTimeFailure)

    runEpicTest(mocks, ({ hot, expectObservable, flush }) => {
      const output$ = createEpicOutput(mocks, hot)
      expectObservable(output$, '---')
      flush()

      expect(mocks.fetchRobotApi).toHaveBeenCalledTimes(1)
    })
  })

  it('should not try to update time if off by less than a minute', () => {
    const mocks = setupEpicTestMocks(
      syncSystemTime,
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
