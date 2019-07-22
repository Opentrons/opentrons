// @flow
// epics to control the buildroot migration / update flow
import every from 'lodash/every'
import { combineEpics, ofType } from 'redux-observable'
import { of, interval } from 'rxjs'
import {
  filter,
  switchMap,
  mergeMap,
  takeUntil,
  withLatestFrom,
} from 'rxjs/operators'

import {
  makeRobotApiRequest,
  passRobotApiResponseAction,
  passRobotApiErrorAction,
} from '../../robot-api'

import {
  getBuildrootSession,
  getBuildrootRobotName,
  getBuildrootRobot,
} from './selectors'

import {
  BR_START_UPDATE,
  startBuildrootUpdate,
  startBuildrootPremigration,
  uploadBuildrootFile,
  unexpectedBuildrootError,
} from './actions'

import type { State, Epic, LooseEpic } from '../../types'
import type { ViewableRobot } from '../../discovery'
import type { RobotApiResponseAction } from '../../robot-api'

import type {
  BuildrootAction,
  StartBuildrootUpdateAction,
  BuildrootUpdateSession,
} from './types'

export const UPDATE_STATUS_POLL_INTERVAL_MS = 2000

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
        const host = getBuildrootRobot(state)
        const serverHealth = host?.serverHealth || null

        // we need the target robot's update server to be up to do anything
        if (host !== null && serverHealth !== null) {
          const capabilities = serverHealth.capabilities || null

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
        }

        return of(unexpectedBuildrootError())
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
    switchMap<RobotApiResponseAction, _, mixed>(action => {
      // filter ensures pathPrefix exists here
      const pathPrefix: string = (action.meta.buildrootPrefix: any)
      const { host } = action.payload
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
    switchMap<RobotApiResponseAction, _, mixed>(action => {
      const { host } = action.payload
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
        session?.triggerUpdate === true &&
        robot.serverHealth?.capabilities != null
      )
    }),
    switchMap<State, _, BuildrootAction>(state => {
      // filter ensures robotName exists here
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
    mergeMap<RobotApiResponseAction, _, mixed>(action => {
      // filter above ensures pathPrefix exists here
      const pathPrefix: string = (action.meta.buildrootPrefix: any)
      const token: string = action.payload.body.token
      const { host } = action.payload
      const path = `${pathPrefix}/${token}/status`
      const request = { method: 'GET', host, path }
      const meta = { buildrootStatus: true }

      return interval(UPDATE_STATUS_POLL_INTERVAL_MS).pipe(
        switchMap(() => makeRobotApiRequest(request, meta)),
        takeUntil(
          state$.pipe(
            filter<State, _>(state => {
              const session = getBuildrootSession(state)
              return (
                session?.stage === 'ready-for-restart' ||
                session?.error === true
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
    typeof session?.pathPrefix === 'string' &&
    typeof session?.token === 'string' &&
    every(props, (value, key) => session?.[key] === value)
  )
}

// TODO(mc, 2019-07-19): epic to listen for /status success and:
//   2. Trigger commit if ready to commit and update not yet committed
//   3. Trigger restart if ready for restart and not yet restarted
export const uploadFileEpic: Epic = (_, state$) =>
  state$.pipe(
    filter(passActiveSession({ stage: 'awaiting-file', uploadStarted: false })),
    switchMap<State, _, BuildrootAction>(state => {
      const host: ViewableRobot = (getBuildrootRobot(state): any)
      const session = getBuildrootSession(state)
      const pathPrefix: string = (session?.pathPrefix: any)
      const token: string = (session?.token: any)

      return of(uploadBuildrootFile(host, `${pathPrefix}/${token}/file`))
    })
  )

export const commitUpdateEpic: Epic = (_, state$) =>
  state$.pipe(
    filter(passActiveSession({ stage: 'done', committed: false })),
    switchMap<State, _, BuildrootAction>(state => {
      const host: ViewableRobot = (getBuildrootRobot(state): any)
      const session = getBuildrootSession(state)
      const pathPrefix: string = (session?.pathPrefix: any)
      const token: string = (session?.token: any)
      const path = `${pathPrefix}/${token}/commit`
      const request = { method: 'POST', host, path }
      const meta = { buildrootCommit: true }

      return makeRobotApiRequest(request, meta)
    })
  )

export const restartAfterCommitEpic: Epic = (_, state$) =>
  state$.pipe(
    filter(passActiveSession({ stage: 'ready-for-restart', restarted: false })),
    switchMap<State, _, BuildrootAction>(state => {
      const host: ViewableRobot = (getBuildrootRobot(state): any)
      const path = host.serverHealth?.capabilities?.restart || '/server/restart'
      const request = { method: 'POST', host, path }
      const meta = { buildrootRestart: true }

      return makeRobotApiRequest(request, meta)
    })
  )

export const buildrootUpdateEpic = combineEpics(
  startUpdateEpic,
  cancelSessionOnConflictEpic,
  triggerUpdateAfterPremigrationEpic,
  triggerUpdateAfterCancelEpic,
  statusPollEpic,
  uploadFileEpic,
  commitUpdateEpic,
  restartAfterCommitEpic
)
