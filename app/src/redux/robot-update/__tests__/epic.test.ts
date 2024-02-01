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

const brRobotOt2 = {
  ...robot,
  serverHealth: {
    capabilities: {
      buildrootUpdate: '/server/update/begin',
      restart: '/server/restart',
    },
    robotModel: 'OT-2 Standard',
  },
} as any

const brRobotFlex = {
  ...robot,
  serverHealth: {
    capabilities: {
      buildrootUpdate: '/server/update/begin',
      restart: '/server/restart',
    },
    robotModel: 'OT-3 Standard',
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
    it('with ot2 system update robot and built-in system update sends read system file', () => {
      testScheduler.run(({ hot, cold, expectObservable }) => {
        getRobotUpdateRobot.mockReturnValueOnce(brRobotOt2)

        const action$ = hot<Action>('-a', {
          a: actions.startRobotUpdate(robot.name),
        })
        const state$ = hot<State>('a-', { a: state } as any)
        const output$ = epics.startUpdateEpic(action$, state$)

        expectObservable(output$).toBe('-a', {
          a: actions.readSystemRobotUpdateFile('ot2'),
        })
      })
    })

    it('with flex system update robot and built-in system update sends read system file', () => {
      testScheduler.run(({ hot, cold, expectObservable }) => {
        getRobotUpdateRobot.mockReturnValueOnce(brRobotFlex)

        const action$ = hot<Action>('-a', {
          a: actions.startRobotUpdate(robot.name),
        })
        const state$ = hot<State>('a-', { a: state } as any)
        const output$ = epics.startUpdateEpic(action$, state$)

        expectObservable(output$).toBe('-a', {
          a: actions.readSystemRobotUpdateFile('flex'),
        })
      })
    })

    it('with ot2 system update robot and user system update sends read user file', () => {
      testScheduler.run(({ hot, cold, expectObservable }) => {
        getRobotUpdateRobot.mockReturnValueOnce(brRobotOt2)

        const action$ = hot<Action>('-a', {
          a: actions.startRobotUpdate(robot.name, '/my/special/system/file'),
        })
        const state$ = hot<State>('a-', { a: state } as any)
        const output$ = epics.startUpdateEpic(action$, state$)

        expectObservable(output$).toBe('-a', {
          a: actions.readUserRobotUpdateFile('/my/special/system/file'),
        })
      })
    })

    it('with flex system update robot and user system update sends read user file', () => {
      testScheduler.run(({ hot, cold, expectObservable }) => {
        getRobotUpdateRobot.mockReturnValueOnce(brRobotFlex)

        const action$ = hot<Action>('-a', {
          a: actions.startRobotUpdate(robot.name, '/my/special/file'),
        })
        const state$ = hot<State>('a-', { a: state } as any)
        const output$ = epics.startUpdateEpic(action$, state$)

        expectObservable(output$).toBe('-a', {
          a: actions.readUserRobotUpdateFile('/my/special/file'),
        })
      })
    })

    it('with ready-to-migrate robot sends read system file', () => {
      testScheduler.run(({ hot, cold, expectObservable }) => {
        getRobotUpdateRobot.mockReturnValueOnce(brReadyRobot)

        const action$ = hot<Action>('-a', {
          a: actions.startRobotUpdate(robot.name),
        })
        const state$ = hot<State>('a-', { a: state } as any)
        const output$ = epics.startUpdateEpic(action$, state$)

        expectObservable(output$).toBe('-a', {
          a: actions.readSystemRobotUpdateFile('ot2'),
        })
      })
    })

    it('with ready-to-migrate robot and user system update sends read user file', () => {
      testScheduler.run(({ hot, cold, expectObservable }) => {
        getRobotUpdateRobot.mockReturnValueOnce(brReadyRobot)

        const action$ = hot<Action>('-a', {
          a: actions.startRobotUpdate(robot.name, '/my/special/system/file'),
        })
        const state$ = hot<State>('a-', { a: state } as any)
        const output$ = epics.startUpdateEpic(action$, state$)

        expectObservable(output$).toBe('-a', {
          a: actions.readUserRobotUpdateFile('/my/special/system/file'),
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

    it('with balena robot and specified file fails', () => {
      testScheduler.run(({ hot, expectObservable }) => {
        const action = actions.startRobotUpdate(
          robot.name,
          '/my/special/system/file'
        )

        getRobotUpdateRobot.mockReturnValueOnce(balenaRobot)

        const action$ = hot<Action>('-a', { a: action })
        const state$ = hot<State>('a-', { a: state } as any)
        const output$ = epics.startUpdateEpic(action$, state$)

        expectObservable(output$).toBe('-a', {
          a: actions.unexpectedRobotUpdateError(
            'This robot must be updated by the system before a custom update can occur'
          ),
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

    it('sends request to cancel URL if a non 409 occurs and reissues CREATE_SESSION', () => {
      testScheduler.run(({ hot, cold, expectObservable, flush }) => {
        const action = actions.createSession(robot, '/server/update/begin')

        mockFetchRobotApi
          .mockReturnValueOnce(
            cold<RobotApiResponse>('r', { r: Fixtures.mockUpdateBeginFailure })
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

    it('Issues an error if cancelling a session fails after a 409 error occurs', () => {
      testScheduler.run(({ hot, cold, expectObservable, flush }) => {
        const action = actions.createSession(robot, '/server/update/begin')

        mockFetchRobotApi
          .mockReturnValueOnce(
            cold<RobotApiResponse>('r', { r: Fixtures.mockUpdateBeginConflict })
          )
          .mockReturnValueOnce(
            cold<RobotApiResponse>('r', { r: Fixtures.mockUpdateCancelFailure })
          )

        const action$ = hot<Action>('-a', { a: action })
        const state$ = hot<State>('a-', { a: state } as any)
        const output$ = epics.createSessionEpic(action$, state$)

        expectObservable(output$).toBe('-a', {
          a: actions.unexpectedRobotUpdateError(
            'Unable to cancel in-progress update session'
          ),
        })
        flush()
      })
    })

    it('Issues an error if cancelling a session fails after a non 409 error occurs', () => {
      testScheduler.run(({ hot, cold, expectObservable, flush }) => {
        const action = actions.createSession(robot, '/server/update/begin')

        mockFetchRobotApi
          .mockReturnValueOnce(
            cold<RobotApiResponse>('r', { r: Fixtures.mockUpdateBeginFailure })
          )
          .mockReturnValueOnce(
            cold<RobotApiResponse>('r', { r: Fixtures.mockUpdateCancelFailure })
          )

        const action$ = hot<Action>('-a', { a: action })
        const state$ = hot<State>('a-', { a: state } as any)
        const output$ = epics.createSessionEpic(action$, state$)

        expectObservable(output$).toBe('-a', {
          a: actions.unexpectedRobotUpdateError(
            'Unable to start update session'
          ),
        })
        flush()
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

  describe('startUpdateAfterFileDownload', () => {
    it('should start the update after file download if the robot is a flex', () => {
      testScheduler.run(({ hot, cold, expectObservable }) => {
        const session: ReturnType<typeof getRobotUpdateSession> = {
          stage: 'done',
          step: 'downloadFile',
        } as any

        getRobotUpdateRobot.mockReturnValue(brRobotFlex)
        getRobotUpdateSession.mockReturnValue(session)

        const state$ = hot<State>('-a', { a: state })
        const output$ = epics.startUpdateAfterFileDownload(null as any, state$)

        expectObservable(output$).toBe('-a', {
          a: actions.readSystemRobotUpdateFile('flex'),
        })
      })
    })

    it('should start the update after file download if the robot is a ot-2', () => {
      testScheduler.run(({ hot, cold, expectObservable }) => {
        const session: ReturnType<typeof getRobotUpdateSession> = {
          stage: 'done',
          step: 'downloadFile',
        } as any

        getRobotUpdateRobot.mockReturnValue(brRobotOt2)
        getRobotUpdateSession.mockReturnValue(session)

        const state$ = hot<State>('-a', { a: state })
        const output$ = epics.startUpdateAfterFileDownload(null as any, state$)

        expectObservable(output$).toBe('-a', {
          a: actions.readSystemRobotUpdateFile('ot2'),
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
            host: brRobotOt2,
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
        expect(mockFetchRobotApi).toHaveBeenNthCalledWith(
          1,
          brRobotOt2,
          request
        )
        expect(mockFetchRobotApi).toHaveBeenNthCalledWith(
          2,
          brRobotOt2,
          request
        )
      }
    )
  })

  it('uploadFileEpic should work with migration', () => {
    testScheduler.run(({ hot, expectObservable }) => {
      const session: ReturnType<typeof getRobotUpdateSession> = {
        pathPrefix: '/server/update/migration',
        token: 'tok',
        stage: 'awaiting-file',
        step: 'getToken',
        fileInfo: {
          systemFile: '/some/file/path',
          version: '1.0.0',
          releaseNotes: 'hello',
        },
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
          '/some/file/path'
        ),
      })
    })
  })

  it('uploadFileEpic should work with ot2 normal updates', () => {
    testScheduler.run(({ hot, expectObservable }) => {
      const session: ReturnType<typeof getRobotUpdateSession> = {
        pathPrefix: '/server/update',
        token: 'tok',
        stage: 'awaiting-file',
        step: 'getToken',
        fileInfo: {
          systemFile: '/some/file/path',
          version: '1.0.0',
          releaseNotes: 'hello',
        },
      } as any

      getRobotUpdateRobot.mockReturnValue(brRobotOt2)
      getRobotUpdateSession.mockReturnValue(session)

      const action$ = null as any
      const state$ = hot<State>('-a', { a: state })
      const output$ = epics.uploadFileEpic(action$, state$)

      expectObservable(output$).toBe('-a', {
        a: actions.uploadRobotUpdateFile(
          brRobotOt2,
          '/server/update/tok/file',
          '/some/file/path'
        ),
      })
    })
  })

  it('uploadFileEpic should work with flex normal updates', () => {
    testScheduler.run(({ hot, expectObservable }) => {
      const session: ReturnType<typeof getRobotUpdateSession> = {
        pathPrefix: '/server/update',
        token: 'tok',
        stage: 'awaiting-file',
        step: 'getToken',
        fileInfo: {
          systemFile: '/some/file/path',
          version: '1.0.0',
          releaseNotes: 'hello',
        },
      } as any

      getRobotUpdateRobot.mockReturnValue(brRobotFlex)
      getRobotUpdateSession.mockReturnValue(session)

      const action$ = null as any
      const state$ = hot<State>('-a', { a: state })
      const output$ = epics.uploadFileEpic(action$, state$)

      expectObservable(output$).toBe('-a', {
        a: actions.uploadRobotUpdateFile(
          brRobotFlex,
          '/server/update/tok/file',
          '/some/file/path'
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
        getRobotUpdateRobot.mockReturnValue(brRobotOt2)
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
        expect(mockFetchRobotApi).toHaveBeenCalledWith(brRobotOt2, {
          method: 'POST',
          path: '/server/update/foobar/commit',
        })
      })
    })

    it('commit request failure', () => {
      testScheduler.run(({ hot, cold, expectObservable }) => {
        getRobotUpdateRobot.mockReturnValue(brRobotOt2)
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
        getRobotUpdateRobot.mockReturnValue(brRobotFlex)
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
        expect(mockFetchRobotApi).toHaveBeenCalledWith(brRobotFlex, {
          method: 'POST',
          path: '/server/restart',
        })
      })
    })

    it('restart request failure', () => {
      testScheduler.run(({ hot, cold, expectObservable }) => {
        getRobotUpdateRobot.mockReturnValue(brRobotOt2)
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
})
