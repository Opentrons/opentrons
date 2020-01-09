// @flow
// epics to control the buildroot migration / update flow
import every from 'lodash/every'
import { combineEpics, ofType } from 'redux-observable'
import { of, interval, concat, EMPTY } from 'rxjs'
import {
  filter,
  map,
  mapTo,
  switchMap,
  mergeMap,
  takeUntil,
  withLatestFrom,
} from 'rxjs/operators'

// imported directly to avoid circular dependencies between discovery and shell
import { getAllRobots, getRobotApiVersion } from '../discovery/selectors'
import {
  startDiscovery,
  finishDiscovery,
  removeRobot,
} from '../discovery/actions'

import { GET, POST, fetchRobotApi } from '../robot-api'
import { RESTART_PATH } from '../robot-admin'
import { actions as robotActions } from '../robot'

import {
  getBuildrootTargetVersion,
  getBuildrootSession,
  getBuildrootRobotName,
  getBuildrootRobot,
} from './selectors'

import {
  startBuildrootUpdate,
  startBuildrootPremigration,
  readUserBuildrootFile,
  createSession,
  createSessionSuccess,
  buildrootStatus,
  uploadBuildrootFile,
  setBuildrootSessionStep,
  unexpectedBuildrootError,
} from './actions'

import {
  PREMIGRATION_RESTART,
  GET_TOKEN,
  PROCESS_FILE,
  COMMIT_UPDATE,
  RESTART,
  RESTARTING,
  FINISHED,
  AWAITING_FILE,
  DONE,
  READY_FOR_RESTART,
  BR_START_UPDATE,
  BR_USER_FILE_INFO,
  BR_CREATE_SESSION,
  BR_CREATE_SESSION_SUCCESS,
} from './constants'

import type { State, Epic } from '../types'
import type { ViewableRobot } from '../discovery/types'
import type { RobotApiResponse } from '../robot-api/types'

import type {
  BuildrootAction,
  StartBuildrootUpdateAction,
  CreateSessionAction,
  CreateSessionSuccessAction,
  BuildrootUpdateSession,
} from './types'

export const POLL_INTERVAL_MS = 2000
export const REDISCOVERY_TIME_MS = 1200000

// TODO(mc, 2020-01-08): i18n
const UNABLE_TO_FIND_ROBOT_WITH_NAME = 'Unable to find online robot with name'
const ROBOT_HAS_BAD_CAPABILITIES = 'Robot has incorrect capabilities shape'
const UNABLE_TO_START_UPDATE_SESSION = 'Unable to start update session'
const UNABLE_TO_CANCEL_UPDATE_SESSION =
  'Unable to cancel in-progress update session'
const UNABLE_TO_COMMIT_UPDATE = 'Unable to commit update'
const UNABLE_TO_RESTART_ROBOT = 'Unable to restart robot'
const ROBOT_RECONNECTED_WITH_VERSION = 'Robot reconnected with version'
const BUT_WE_EXPECTED = 'but we expected'
const UNKNOWN = 'unknown'

// listen for the kickoff action and:
//   if not ready for buildroot, kickoff premigration
//   if not migrated, kickoff migration
//   if  migrated, kickoff regular buildroot update
export const startUpdateEpic: Epic = (action$, state$) =>
  action$.pipe(
    ofType(BR_START_UPDATE),
    withLatestFrom(state$),
    map<[StartBuildrootUpdateAction, State], _>(([action, state]) => {
      // BR_START_UPDATE will set the active updating robot in state
      const { robotName, systemFile } = action.payload
      const host = getBuildrootRobot(state)
      const serverHealth = host?.serverHealth || null

      // we need the target robot's update server to be up to do anything
      if (host === null || serverHealth === null) {
        return unexpectedBuildrootError(
          `${UNABLE_TO_FIND_ROBOT_WITH_NAME} ${robotName}`
        )
      }

      const capabilities = serverHealth.capabilities || null

      // if action passed a system file, we need to read that file
      if (systemFile !== null) {
        return readUserBuildrootFile(systemFile)
      }

      // if capabilities is empty, the robot requires premigration
      if (capabilities === null) {
        return startBuildrootPremigration(host)
      }

      // otherwise robot is ready for migration or update, so get token
      // capabilities response has the correct request path to use
      const sessionPath =
        capabilities['buildrootUpdate'] || capabilities['buildrootMigration']

      if (sessionPath == null) {
        return unexpectedBuildrootError(
          `${ROBOT_HAS_BAD_CAPABILITIES}: ${JSON.stringify(capabilities)}`
        )
      }

      return createSession(host, sessionPath)
    })
  )

// listen for a the active robot to come back with capabilities after premigration
export const retryAfterPremigrationEpic: Epic = (_, state$) => {
  return state$.pipe(
    switchMap(state => {
      const session = getBuildrootSession(state)
      const robot = getBuildrootRobot(state)

      return robot !== null &&
        session?.step === PREMIGRATION_RESTART &&
        robot.serverHealth?.capabilities != null
        ? of(startBuildrootUpdate(robot.name))
        : EMPTY
    })
  )
}

export const retryAfterUserFileInfoEpic: Epic = (action$, state$) => {
  return action$.pipe(
    ofType(BR_USER_FILE_INFO),
    withLatestFrom(state$, (_, state) => getBuildrootRobotName(state)),
    filter(robotName => robotName !== null),
    map<string, _>(robotName => startBuildrootUpdate(robotName))
  )
}

// create a buildroot update session
// if unable to create because of 409 conflict, cancel session and retry
export const createSessionEpic: Epic = action$ => {
  return action$.pipe(
    ofType(BR_CREATE_SESSION),
    switchMap<CreateSessionAction, _, _>(createAction => {
      const { host, sessionPath } = createAction.payload
      return fetchRobotApi(host, { method: POST, path: sessionPath })
    }),
    switchMap(resp => {
      const { host, path, ok, status } = resp
      const pathPrefix = path.replace('/begin', '')

      if (ok) {
        return of(createSessionSuccess(host, resp.body.token, pathPrefix))
      }

      if (!ok && status === 409) {
        return fetchRobotApi(host, {
          method: POST,
          path: `${pathPrefix}/cancel`,
        }).pipe(
          map(cancelResp => {
            return cancelResp.ok
              ? createSession(host, path)
              : unexpectedBuildrootError(UNABLE_TO_CANCEL_UPDATE_SESSION)
          })
        )
      }

      return of(unexpectedBuildrootError(UNABLE_TO_START_UPDATE_SESSION))
    })
  )
}

// epic to listen for token creation success success and start a
// status poll until the status switches to 'ready-for-restart'
export const statusPollEpic: Epic = (action$, state$) => {
  return action$.pipe(
    ofType(BR_CREATE_SESSION_SUCCESS),
    mergeMap<CreateSessionSuccessAction, _, _>(action => {
      const { host, token, pathPrefix } = action.payload
      const request = { method: GET, path: `${pathPrefix}/${token}/status` }

      return interval(POLL_INTERVAL_MS).pipe(
        takeUntil(
          state$.pipe(
            filter<State, _>(state => {
              const session = getBuildrootSession(state)
              return (
                session?.stage === READY_FOR_RESTART ||
                session?.error === true ||
                session === null
              )
            })
          )
        ),
        switchMap(() => fetchRobotApi(host, request)),
        filter(resp => resp.ok),
        map<RobotApiResponse, BuildrootAction>(successResp =>
          buildrootStatus(
            successResp.body.stage,
            successResp.body.message,
            successResp.body.progress != null
              ? Math.round(successResp.body.progress * 100)
              : null
          )
        )
      )
    })
  )
}

// filter for an active session with given properties
const passActiveSession = (props: $Shape<BuildrootUpdateSession>) => (
  state: State
): boolean => {
  const robot = getBuildrootRobot(state)
  const session = getBuildrootSession(state)

  return (
    robot !== null &&
    !session?.error &&
    typeof session?.pathPrefix === 'string' &&
    typeof session?.token === 'string' &&
    every(props, (value, key) => session?.[key] === value)
  )
}

// upload the update file to the robot when it switches to `awaiting-file`
export const uploadFileEpic: Epic = (_, state$) => {
  return state$.pipe(
    filter(passActiveSession({ stage: AWAITING_FILE, step: GET_TOKEN })),
    map<State, _>(stateWithSession => {
      const host: ViewableRobot = (getBuildrootRobot(stateWithSession): any)
      const session = getBuildrootSession(stateWithSession)
      const pathPrefix: string = (session?.pathPrefix: any)
      const token: string = (session?.token: any)
      const systemFile = session?.userFileInfo?.systemFile || null

      return uploadBuildrootFile(
        host,
        `${pathPrefix}/${token}/file`,
        systemFile
      )
    })
  )
}

// commit the update file on the robot when it switches to `done`
export const commitUpdateEpic: Epic = (_, state$) => {
  return state$.pipe(
    filter(passActiveSession({ stage: DONE, step: PROCESS_FILE })),
    switchMap<State, _, BuildrootAction>(stateWithSession => {
      const host: ViewableRobot = (getBuildrootRobot(stateWithSession): any)
      const session = getBuildrootSession(stateWithSession)
      const pathPrefix: string = (session?.pathPrefix: any)
      const token: string = (session?.token: any)
      const path = `${pathPrefix}/${token}/commit`
      const request$ = fetchRobotApi(host, { method: POST, path }).pipe(
        filter(resp => !resp.ok),
        map(resp => {
          return unexpectedBuildrootError(
            `${UNABLE_TO_COMMIT_UPDATE}: ${resp.body.message}`
          )
        })
      )

      return concat(of(setBuildrootSessionStep(COMMIT_UPDATE)), request$)
    })
  )
}

// restart the robot when it switches to `ready-for-restart`
export const restartAfterCommitEpic: Epic = (_, state$) => {
  return state$.pipe(
    filter(
      passActiveSession({ stage: READY_FOR_RESTART, step: COMMIT_UPDATE })
    ),
    switchMap<State, _, _>(stateWithSession => {
      const host: ViewableRobot = (getBuildrootRobot(stateWithSession): any)
      const path = host.serverHealth?.capabilities?.restart || RESTART_PATH
      const request$ = fetchRobotApi(host, { method: POST, path }).pipe(
        map(resp => {
          return resp.ok
            ? startDiscovery(REDISCOVERY_TIME_MS)
            : unexpectedBuildrootError(
                `${UNABLE_TO_RESTART_ROBOT}: ${resp.body.message}`
              )
        })
      )

      return concat(of(setBuildrootSessionStep(RESTART)), request$)
    })
  )
}

export const watchForOfflineAfterRestartEpic: Epic = (_, state$) => {
  return state$.pipe(
    filter(state => {
      const session = getBuildrootSession(state)
      const robot = getBuildrootRobot(state)

      return !robot?.ok && !session?.error && session?.step === RESTART
    }),
    mapTo(setBuildrootSessionStep(RESTARTING))
  )
}

export const watchForOnlineAfterRestartEpic: Epic = (_, state$) => {
  return state$.pipe(
    filter(state => {
      const session = getBuildrootSession(state)
      const robot = getBuildrootRobot(state)

      return (
        Boolean(robot?.ok) && !session?.error && session?.step === RESTARTING
      )
    }),
    switchMap<State, _, _>(stateWithRobot => {
      const targetVersion = getBuildrootTargetVersion(stateWithRobot)
      const robot: ViewableRobot = (getBuildrootRobot(stateWithRobot): any)
      const robotVersion = getRobotApiVersion(robot)
      const actual = robotVersion || UNKNOWN
      const expected = targetVersion || UNKNOWN

      const finishAction =
        targetVersion != null &&
        robotVersion != null &&
        robotVersion === targetVersion
          ? setBuildrootSessionStep(FINISHED)
          : unexpectedBuildrootError(
              `${ROBOT_RECONNECTED_WITH_VERSION} ${actual}, ${BUT_WE_EXPECTED} ${expected}`
            )

      return of(finishAction, finishDiscovery())
    })
  )
}

// if robot was renamed as part of migration, remove old robot name, balena
// robots have name opentrons-robot-name, BR robots have robot-name
// getBuildrootRobot will handle that logic, so we can compare name in state
// vs the actual robot we're interacting with
export const removeMigratedRobotsEpic: Epic = (_, state$) => {
  return state$.pipe(
    filter(state => {
      const robotName = getBuildrootRobotName(state)
      const robot = getBuildrootRobot(state)
      const allRobots = getAllRobots(state)

      return (
        robot !== null &&
        robotName !== null &&
        robot.name !== robotName &&
        allRobots.some(r => r.name === robotName)
      )
    }),
    map<State, _>(stateWithRobotName => {
      const robotName: string = (getBuildrootRobotName(stateWithRobotName): any)
      return removeRobot(robotName)
    })
  )
}

export const disconnectRpcOnStartEpic: Epic = action$ => {
  return action$.pipe(
    ofType(BR_START_UPDATE),
    mapTo(robotActions.disconnect())
  )
}

export const buildrootEpic = combineEpics(
  startUpdateEpic,
  retryAfterPremigrationEpic,
  retryAfterUserFileInfoEpic,
  createSessionEpic,
  statusPollEpic,
  uploadFileEpic,
  commitUpdateEpic,
  restartAfterCommitEpic,
  watchForOfflineAfterRestartEpic,
  watchForOnlineAfterRestartEpic,
  removeMigratedRobotsEpic,
  disconnectRpcOnStartEpic
)
