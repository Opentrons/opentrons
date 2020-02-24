// @flow
import {
  setupEpicTestMocks,
  scheduleEpicTest,
} from '../../../robot-api/__utils__'
import * as Fixtures from '../../__fixtures__'
import * as Actions from '../../actions'
import { networkingEpic } from '..'

describe('networking statusEpic', () => {
  let mocks

  beforeEach(() => {
    mocks = setupEpicTestMocks(robotName => Actions.fetchStatus(robotName))
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('calls GET /networking/status', () => {
    scheduleEpicTest(
      mocks,
      Fixtures.mockNetworkingStatusSuccess,
      ({ hot, expectObservable, flush }) => {
        const action$ = hot('--a', { a: mocks.action })
        const state$ = hot('s-s', { s: mocks.state })
        const output$ = networkingEpic(action$, state$)

        expectObservable(output$)
        flush()

        expect(mocks.fetchRobotApi).toHaveBeenCalledWith(mocks.robot, {
          method: 'GET',
          path: '/networking/status',
        })
      }
    )
  })

  it('maps successful response to FETCH_STATUS_SUCCESS', () => {
    scheduleEpicTest(
      mocks,
      Fixtures.mockNetworkingStatusSuccess,
      ({ hot, expectObservable }) => {
        const action$ = hot('--a', { a: mocks.action })
        const state$ = hot('s-s', { s: mocks.state })
        const output$ = networkingEpic(action$, state$)

        expectObservable(output$).toBe('--a', {
          a: Actions.fetchStatusSuccess(
            mocks.robot.name,
            Fixtures.mockNetworkingStatusSuccess.body.status,
            Fixtures.mockNetworkingStatusSuccess.body.interfaces,
            {
              ...mocks.meta,
              response: Fixtures.mockNetworkingStatusSuccessMeta,
            }
          ),
        })
      }
    )
  })

  it('maps failed response to FETCH_STATUS_FAILURE', () => {
    scheduleEpicTest(
      mocks,
      Fixtures.mockNetworkingStatusFailure,
      ({ hot, expectObservable }) => {
        const action$ = hot('--a', { a: mocks.action })
        const state$ = hot('s-s', { s: mocks.state })
        const output$ = networkingEpic(action$, state$)

        expectObservable(output$).toBe('--a', {
          a: Actions.fetchStatusFailure(
            mocks.robot.name,
            Fixtures.mockNetworkingStatusFailure.body,
            {
              ...mocks.meta,
              response: Fixtures.mockNetworkingStatusFailureMeta,
            }
          ),
        })
      }
    )
  })
})
