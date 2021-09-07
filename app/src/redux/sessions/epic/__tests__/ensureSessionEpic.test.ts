import { setupEpicTestMocks, runEpicTest } from '../../../robot-api/__utils__'
import * as RobotApiHttp from '../../../robot-api/http'

import * as Fixtures from '../../__fixtures__'
import * as Actions from '../../actions'
import { sessionsEpic } from '..'

import type { Action } from '../../../types'

jest.mock('../../../robot-api/http')

const fetchRobotApi = RobotApiHttp.fetchRobotApi as jest.MockedFunction<
  typeof RobotApiHttp.fetchRobotApi
>

const makeTriggerAction = (robotName: string): Action =>
  Actions.ensureSession(robotName, 'calibrationCheck', {
    hasCalibrationBlock: true,
    tipRacks: [],
  })

const expectedFetchRequest = {
  method: 'GET',
  path: '/sessions',
}

const expectedCreateRequest = {
  method: 'POST',
  path: '/sessions',
  body: {
    data: {
      sessionType: 'calibrationCheck',
      createParams: {
        hasCalibrationBlock: true,
        tipRacks: [],
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

    runEpicTest<Action>(mocks, ({ hot, expectObservable, flush }) => {
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

    runEpicTest<Action>(mocks, ({ hot, expectObservable, flush }) => {
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

    runEpicTest<Action>(mocks, ({ hot, expectObservable, flush }) => {
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

    runEpicTest<Action>(mocks, ({ hot, cold, expectObservable, flush }) => {
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

    runEpicTest<Action>(mocks, ({ hot, cold, expectObservable }) => {
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
