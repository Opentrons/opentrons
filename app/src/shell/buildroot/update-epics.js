// @flow
// epics to control the buildroot migration / update flow
import { combineEpics, ofType } from 'redux-observable'
import { of } from 'rxjs'
import { filter, switchMap, withLatestFrom } from 'rxjs/operators'

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
  unexpectedBuildrootError,
} from './actions'

import type { State, Epic, LooseEpic } from '../../types'
import type { RobotApiResponseAction } from '../../robot-api'
import type { BuildrootAction, StartBuildrootUpdateAction } from './types'

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

// TODO(mc, 2019-07-19): epic to listen for /begin success and start /status poll

// TODO(mc, 2019-07-19): epic to listen for /status success and:
//   1. Trigger file upload if ready for file and file upload not yet started
//   2. Trigger commit if ready to commit and update not yet committed
//   3. Trigger restart if ready for restart and not yet restarted

export const buildrootUpdateEpic = combineEpics(
  startUpdateEpic,
  cancelSessionOnConflictEpic,
  triggerUpdateAfterPremigrationEpic,
  triggerUpdateAfterCancelEpic
)
