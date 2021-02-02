import { TestScheduler } from 'rxjs/testing'

import { mockRobot as robot } from '../../robot-api/__fixtures__'
import { startDiscovery } from '../../discovery'
import * as RobotApiHttp from '../../robot-api/http'
import * as Fixtures from '../__fixtures__'
import * as epics from '../epic'
import * as actions from '../actions'
import * as selectors from '../selectors'

import { INITIAL_STATE } from '../reducer'

jest.mock('../selectors')
jest.mock('../../robot-api/http')

const mockFetchRobotApi = RobotApiHttp.fetchRobotApi

const balenaRobot = { ...robot, serverHealth: {} }

const brReadyRobot = {
  ...robot,
  serverHealth: {
    capabilities: {
      buildrootUpdate: '/server/update/migrate/begin',
      restart: '/server/update/restart',
    },
  },
}

const brRobot = {
  ...robot,
  serverHealth: {
    capabilities: {
      buildrootUpdate: '/server/update/begin',
      restart: '/server/restart',
    },
  },
}

describe('buildroot update epics', () => {
  let state
  let testScheduler

  beforeEach(() => {
    state = { shell: { buildroot: { ...INITIAL_STATE } } }
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
        selectors.getBuildrootRobot.mockReturnValueOnce(brRobot)

        const action$ = hot('-a', {
          a: actions.startBuildrootUpdate(robot.name),
        })
        const state$ = hot('a-', { a: state })
        const output$ = epics.startUpdateEpic(action$, state$)

        expectObservable(output$).toBe('-a', {
          a: actions.createSession(brRobot, '/server/update/begin'),
        })
      })
    })

    it('with BR-ready robot sends CREATE_SESSION', () => {
      testScheduler.run(({ hot, cold, expectObservable }) => {
        selectors.getBuildrootRobot.mockReturnValueOnce(brReadyRobot)

        const action$ = hot('-a', {
          a: actions.startBuildrootUpdate(robot.name),
        })
        const state$ = hot('a-', { a: state })
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
        const action = actions.startBuildrootUpdate(robot.name)

        selectors.getBuildrootRobot.mockReturnValueOnce(balenaRobot)

        const action$ = hot('-a', { a: action })
        const state$ = hot('a-', { a: state })
        const output$ = epics.startUpdateEpic(action$, state$)

        expectObservable(output$).toBe('-a', {
          a: actions.startBuildrootPremigration(balenaRobot),
        })
      })
    })

    it('with systemFile in payload sends READ_USER_FILE', () => {
      testScheduler.run(({ hot, expectObservable }) => {
        const action = actions.startBuildrootUpdate(
          robot.name,
          '/path/to/system.zip'
        )

        selectors.getBuildrootRobot.mockReturnValueOnce(balenaRobot)

        const action$ = hot('-a', { a: action })
        const state$ = hot('a-', { a: state })
        const output$ = epics.startUpdateEpic(action$, state$)

        expectObservable(output$).toBe('-a', {
          a: actions.readUserBuildrootFile('/path/to/system.zip'),
        })
      })
    })

    it('with bad robot sends UNEXPECTED_ERROR', () => {
      testScheduler.run(({ hot, expectObservable }) => {
        const action = actions.startBuildrootUpdate(robot.name)

        selectors.getBuildrootRobot.mockReturnValueOnce(robot)

        const action$ = hot('-a', { a: action })
        const state$ = hot('a-', { a: state })
        const output$ = epics.startUpdateEpic(action$, state$)

        expectObservable(output$).toBe('-a', {
          a: actions.unexpectedBuildrootError(
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
          cold('r', { r: Fixtures.mockUpdateBeginSuccess })
        )

        const action$ = hot('-a', { a: action })
        const state$ = hot('a-', { a: state })
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
            cold('r', { r: Fixtures.mockUpdateBeginConflict })
          )
          .mockReturnValueOnce(
            cold('r', { r: Fixtures.mockUpdateCancelSuccess })
          )

        const action$ = hot('-a', { a: action })
        const state$ = hot('a-', { a: state })
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

        const action$ = hot('-a', { a: action })
        const state$ = hot('a-', { a: state })
        const output$ = epics.createSessionEpic(action$, state$)

        expectObservable(output$).toBe('-e', {
          e: actions.unexpectedBuildrootError('Unable to start update session'),
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

        const action$ = hot('-a', { a: action })
        const state$ = hot('a-', { a: state })
        const output$ = epics.createSessionEpic(action$, state$)

        expectObservable(output$).toBe('-e', {
          e: actions.unexpectedBuildrootError(
            'Unable to cancel in-progress update session'
          ),
        })
      })
    })
  })

  it('retryAfterPremigrationEpic', () => {
    testScheduler.run(({ hot, expectObservable }) => {
      selectors.getBuildrootRobot.mockReturnValueOnce(brReadyRobot)
      selectors.getBuildrootRobotName.mockReturnValueOnce(brReadyRobot.name)
      selectors.getBuildrootSession.mockReturnValueOnce({
        robot: brReadyRobot.name,
        step: 'premigrationRestart',
      })

      const state$ = hot('-a', { a: state })
      const output$ = epics.retryAfterPremigrationEpic(null, state$)

      expectObservable(output$).toBe('-a', {
        a: actions.startBuildrootUpdate(brReadyRobot.name),
      })
    })
  })

  it('statusPollEpic', () => {
    testScheduler.run(
      ({ hot, cold, expectObservable, expectSubscriptions, flush }) => {
        const action = {
          type: 'buildroot:CREATE_SESSION_SUCCESS',
          payload: {
            host: brRobot,
            token: 'foobar',
            pathPrefix: '/server/update',
          },
        }

        selectors.getBuildrootSession
          .mockReturnValue({ stage: 'ready-for-restart' })
          .mockReturnValueOnce({ stage: null })

        mockFetchRobotApi.mockReturnValue(
          cold('r', { r: Fixtures.mockStatusSuccess })
        )

        const action$ = hot('-a', { a: action })
        const state$ = hot('-x 4s y 2s y #', { x: state, y: state })
        const output$ = epics.statusPollEpic(action$, state$)
        const { stage, message, progress } = Fixtures.mockStatusSuccess.body
        const expectedAction = actions.buildrootStatus(
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
      const session = {
        pathPrefix: '/server/update/migration',
        token: 'tok',
        stage: 'awaiting-file',
        step: 'getToken',
      }

      selectors.getBuildrootRobot.mockReturnValue(brReadyRobot)
      selectors.getBuildrootSession.mockReturnValue(session)

      const action$ = null
      const state$ = hot('-a', { a: state })
      const output$ = epics.uploadFileEpic(action$, state$)

      expectObservable(output$).toBe('-a', {
        a: actions.uploadBuildrootFile(
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
    }

    it('commit request success', () => {
      testScheduler.run(({ hot, cold, expectObservable, flush }) => {
        selectors.getBuildrootRobot.mockReturnValue(brRobot)
        selectors.getBuildrootSession.mockReturnValue(session)

        mockFetchRobotApi.mockReturnValue(
          cold('-r', { r: Fixtures.mockCommitSuccess })
        )

        const action$ = hot('--')
        const state$ = hot('-a', { a: state })
        const output$ = epics.commitUpdateEpic(action$, state$)

        expectObservable(output$).toBe('-a', {
          a: actions.setBuildrootSessionStep('commitUpdate'),
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
        selectors.getBuildrootRobot.mockReturnValue(brRobot)
        selectors.getBuildrootSession.mockReturnValue(session)

        mockFetchRobotApi.mockReturnValue(
          cold('-r', { r: Fixtures.mockCommitFailure })
        )

        const action$ = hot('--')
        const state$ = hot('-a', { a: state })
        const output$ = epics.commitUpdateEpic(action$, state$)

        expectObservable(output$).toBe('-ab', {
          a: actions.setBuildrootSessionStep('commitUpdate'),
          b: actions.unexpectedBuildrootError('Unable to commit update: AH'),
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
    }

    it('restart request success', () => {
      testScheduler.run(({ hot, cold, expectObservable, flush }) => {
        selectors.getBuildrootRobot.mockReturnValue(brRobot)
        selectors.getBuildrootSession.mockReturnValue(session)

        mockFetchRobotApi.mockReturnValue(
          cold('-r', { r: Fixtures.mockRestartSuccess })
        )

        const action$ = hot('--')
        const state$ = hot('-a', { a: state })
        const output$ = epics.restartAfterCommitEpic(action$, state$)

        expectObservable(output$).toBe('-ab', {
          a: actions.setBuildrootSessionStep('restart'),
          b: startDiscovery(1200000),
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
        selectors.getBuildrootRobot.mockReturnValue(brRobot)
        selectors.getBuildrootSession.mockReturnValue(session)

        mockFetchRobotApi.mockReturnValue(
          cold('-r', { r: Fixtures.mockRestartFailure })
        )

        const action$ = hot('--')
        const state$ = hot('-a', { a: state })
        const output$ = epics.restartAfterCommitEpic(action$, state$)

        expectObservable(output$).toBe('-ab', {
          a: actions.setBuildrootSessionStep('restart'),
          b: actions.unexpectedBuildrootError('Unable to restart robot: AH'),
        })
      })
    })
  })

  describe('user file upload epics', () => {
    it('retryAfterUserFileInfoEpic', () => {
      testScheduler.run(({ hot, cold, expectObservable }) => {
        selectors.getBuildrootRobotName.mockReturnValue(balenaRobot.name)

        const action$ = hot('-a', { a: { type: 'buildroot:USER_FILE_INFO' } })
        const state$ = hot('a-', { a: state })
        const output$ = epics.retryAfterUserFileInfoEpic(action$, state$)

        expectObservable(output$).toBe('-a', {
          a: actions.startBuildrootUpdate(balenaRobot.name),
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
        }

        selectors.getBuildrootRobot.mockReturnValue(brReadyRobot)
        selectors.getBuildrootSession.mockReturnValue(session)

        const action$ = null
        const state$ = hot('-a', { a: state })
        const output$ = epics.uploadFileEpic(action$, state$)

        expectObservable(output$).toBe('-a', {
          a: actions.uploadBuildrootFile(
            brReadyRobot,
            '/server/update/migration/tok/file',
            '/path/to/system.zip'
          ),
        })
      })
    })
  })
})
