// @flow
import { cloneDeep, set, get } from 'lodash'
import { subSeconds, differenceInSeconds, parseISO } from 'date-fns'
import { EMPTY } from 'rxjs'

import { setupEpicTestMocks, runEpicTest } from '../../../robot-api/__utils__'
import { GET, PUT } from '../../../robot-api'
import { actions as RobotActions } from '../../../robot'
import { mockFetchSystemTimeSuccess } from '../../__fixtures__'
import { robotAdminEpic } from '..'

describe('syncTimeOnConnectEpic', () => {
  const makeTimeResponse = (time: Date) => {
    const response = cloneDeep(mockFetchSystemTimeSuccess)
    set(response, 'body.data.attributes.systemTime', time.toISOString())
    return response
  }

  afterEach(() => {
    jest.resetAllMocks()
  })

  it("should fetch the robot's time on connect request", () => {
    const mocks = setupEpicTestMocks(
      robotName => (RobotActions.connect(robotName): any),
      makeTimeResponse(new Date())
    )

    runEpicTest(mocks, ({ hot, expectObservable, flush }) => {
      const action$ = hot('--a', { a: mocks.action })
      const state$ = hot('s-s', { s: mocks.state })
      const output$ = robotAdminEpic(action$, state$)

      expectObservable(output$)
      flush()

      expect(mocks.fetchRobotApi).toHaveBeenCalledTimes(1)
      expect(mocks.fetchRobotApi).toHaveBeenCalledWith(mocks.robot, {
        method: 'GET',
        path: '/system/time',
      })
    })
  })

  it('should update time if off by more than a minute', () => {
    const mocks = setupEpicTestMocks(
      robotName => (RobotActions.connect(robotName): any)
    )

    runEpicTest(mocks, ({ hot, cold, expectObservable, flush }) => {
      mocks.fetchRobotApi.mockImplementation((robot, request) => {
        if (request.method === GET) {
          const robotDate = subSeconds(new Date(), 61)
          return cold('r', { r: makeTimeResponse(robotDate) })
        }

        if (request.method === PUT) {
          return cold('r', { r: makeTimeResponse(new Date()) })
        }

        return EMPTY
      })

      const action$ = hot('--a', { a: mocks.action })
      const state$ = hot('s-s', { s: mocks.state })
      const output$ = robotAdminEpic(action$, state$)

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
})
