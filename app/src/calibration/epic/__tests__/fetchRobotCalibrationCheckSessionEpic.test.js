// @flow
import { mockFetchSessionFailureMeta } from '../../../sessions/__fixtures__'
import { setupEpicTestMocks, runEpicTest } from '../../../robot-api/__utils__'
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
      const mocks = setupEpicTestMocks(robotName =>
        Sessions.createSessionFailure(
          robotName,
          { errors: [{ status: 'theres already someone in here' }] },
          {
            requestId: 'abc',
            response: { ...mockFetchSessionFailureMeta, status: 409 },
          }
        )
      )

      runEpicTest(mocks, ({ hot, expectObservable }) => {
        const action$ = hot('--a', { a: mocks.action })
        const state$ = hot('s-s', { s: mocks.state })
        const output$ = calibrationEpic(action$, state$)

        expectObservable(output$).toBe('--a', {
          a: Sessions.fetchAllSessions(mocks.robot.name),
        })
      })
    })
  })
})
