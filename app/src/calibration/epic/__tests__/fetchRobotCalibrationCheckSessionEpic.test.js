// @flow
import { TestScheduler } from 'rxjs/testing'
import { mockFetchSessionFailureMeta } from '../../../sessions/__fixtures__'
import { mockRobot } from '../../../robot-api/__fixtures__'
import * as Sessions from '../../../sessions'
import { calibrationEpic } from '..'

jest.mock('../../../robot-api/http')
jest.mock('../../../discovery/selectors')

describe('fetchRobotCalibrationCheckSessionEpic', () => {
  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('handles fetch calibration check session', () => {
    it('maps cal check session creation conflict response to FETCH_ALL_SESSIONS', () => {
      const triggerAction = Sessions.createSessionFailure(
        mockRobot.name,
        { errors: [{ status: 'theres already someone in here' }] },
        {
          requestId: 'abc',
          response: { ...mockFetchSessionFailureMeta, status: 409 },
        }
      )

      const testScheduler = new TestScheduler((actual, expected) => {
        expect(actual).toEqual(expected)
      })
      testScheduler.run(({ hot, cold, expectObservable, flush }) => {
        const action$ = hot('--a', { a: triggerAction })
        const state$ = hot('s-s', { s: {} })
        const output$ = calibrationEpic(action$, state$)

        expectObservable(output$).toBe('--a', {
          a: Sessions.fetchAllSessions(mockRobot.name),
        })
      })
    })
  })
})
