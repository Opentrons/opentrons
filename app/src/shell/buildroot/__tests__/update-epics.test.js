import { TestScheduler } from 'rxjs/testing'

import {
  makeRobotApiRequest,
  passRobotApiResponseAction,
  passRobotApiErrorAction,
} from '../../../robot-api'

import * as epics from '../update-epics'
import * as actions from '../actions'
import * as selectors from '../selectors'
import { INITIAL_STATE } from '../reducer'

jest.mock('../selectors')
jest.mock('../../../robot-api', () => ({
  makeRobotApiRequest: jest.fn(),
  passRobotApiResponseAction: jest.fn(),
  passRobotApiErrorAction: jest.fn(),
}))

const robot = { name: 'robot', host: '10.10.0.0', port: 31950 }

const balenaRobot = { ...robot, serverHealth: {} }

const brReadyRobot = {
  ...robot,
  serverHealth: {
    capabilities: { buildrootUpdate: '/server/update/migrate/begin' },
  },
}

const brRobot = {
  ...robot,
  serverHealth: { capabilities: { buildrootUpdate: '/server/update/begin' } },
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
    jest.clearAllMocks()
  })

  describe('startUpdateEpic', () => {
    test('with BR robot sends request to token URL', () => {
      testScheduler.run(({ hot, cold, expectObservable }) => {
        const action = actions.startBuildrootUpdate(robot.name)

        selectors.getBuildrootRobot.mockReturnValueOnce(brRobot)
        makeRobotApiRequest.mockImplementationOnce((req, meta) =>
          cold('--a', { a: { req, meta } })
        )

        const action$ = hot('-a', { a: action })
        const state$ = hot('s-', { s: state })
        const output$ = epics.startUpdateEpic(action$, state$)

        expectObservable(output$).toBe('---a', {
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
          cold('--a', { a: { req, meta } })
        )

        const action$ = hot('-a', { a: action })
        const state$ = hot('s-', { s: state })
        const output$ = epics.startUpdateEpic(action$, state$)

        expectObservable(output$).toBe('---a', {
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
        const state$ = hot('s-', { s: state })
        const output$ = epics.startUpdateEpic(action$, state$)

        expectObservable(output$).toBe('-a', {
          a: actions.startBuildrootPremigration(balenaRobot),
        })
      })
    })

    test('with bad robot sends UNEXPECTED_ERROR', () => {
      testScheduler.run(({ hot, expectObservable }) => {
        const action = actions.startBuildrootUpdate(robot.name)

        selectors.getBuildrootRobot.mockReturnValueOnce(robot)

        const action$ = hot('-a', { a: action })
        const state$ = hot('s-', { s: state })
        const output$ = epics.startUpdateEpic(action$, state$)

        expectObservable(output$).toBe('-a', {
          a: actions.unexpectedBuildrootError(),
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
          cold('--a', { a: { req, meta } })
        )

        const action$ = hot('-a', { a: action })
        const output$ = epics.cancelSessionOnConflictEpic(action$)

        expectObservable(output$).toBe('---a', {
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
        triggerUpdate: true,
      })

      const state$ = hot('-s', { s: state })
      const output$ = epics.triggerUpdateAfterPremigrationEpic(null, state$)

      expectObservable(output$).toBe('-a', {
        a: actions.startBuildrootUpdate(brReadyRobot.name),
      })
    })
  })
})
