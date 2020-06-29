// @flow
import { sessionsEpic } from '..'
import * as Fixtures from '../../__fixtures__'
import { runEpicTest, setupEpicTestMocks } from '../../../robot-api/__utils__'
import * as RobotApiHttp from '../../../robot-api/http'
import type {
  RobotApiRequestOptions,
  RobotHost,
} from '../../../robot-api/types'
import * as Actions from '../../actions'

jest.mock('../../../robot-api/http')

const fetchRobotApi: JestMockFn<
  [RobotHost, RobotApiRequestOptions],
  $Call<typeof RobotApiHttp.fetchRobotApi, RobotHost, RobotApiRequestOptions>
> = RobotApiHttp.fetchRobotApi

const makeTriggerAction = robotName =>
  Actions.ensureSession(robotName, 'calibrationCheck')

const expectedFetchRequest = {
  method: 'GET',
  path: '/sessions',
}

const expectedCreateRequest = {
  method: 'POST',
  path: '/sessions',
  body: {
    data: {
      type: 'Session',
      attributes: {
        sessionType: 'calibrationCheck',
      },
    },
  },
}

const mockEmptyFetchAllSuccess = {
  ...Fixtures.mockFetchAllSessionsSuccess,
  body: { data: [] },
}

describe('ensureSessionEpic', () => {
  afterEach(() => {
    jest.resetAllMocks()
  })

  it('calls GET /sessions', () => {
    const mocks = setupEpicTestMocks(
      makeTriggerAction,
      Fixtures.mockFetchAllSessionsSuccess
    )

    runEpicTest(mocks, ({ hot, expectObservable, flush }) => {
      const action$ = hot('--a', { a: mocks.action })
      const state$ = hot('a-a', { a: mocks.state })
      const output$ = sessionsEpic(action$, state$)

      expectObservable(output$)
      flush()

      expect(mocks.fetchRobotApi).toHaveBeenCalledWith(
        mocks.robot,
        expectedFetchRequest
      )
    })
  })

  it('maps successful fetch response to FETCH_ALL_SESSIONS_SUCCESS if session type matches', () => {
    const mocks = setupEpicTestMocks(
      makeTriggerAction,
      Fixtures.mockFetchAllSessionsSuccess
    )

    runEpicTest(mocks, ({ hot, expectObservable, flush }) => {
      const action$ = hot('--a', { a: mocks.action })
      const state$ = hot('s-s', { s: mocks.state })
      const output$ = sessionsEpic(action$, state$)

      expectObservable(output$).toBe('--a', {
        a: Actions.fetchAllSessionsSuccess(
          mocks.robot.name,
          Fixtures.mockFetchAllSessionsSuccess.body,
          { ...mocks.meta, response: Fixtures.mockFetchAllSessionsSuccessMeta }
        ),
      })
    })
  })

  it('maps failed fetch response to FETCH_ALL_SESSIONS_FAILURE', () => {
    const mocks = setupEpicTestMocks(
      makeTriggerAction,
      Fixtures.mockFetchAllSessionsFailure
    )

    runEpicTest(mocks, ({ hot, expectObservable, flush }) => {
      const action$ = hot('--a', { a: mocks.action })
      const state$ = hot('s-s', { s: mocks.state })
      const output$ = sessionsEpic(action$, state$)

      expectObservable(output$).toBe('--a', {
        a: Actions.fetchAllSessionsFailure(
          mocks.robot.name,
          Fixtures.mockFetchAllSessionsFailure.body,
          { ...mocks.meta, response: Fixtures.mockFetchAllSessionsFailureMeta }
        ),
      })
    })
  })

  it('calls POST /sessions if fetch all comes back without session', () => {
    const mocks = setupEpicTestMocks(makeTriggerAction)

    runEpicTest(mocks, ({ hot, cold, expectObservable, flush }) => {
      fetchRobotApi.mockReturnValueOnce(
        cold('r', { r: mockEmptyFetchAllSuccess })
      )

      fetchRobotApi.mockReturnValueOnce(
        cold('r', { r: Fixtures.mockCreateSessionSuccess })
      )

      const action$ = hot('--a', { a: mocks.action })
      const state$ = hot('a-a', { a: mocks.state })
      const output$ = sessionsEpic(action$, state$)

      expectObservable(output$)
      flush()

      expect(mocks.fetchRobotApi).toHaveBeenNthCalledWith(
        2,
        mocks.robot,
        expectedCreateRequest
      )
    })
  })

  it('maps failed create response to CREATE_SESSION_FAILURE', () => {
    const mocks = setupEpicTestMocks(makeTriggerAction)

    runEpicTest(mocks, ({ hot, cold, expectObservable }) => {
      fetchRobotApi.mockReturnValueOnce(
        cold('r', { r: mockEmptyFetchAllSuccess })
      )

      fetchRobotApi.mockReturnValueOnce(
        cold('r', { r: Fixtures.mockCreateSessionFailure })
      )

      const action$ = hot('--a', { a: mocks.action })
      const state$ = hot('s-s', { s: mocks.state })
      const output$ = sessionsEpic(action$, state$)

      expectObservable(output$).toBe('--a', {
        a: Actions.createSessionFailure(
          mocks.robot.name,
          { errors: [{ status: 'went bad' }] },
          { ...mocks.meta, response: Fixtures.mockCreateSessionFailureMeta }
        ),
      })
    })
  })
})
