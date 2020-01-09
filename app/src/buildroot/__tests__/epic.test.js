import { TestScheduler } from 'rxjs/testing'

import {
  makeRobotApiRequest,
  passRobotApiResponseAction,
  passRobotApiErrorAction,
} from '../../robot-api/deprecated'

import * as epics from '../epic'
import * as actions from '../actions'
import * as selectors from '../selectors'
import { INITIAL_STATE } from '../reducer'

jest.mock('../selectors')
jest.mock('../../robot-api/deprecated')

const robot = { name: 'robot', host: '10.10.0.0', port: 31950 }

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
    test('with BR robot sends request to token URL', () => {
      testScheduler.run(({ hot, cold, expectObservable }) => {
        const action = actions.startBuildrootUpdate(robot.name)

        selectors.getBuildrootRobot.mockReturnValueOnce(brRobot)
        makeRobotApiRequest.mockImplementationOnce((req, meta) =>
          cold('-a', { a: { req, meta } })
        )

        const action$ = hot('-a', { a: action })
        const state$ = hot('a-', { a: state })
        const output$ = epics.startUpdateEpic(action$, state$)

        expectObservable(output$).toBe('--a', {
          a: {
            req: {
              method: 'POST',
              host: brRobot,
              path: '/server/update/begin',
            },
            meta: { buildrootPrefix: '/server/update', buildrootToken: true },
          },
        })
      })
    })

    test('with BR-ready robot sends request to token URL', () => {
      testScheduler.run(({ hot, cold, expectObservable }) => {
        const action = actions.startBuildrootUpdate(robot.name)

        selectors.getBuildrootRobot.mockReturnValueOnce(brReadyRobot)
        makeRobotApiRequest.mockImplementationOnce((req, meta) =>
          cold('-a', { a: { req, meta } })
        )

        const action$ = hot('-a', { a: action })
        const state$ = hot('a-', { a: state })
        const output$ = epics.startUpdateEpic(action$, state$)

        expectObservable(output$).toBe('--a', {
          a: {
            req: {
              method: 'POST',
              host: brReadyRobot,
              path: '/server/update/migrate/begin',
            },
            meta: {
              buildrootPrefix: '/server/update/migrate',
              buildrootToken: true,
            },
          },
        })
      })
    })

    test('with balena robot sends START_PREMIGRATION', () => {
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

    test('with systemFile in payload sends READ_USER_FILE', () => {
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

    test('with bad robot sends UNEXPECTED_ERROR', () => {
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

  describe('token conflict epics', () => {
    test('cancelSessionOnConflictEpic sends cancel on token conflict', () => {
      testScheduler.run(({ hot, cold, expectObservable }) => {
        const action = {
          type: 'robotApi:ERROR__POST__/server/update/begin',
          payload: { host: brRobot, ok: false, status: 409 },
          meta: { buildrootPrefix: '/server/update', buildrootToken: true },
        }

        passRobotApiErrorAction.mockImplementationOnce(a => a)
        makeRobotApiRequest.mockImplementationOnce((req, meta) =>
          cold('-a', { a: { req, meta } })
        )

        const action$ = hot('-a', { a: action })
        const output$ = epics.cancelSessionOnConflictEpic(action$)

        expectObservable(output$).toBe('--a', {
          a: {
            req: {
              method: 'POST',
              host: brRobot,
              path: '/server/update/cancel',
            },
            meta: { buildrootRetry: true },
          },
        })
      })
    })

    test('triggerUpdateAfterCancelEpic sends START_UPDATE after cancel success', () => {
      testScheduler.run(({ hot, expectObservable }) => {
        const action = {
          type: 'robotApi:RESPONSE__POST__/server/update/cancel',
          payload: { host: brRobot, ok: true },
          meta: { buildrootRetry: true },
        }

        passRobotApiResponseAction.mockImplementationOnce(a => a)

        const action$ = hot('-a', { a: action })
        const output$ = epics.triggerUpdateAfterCancelEpic(action$)

        expectObservable(output$).toBe('-a', {
          a: actions.startBuildrootUpdate(brRobot.name),
        })
      })
    })
  })

  test('triggerUpdateAfterPremigrationEpic', () => {
    testScheduler.run(({ hot, expectObservable }) => {
      selectors.getBuildrootRobot.mockReturnValueOnce(brReadyRobot)
      selectors.getBuildrootRobotName.mockReturnValueOnce(brReadyRobot.name)
      selectors.getBuildrootSession.mockReturnValueOnce({
        robot: brReadyRobot.name,
        step: 'premigrationRestart',
      })

      const state$ = hot('-a', { a: state })
      const output$ = epics.triggerUpdateAfterPremigrationEpic(null, state$)

      expectObservable(output$).toBe('-a', {
        a: actions.startBuildrootUpdate(brReadyRobot.name),
      })
    })
  })

  test('statusPollEpic', () => {
    testScheduler.run(
      ({ hot, cold, expectObservable, expectSubscriptions }) => {
        const action = {
          type: 'robotApi:RESPONSE__POST__/server/update/begin',
          payload: { host: brRobot, ok: true, body: { token: 'a-token' } },
          meta: { buildrootPrefix: '/server/update', buildrootToken: true },
        }

        selectors.getBuildrootSession
          .mockReturnValue({ stage: 'ready-for-restart' })
          .mockReturnValueOnce({ stage: null })

        passRobotApiResponseAction.mockImplementationOnce(a => a)
        makeRobotApiRequest.mockImplementation((req, meta) =>
          cold('a', { a: { req, meta } })
        )

        const action$ = hot('-a', { a: action })
        const state$ = hot('-x 4s y 2s y #', { x: state, y: state })
        const output$ = epics.statusPollEpic(action$, state$)
        const expectedPoll = {
          req: {
            method: 'GET',
            host: brRobot,
            path: '/server/update/a-token/status',
          },
          meta: { buildrootStatus: true },
        }

        expectSubscriptions(state$.subscriptions).toBe('-^ 4s !')
        expectObservable(output$).toBe('- 2s a 1999ms a', {
          a: expectedPoll,
        })
      }
    )
  })

  test('uploadFileEpic', () => {
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

  test('commitUpdateEpic', () => {
    testScheduler.run(({ hot, cold, expectObservable }) => {
      const session = {
        pathPrefix: '/server/update',
        token: 'tok',
        stage: 'done',
        step: 'processFile',
      }

      selectors.getBuildrootRobot.mockReturnValue(brRobot)
      selectors.getBuildrootSession.mockReturnValue(session)
      makeRobotApiRequest.mockImplementation((req, meta) =>
        cold('--a', { a: { req, meta } })
      )

      const action$ = null
      const state$ = hot('-a', { a: state })
      const output$ = epics.commitUpdateEpic(action$, state$)

      expectObservable(output$).toBe('---a', {
        a: {
          req: {
            method: 'POST',
            host: brRobot,
            path: '/server/update/tok/commit',
          },
          meta: { buildrootCommit: true },
        },
      })
    })
  })

  test('restartAfterCommitEpic', () => {
    testScheduler.run(({ hot, cold, expectObservable }) => {
      const session = {
        pathPrefix: '/server/update',
        token: 'a-token',
        stage: 'ready-for-restart',
        step: 'commitUpdate',
      }

      selectors.getBuildrootRobot.mockReturnValue(brRobot)
      selectors.getBuildrootSession.mockReturnValue(session)
      makeRobotApiRequest.mockImplementation((req, meta) =>
        cold('--a', { a: { req, meta } })
      )

      const action$ = null
      const state$ = hot('-a', { a: state })
      const output$ = epics.restartAfterCommitEpic(action$, state$)

      expectObservable(output$).toBe('---a', {
        a: {
          req: {
            method: 'POST',
            host: brRobot,
            path: '/server/restart',
          },
          meta: { buildrootRestart: true },
        },
      })
    })
  })

  describe('user file upload epics', () => {
    test('triggerUpdateAfterUserFileInfo', () => {
      testScheduler.run(({ hot, cold, expectObservable }) => {
        selectors.getBuildrootRobotName.mockReturnValue(balenaRobot.name)

        const action$ = hot('-a', { a: { type: 'buildroot:USER_FILE_INFO' } })
        const state$ = hot('a-', { a: state })
        const output$ = epics.triggerUpdateAfterUserFileInfo(action$, state$)

        expectObservable(output$).toBe('-a', {
          a: actions.startBuildrootUpdate(balenaRobot.name),
        })
      })
    })

    test('uploadFileEpic sends systemFile if it exists in session', () => {
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
