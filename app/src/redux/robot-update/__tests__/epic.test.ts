import { TestScheduler } from 'rxjs/testing'

import { mockRobot as robot } from '../../robot-api/__fixtures__'
import { startDiscovery } from '../../discovery'
import { restartRobotSuccess } from '../../robot-admin'
import * as RobotApiHttp from '../../robot-api/http'
import * as Fixtures from '../__fixtures__'
import * as epics from '../epic'
import * as actions from '../actions'
import * as selectors from '../selectors'

import { INITIAL_STATE } from '../reducer'

import type { Action, State } from '../../types'
import { RobotApiResponse } from '../../robot-api/types'

jest.mock('../selectors')
jest.mock('../../robot-api/http')

const mockFetchRobotApi = RobotApiHttp.fetchRobotApi as jest.MockedFunction<
  typeof RobotApiHttp.fetchRobotApi
>
const getRobotUpdateRobot = selectors.getRobotUpdateRobot as jest.MockedFunction<
  typeof selectors.getRobotUpdateRobot
>
const getRobotUpdateSessionRobotName = selectors.getRobotUpdateSessionRobotName as jest.MockedFunction<
  typeof selectors.getRobotUpdateSessionRobotName
>
const getRobotUpdateSession = selectors.getRobotUpdateSession as jest.MockedFunction<
  typeof selectors.getRobotUpdateSession
>

const balenaRobot = { ...robot, serverHealth: {} } as any

const brReadyRobot = {
  ...robot,
  serverHealth: {
    capabilities: {
      buildrootUpdate: '/server/update/migrate/begin',
      restart: '/server/update/restart',
    },
  },
} as any

const brRobot = {
  ...robot,
  serverHealth: {
    capabilities: {
      buildrootUpdate: '/server/update/begin',
      restart: '/server/restart',
    },
  },
} as any

describe('robot update epics', () => {
  let state: State
  let testScheduler: TestScheduler

  beforeEach(() => {
    state = { shell: { robotUpdate: { ...INITIAL_STATE } } } as any
    testScheduler = new TestScheduler((actual, expected) => {
      expect(actual).toEqual(expected)
    })
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('startUpdateEpic', () => {
    it('with BR robot sends CREATE_SESSION', () => {
      testScheduler.run(({ hot, cold, expectObservable }) => {
        getRobotUpdateRobot.mockReturnValueOnce(brRobot)

        const action$ = hot<Action>('-a', {
          a: actions.startRobotUpdate(robot.name),
        })
        const state$ = hot<State>('a-', { a: state } as any)
        const output$ = epics.startUpdateEpic(action$, state$)

        expectObservable(output$).toBe('-a', {
          a: actions.createSession(brRobot, '/server/update/begin'),
        })
      })
    })

    it('with BR-ready robot sends CREATE_SESSION', () => {
      testScheduler.run(({ hot, cold, expectObservable }) => {
        getRobotUpdateRobot.mockReturnValueOnce(brReadyRobot)

        const action$ = hot<Action>('-a', {
          a: actions.startRobotUpdate(robot.name),
        })
        const state$ = hot<State>('a-', { a: state } as any)
        const output$ = epics.startUpdateEpic(action$, state$)

        expectObservable(output$).toBe('-a', {
          a: actions.createSession(
            brReadyRobot,
            '/server/update/migrate/begin'
          ),
        })
      })
    })

    it('with balena robot sends START_PREMIGRATION', () => {
      testScheduler.run(({ hot, expectObservable }) => {
        const action = actions.startRobotUpdate(robot.name)

        getRobotUpdateRobot.mockReturnValueOnce(balenaRobot)

        const action$ = hot<Action>('-a', { a: action })
        const state$ = hot<State>('a-', { a: state } as any)
        const output$ = epics.startUpdateEpic(action$, state$)

        expectObservable(output$).toBe('-a', {
          a: actions.startBuildrootPremigration(balenaRobot),
        })
      })
    })

    it('with systemFile in payload sends READ_USER_FILE', () => {
      testScheduler.run(({ hot, expectObservable }) => {
        const action = actions.startRobotUpdate(
          robot.name,
          '/path/to/system.zip'
        )

        getRobotUpdateRobot.mockReturnValueOnce(balenaRobot)

        const action$ = hot<Action>('-a', { a: action })
        const state$ = hot<State>('a-', { a: state } as any)
        const output$ = epics.startUpdateEpic(action$, state$)

        expectObservable(output$).toBe('-a', {
          a: actions.readUserRobotUpdateFile('/path/to/system.zip'),
        })
      })
    })

    it('with bad robot sends UNEXPECTED_ERROR', () => {
      testScheduler.run(({ hot, expectObservable }) => {
        const action = actions.startRobotUpdate(robot.name)

        getRobotUpdateRobot.mockReturnValueOnce(robot as any)

        const action$ = hot<Action>('-a', { a: action })
        const state$ = hot<State>('a-', { a: state } as any)
        const output$ = epics.startUpdateEpic(action$, state$)

        expectObservable(output$).toBe('-a', {
          a: actions.unexpectedRobotUpdateError(
            'Unable to find online robot with name robot'
          ),
        })
      })
    })
  })

  describe('createSessionEpic', () => {
    it('sends request to token URL from payload and issues CREATE_SESSION_SUCCESS', () => {
      testScheduler.run(({ hot, cold, expectObservable, flush }) => {
        const action = actions.createSession(robot, '/server/update/begin')

        mockFetchRobotApi.mockReturnValue(
          cold<RobotApiResponse>('r', { r: Fixtures.mockUpdateBeginSuccess })
        )

        const action$ = hot<Action>('-a', { a: action })
        const state$ = hot<State>('a-', { a: state } as any)
        const output$ = epics.createSessionEpic(action$, state$)

        expectObservable(output$).toBe('-s', {
          s: actions.createSessionSuccess(
            robot,
            Fixtures.mockUpdateBeginSuccess.body.token,
            '/server/update'
          ),
        })

        flush()
        expect(mockFetchRobotApi).toHaveBeenCalledWith(robot, {
          method: 'POST',
          path: '/server/update/begin',
        })
      })
    })

    it('sends request to cancel URL if 409 and reissues CREATE_SESSION', () => {
      testScheduler.run(({ hot, cold, expectObservable, flush }) => {
        const action = actions.createSession(robot, '/server/update/begin')

        mockFetchRobotApi
          .mockReturnValueOnce(
            cold<RobotApiResponse>('r', { r: Fixtures.mockUpdateBeginConflict })
          )
          .mockReturnValueOnce(
            cold<RobotApiResponse>('r', { r: Fixtures.mockUpdateCancelSuccess })
          )

        const action$ = hot<Action>('-a', { a: action })
        const state$ = hot<State>('a-', { a: state } as any)
        const output$ = epics.createSessionEpic(action$, state$)

        expectObservable(output$).toBe('-a', { a: action })
        flush()
        expect(mockFetchRobotApi).toHaveBeenCalledWith(robot, {
          method: 'POST',
          path: '/server/update/cancel',
        })
      })
    })

    it('issues error if begin request fails without 409', () => {
      testScheduler.run(({ hot, cold, expectObservable, flush }) => {
        const action = actions.createSession(robot, '/server/update/begin')

        mockFetchRobotApi.mockReturnValueOnce(
          cold('r', { r: Fixtures.mockUpdateBeginFailure })
        )

        const action$ = hot<Action>('-a', { a: action })
        const state$ = hot<State>('a-', { a: state } as any)
        const output$ = epics.createSessionEpic(action$, state$)

        expectObservable(output$).toBe('-e', {
          e: actions.unexpectedRobotUpdateError(
            'Unable to start update session'
          ),
        })
      })
    })

    it('issues error if cancel request fails', () => {
      testScheduler.run(({ hot, cold, expectObservable, flush }) => {
        const action = actions.createSession(robot, '/server/update/begin')

        mockFetchRobotApi
          .mockReturnValueOnce(
            cold('r', { r: Fixtures.mockUpdateBeginConflict })
          )
          .mockReturnValueOnce(
            cold('r', { r: Fixtures.mockUpdateCancelFailure })
          )

        const action$ = hot<Action>('-a', { a: action })
        const state$ = hot<State>('a-', { a: state } as any)
        const output$ = epics.createSessionEpic(action$, state$)

        expectObservable(output$).toBe('-e', {
          e: actions.unexpectedRobotUpdateError(
            'Unable to cancel in-progress update session'
          ),
        })
      })
    })
  })

  it('retryAfterPremigrationEpic', () => {
    testScheduler.run(({ hot, expectObservable }) => {
      getRobotUpdateRobot.mockReturnValueOnce(brReadyRobot)
      getRobotUpdateSessionRobotName.mockReturnValueOnce(brReadyRobot.name)
      getRobotUpdateSession.mockReturnValueOnce({
        robot: brReadyRobot.name,
        step: 'premigrationRestart',
      } as any)

      const state$ = hot<State>('-a', { a: state })
      const output$ = epics.retryAfterPremigrationEpic(null as any, state$)

      expectObservable(output$).toBe('-a', {
        a: actions.startRobotUpdate(brReadyRobot.name),
      })
    })
  })

  it('statusPollEpic', () => {
    testScheduler.run(
      ({ hot, cold, expectObservable, expectSubscriptions, flush }) => {
        const action = {
          type: 'robotUpdate:CREATE_SESSION_SUCCESS',
          payload: {
            host: brRobot,
            token: 'foobar',
            pathPrefix: '/server/update',
          },
        }

        getRobotUpdateSession
          .mockReturnValue({ stage: 'ready-for-restart' } as any)
          .mockReturnValueOnce({ stage: null } as any)

        mockFetchRobotApi.mockReturnValue(
          cold('r', { r: Fixtures.mockStatusSuccess })
        )

        const action$ = hot<Action>('-a', { a: action } as any)
        const state$ = hot<State>('-x 4s y 2s y #', {
          x: state,
          y: state,
        })
        const output$ = epics.statusPollEpic(action$, state$)
        const { stage, message, progress } = Fixtures.mockStatusSuccess.body
        const expectedAction = actions.robotUpdateStatus(
          stage,
          message,
          Math.round(progress * 100)
        )

        expectSubscriptions(state$.subscriptions).toBe('-^ 4s !')
        expectObservable(output$).toBe('- 2s a 1999ms a', {
          a: expectedAction,
        })
        flush()

        const request = { method: 'GET', path: '/server/update/foobar/status' }
        expect(mockFetchRobotApi).toHaveBeenNthCalledWith(1, brRobot, request)
        expect(mockFetchRobotApi).toHaveBeenNthCalledWith(2, brRobot, request)
      }
    )
  })

  it('uploadFileEpic', () => {
    testScheduler.run(({ hot, expectObservable }) => {
      const session: ReturnType<typeof getRobotUpdateSession> = {
        pathPrefix: '/server/update/migration',
        token: 'tok',
        stage: 'awaiting-file',
        step: 'getToken',
      } as any

      getRobotUpdateRobot.mockReturnValue(brReadyRobot)
      getRobotUpdateSession.mockReturnValue(session)

      const action$ = null as any
      const state$ = hot<State>('-a', { a: state })
      const output$ = epics.uploadFileEpic(action$, state$)

      expectObservable(output$).toBe('-a', {
        a: actions.uploadRobotUpdateFile(
          brReadyRobot,
          '/server/update/migration/tok/file',
          null
        ),
      })
    })
  })

  describe('commitUpdateEpic', () => {
    const session = {
      pathPrefix: '/server/update',
      token: 'foobar',
      stage: 'done',
      step: 'processFile',
    } as any

    it('commit request success', () => {
      testScheduler.run(({ hot, cold, expectObservable, flush }) => {
        getRobotUpdateRobot.mockReturnValue(brRobot)
        getRobotUpdateSession.mockReturnValue(session)

        mockFetchRobotApi.mockReturnValue(
          cold('-r', { r: Fixtures.mockCommitSuccess })
        )

        const action$ = hot<Action>('--')
        const state$ = hot<State>('-a', { a: state })
        const output$ = epics.commitUpdateEpic(action$, state$)

        expectObservable(output$).toBe('-a', {
          a: actions.setRobotUpdateSessionStep('commitUpdate'),
        })

        flush()
        expect(mockFetchRobotApi).toHaveBeenCalledWith(brRobot, {
          method: 'POST',
          path: '/server/update/foobar/commit',
        })
      })
    })

    it('commit request failure', () => {
      testScheduler.run(({ hot, cold, expectObservable }) => {
        getRobotUpdateRobot.mockReturnValue(brRobot)
        getRobotUpdateSession.mockReturnValue(session)

        mockFetchRobotApi.mockReturnValue(
          cold('-r', { r: Fixtures.mockCommitFailure })
        )

        const action$ = hot<Action>('--')
        const state$ = hot<State>('-a', { a: state })
        const output$ = epics.commitUpdateEpic(action$, state$)

        expectObservable(output$).toBe('-ab', {
          a: actions.setRobotUpdateSessionStep('commitUpdate'),
          b: actions.unexpectedRobotUpdateError('Unable to commit update: AH'),
        })
      })
    })
  })

  describe('restartAfterCommitEpic', () => {
    const session = {
      pathPrefix: '/server/update',
      token: 'foobar',
      stage: 'ready-for-restart',
      step: 'commitUpdate',
    } as any

    it('restart request success', () => {
      testScheduler.run(({ hot, cold, expectObservable, flush }) => {
        getRobotUpdateRobot.mockReturnValue(brRobot)
        getRobotUpdateSession.mockReturnValue(session)

        mockFetchRobotApi.mockReturnValue(
          cold('-r', { r: Fixtures.mockRestartSuccess })
        )

        const action$ = hot<Action>('--')
        const state$ = hot<State>('-a', { a: state })
        const output$ = epics.restartAfterCommitEpic(action$, state$)

        expectObservable(output$).toBe('-a(bc)', {
          a: actions.setRobotUpdateSessionStep('restart'),
          b: startDiscovery(1200000),
          c: restartRobotSuccess(robot.name, {} as any),
        })

        flush()
        expect(mockFetchRobotApi).toHaveBeenCalledWith(brRobot, {
          method: 'POST',
          path: '/server/restart',
        })
      })
    })

    it('restart request failure', () => {
      testScheduler.run(({ hot, cold, expectObservable }) => {
        getRobotUpdateRobot.mockReturnValue(brRobot)
        getRobotUpdateSession.mockReturnValue(session)

        mockFetchRobotApi.mockReturnValue(
          cold('-r', { r: Fixtures.mockRestartFailure })
        )

        const action$ = hot<Action>('--')
        const state$ = hot<State>('-a', { a: state })
        const output$ = epics.restartAfterCommitEpic(action$, state$)

        expectObservable(output$).toBe('-ab', {
          a: actions.setRobotUpdateSessionStep('restart'),
          b: actions.unexpectedRobotUpdateError('Unable to restart robot: AH'),
        })
      })
    })
  })

  describe('user file upload epics', () => {
    it('retryAfterUserFileInfoEpic', () => {
      testScheduler.run(({ hot, cold, expectObservable }) => {
        getRobotUpdateSessionRobotName.mockReturnValue(balenaRobot.name)

        const action$ = hot<Action>('-a', {
          a: { type: 'robotUpdate:USER_FILE_INFO' },
        } as any)
        const state$ = hot<State>('a-', { a: state } as any)
        const output$ = epics.retryAfterUserFileInfoEpic(action$, state$)

        expectObservable(output$).toBe('-a', {
          a: actions.startRobotUpdate(balenaRobot.name),
        })
      })
    })

    it('uploadFileEpic sends systemFile if it exists in session', () => {
      testScheduler.run(({ hot, expectObservable }) => {
        const session = {
          pathPrefix: '/server/update/migration',
          token: 'tok',
          stage: 'awaiting-file',
          step: 'getToken',
          userFileInfo: { systemFile: '/path/to/system.zip' },
        } as any

        getRobotUpdateRobot.mockReturnValue(brReadyRobot)
        getRobotUpdateSession.mockReturnValue(session)

        const action$ = null as any
        const state$ = hot<State>('-a', { a: state })
        const output$ = epics.uploadFileEpic(action$, state$)

        expectObservable(output$).toBe('-a', {
          a: actions.uploadRobotUpdateFile(
            brReadyRobot,
            '/server/update/migration/tok/file',
            '/path/to/system.zip'
          ),
        })
      })
    })
  })
})
