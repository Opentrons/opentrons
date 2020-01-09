// @flow
// epics to control the buildroot migration / update flow
import every from 'lodash/every'
import { combineEpics, ofType } from 'redux-observable'
import { of, interval, concat } from 'rxjs'
import {
  filter,
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

import {
  makeRobotApiRequest,
  passRobotApiResponseAction,
  passRobotApiErrorAction,
} from '../robot-api/deprecated'

import { actions as robotActions } from '../robot'

import {
  getBuildrootTargetVersion,
  getBuildrootSession,
  getBuildrootRobotName,
  getBuildrootRobot,
} from './selectors'

import {
  BR_START_UPDATE,
  BR_USER_FILE_INFO,
  startBuildrootUpdate,
  startBuildrootPremigration,
  readUserBuildrootFile,
  uploadBuildrootFile,
  setBuildrootSessionStep,
  unexpectedBuildrootError,
} from './actions'

import type { State, Epic, LooseEpic } from '../types'
import type { ViewableRobot } from '../discovery/types'
import type { RobotApiResponseAction } from '../robot-api/deprecated'

import type {
  BuildrootAction,
  StartBuildrootUpdateAction,
  BuildrootUpdateSession,
} from './types'

export const POLL_INTERVAL_MS = 2000
export const REDISCOVERY_TIME_MS = 1200000

// listen for the kickoff action and:
//   if not ready for buildroot, kickoff premigration
//   if not migrated, kickoff migration
//   if  migrated, kickoff regular buildroot update
export const startUpdateEpic: Epic = (action$, state$) =>
  action$.pipe(
    ofType(BR_START_UPDATE),
    withLatestFrom(state$),
    switchMap<[StartBuildrootUpdateAction, State], _, mixed>(
      ([action, state]) => {
        // BR_START_UPDATE will set the active updating robot in state
        const { robotName, systemFile } = action.payload
        const host = getBuildrootRobot(state)
        const serverHealth = host?.serverHealth || null

        // we need the target robot's update server to be up to do anything
        if (host !== null && serverHealth !== null) {
          const capabilities = serverHealth.capabilities || null

          // if action passed a system file, we need to read that file
          if (systemFile !== null) {
            return of(readUserBuildrootFile(systemFile))
          }

          // if capabilities is empty, the robot requires premigration
          if (capabilities === null) {
            return of(startBuildrootPremigration(host))
          }

          // otherwise robot is ready for migration or update, so get token
          // capabilities response has the correct request path to use
          const path =
            capabilities['buildrootUpdate'] ||
            capabilities['buildrootMigration']

          if (path != null) {
            // the process is the same for migration vs. regular update, but
            // the paths are slightly different, so put it in metadata so we
            // know which endpoints to hit later in the process
            const prefix = path.replace(/\/begin$/, '')
            const meta = { buildrootPrefix: prefix, buildrootToken: true }

            return makeRobotApiRequest({ method: 'POST', host, path }, meta)
          }

          return of(
            unexpectedBuildrootError(
              `Robot ${robotName} has incorrect capabilities shape: ${JSON.stringify(
                capabilities
              )}`
            )
          )
        }

        return of(
          unexpectedBuildrootError(
            `Unable to find online robot with name ${robotName}`
          )
        )
      }
    )
  )

// listen for a 409 conflict come back from the BR start endpoint so we can]
// automatically cancel the existing session and start a new one
export const cancelSessionOnConflictEpic: LooseEpic = action$ =>
  action$.pipe(
    filter(action => {
      const error = passRobotApiErrorAction(action)

      return (
        typeof error?.meta.buildrootPrefix === 'string' &&
        error?.meta.buildrootToken === true &&
        error?.payload.status === 409
      )
    }),
    switchMap<RobotApiResponseAction, _, mixed>(errAction => {
      // filter ensures pathPrefix exists here
      const pathPrefix: string = (errAction.meta.buildrootPrefix: any)
      const { host } = errAction.payload
      const cancelRequest = {
        method: 'POST',
        host,
        path: `${pathPrefix}/cancel`,
      }

      return makeRobotApiRequest(cancelRequest, { buildrootRetry: true })
    })
  )

// listen for a successful session cancel by checking meta.buildrootRetry set
// in cancelSessionOnConflictEpic so we can retry the update
// TODO(mc, 2019-07-21): limit the number of retries
export const triggerUpdateAfterCancelEpic: LooseEpic = action$ =>
  action$.pipe(
    filter(action => {
      const response = passRobotApiResponseAction(action)
      return response?.meta.buildrootRetry === true
    }),
    switchMap<RobotApiResponseAction, _, mixed>(respAction => {
      const { host } = respAction.payload
      return of(startBuildrootUpdate(host.name))
    })
  )

// listen for a the active robot to come back with capabilities after premigration
export const triggerUpdateAfterPremigrationEpic: Epic = (_, state$) =>
  state$.pipe(
    filter(state => {
      const session = getBuildrootSession(state)
      const robot = getBuildrootRobot(state)
      return (
        robot !== null &&
        session?.step === 'premigrationRestart' &&
        robot.serverHealth?.capabilities != null
      )
    }),
    switchMap<State, _, BuildrootAction>(stateWithRobot => {
      // filter ensures robotName exists here
      const robotName: string = (getBuildrootRobotName(stateWithRobot): any)
      return of(startBuildrootUpdate(robotName))
    })
  )

export const triggerUpdateAfterUserFileInfo: Epic = (action$, state$) =>
  action$.pipe(
    ofType(BR_USER_FILE_INFO),
    withLatestFrom(state$),
    filter(([_, state]) => getBuildrootRobotName(state) !== null),
    switchMap<[BuildrootAction, State], _, BuildrootAction>(([_, state]) => {
      const robotName: string = (getBuildrootRobotName(state): any)
      return of(startBuildrootUpdate(robotName))
    })
  )

// epic to listen for /begin success (via meta.buildrootToken) and start a
// status poll until the status switches to 'ready-for-restart'
export const statusPollEpic: LooseEpic = (action$, state$) =>
  action$.pipe(
    filter(action => {
      const response = passRobotApiResponseAction(action)
      return (
        response?.meta.buildrootToken === true &&
        typeof response?.meta.buildrootPrefix === 'string'
      )
    }),
    mergeMap<RobotApiResponseAction, _, mixed>(respAction => {
      // filter above ensures pathPrefix exists here
      const pathPrefix: string = (respAction.meta.buildrootPrefix: any)
      const token: string = respAction.payload.body.token
      const { host } = respAction.payload
      const path = `${pathPrefix}/${token}/status`
      const request = { method: 'GET', host, path }
      const meta = { buildrootStatus: true }

      return interval(POLL_INTERVAL_MS).pipe(
        switchMap(() => makeRobotApiRequest(request, meta)),
        takeUntil(
          state$.pipe(
            filter<State, _>(state => {
              const session = getBuildrootSession(state)
              return (
                session?.stage === 'ready-for-restart' ||
                session?.error === true ||
                session === null
              )
            })
          )
        )
      )
    })
  )

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
export const uploadFileEpic: Epic = (_, state$) =>
  state$.pipe(
    filter(passActiveSession({ stage: 'awaiting-file', step: 'getToken' })),
    switchMap<State, _, BuildrootAction>(stateWithSession => {
      const host: ViewableRobot = (getBuildrootRobot(stateWithSession): any)
      const session = getBuildrootSession(stateWithSession)
      const pathPrefix: string = (session?.pathPrefix: any)
      const token: string = (session?.token: any)
      const systemFile = session?.userFileInfo?.systemFile || null

      return of(
        uploadBuildrootFile(host, `${pathPrefix}/${token}/file`, systemFile)
      )
    })
  )

// commit the update file on the robot when it switches to `done`
export const commitUpdateEpic: Epic = (_, state$) =>
  state$.pipe(
    filter(passActiveSession({ stage: 'done', step: 'processFile' })),
    switchMap<State, _, BuildrootAction>(stateWithSession => {
      const host: ViewableRobot = (getBuildrootRobot(stateWithSession): any)
      const session = getBuildrootSession(stateWithSession)
      const pathPrefix: string = (session?.pathPrefix: any)
      const token: string = (session?.token: any)
      const path = `${pathPrefix}/${token}/commit`
      const request = { method: 'POST', host, path }
      const meta = { buildrootCommit: true }

      return makeRobotApiRequest(request, meta)
    })
  )

// restart the robot when it switches to `ready-for-restart`
export const restartAfterCommitEpic: Epic = (_, state$) =>
  state$.pipe(
    filter(
      passActiveSession({ stage: 'ready-for-restart', step: 'commitUpdate' })
    ),
    switchMap<State, _, BuildrootAction>(stateWithSession => {
      const host: ViewableRobot = (getBuildrootRobot(stateWithSession): any)
      const path = host.serverHealth?.capabilities?.restart || '/server/restart'
      const request = { method: 'POST', host, path }
      const meta = { buildrootRestart: true }

      return concat(
        makeRobotApiRequest(request, meta),
        of(startDiscovery(REDISCOVERY_TIME_MS))
      )
    })
  )

export const watchForOfflineAfterRestartEpic: Epic = (_, state$) =>
  state$.pipe(
    filter(state => {
      const session = getBuildrootSession(state)
      const robot = getBuildrootRobot(state)

      return !robot?.ok && !session?.error && session?.step === 'restart'
    }),
    switchMap(() => of(setBuildrootSessionStep('restarting')))
  )

export const watchForOnlineAfterRestartEpic: Epic = (_, state$) =>
  state$.pipe(
    filter(state => {
      const session = getBuildrootSession(state)
      const robot = getBuildrootRobot(state)

      return (
        Boolean(robot?.ok) && !session?.error && session?.step === 'restarting'
      )
    }),
    switchMap<State, _, mixed>(stateWithRobot => {
      const targetVersion = getBuildrootTargetVersion(stateWithRobot)
      const robot: ViewableRobot = (getBuildrootRobot(stateWithRobot): any)
      const robotVersion = getRobotApiVersion(robot)
      const actual = robotVersion || 'unknown'
      const expected = targetVersion || 'unknown'

      const finishAction =
        targetVersion != null &&
        robotVersion != null &&
        robotVersion === targetVersion
          ? setBuildrootSessionStep('finished')
          : unexpectedBuildrootError(
              `robot reconnected with version ${actual}, but we expected ${expected}`
            )

      return of(finishAction, finishDiscovery())
    })
  )

// if robot was renamed as part of migration, remove old robot name, balena
// robots have name opentrons-robot-name, BR robots have robot-name
// getBuildrootRobot will handle that logic, so we can compare name in state
// vs the actual robot we're interacting with
export const removeMigratedRobotsEpic: Epic = (_, state$) =>
  state$.pipe(
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
    switchMap<State, _, _>(stateWithRobotName => {
      const robotName: string = (getBuildrootRobotName(stateWithRobotName): any)
      return of(removeRobot(robotName))
    })
  )

export const disconnectRpcOnStartEpic: Epic = action$ =>
  action$.pipe(
    ofType(BR_START_UPDATE),
    switchMap<_, _, mixed>(() => of(robotActions.disconnect()))
  )

export const buildrootEpic = combineEpics(
  startUpdateEpic,
  cancelSessionOnConflictEpic,
  triggerUpdateAfterPremigrationEpic,
  triggerUpdateAfterCancelEpic,
  triggerUpdateAfterUserFileInfo,
  statusPollEpic,
  uploadFileEpic,
  commitUpdateEpic,
  restartAfterCommitEpic,
  watchForOfflineAfterRestartEpic,
  watchForOnlineAfterRestartEpic,
  removeMigratedRobotsEpic,
  disconnectRpcOnStartEpic
)
