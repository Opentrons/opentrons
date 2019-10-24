// @flow
import { of } from 'rxjs'
import { ofType, combineEpics } from 'redux-observable'
import { filter, switchMap, withLatestFrom } from 'rxjs/operators'

import {
  makeRobotApiRequest,
  passRobotApiResponseAction,
} from '../robot-api/utils'
import { startDiscovery } from '../discovery'
import { getRobotRestartPath } from '../robot-settings'
import { RESTART, RESTART_PATH } from './constants'

import type { State, Epic, LooseEpic } from '../types'
import type { RobotApiResponseAction } from '../robot-api/types'
import type { RobotAdminAction } from './types'

export const RESTART_DISCOVERY_TIMEOUT_MS = 60000

const robotAdminApiEpic: Epic = (action$, state$) => {
  return action$.pipe(
    ofType(RESTART),
    withLatestFrom(state$),
    switchMap<[RobotAdminAction, State], _, _>(([action, state]) => {
      const { name: robotName } = action.payload.host
      const restartPath = getRobotRestartPath(state, robotName)
      const payload =
        restartPath !== null
          ? { ...action.payload, path: restartPath }
          : action.payload

      return makeRobotApiRequest(payload, {})
    })
  )
}

const startDiscoveryOnRestartEpic: LooseEpic = action$ => {
  return action$.pipe(
    filter(a => {
      const response = passRobotApiResponseAction(a)
      return Boolean(response && response.payload.path === RESTART_PATH)
    }),
    switchMap<RobotApiResponseAction, _, mixed>(() =>
      of(startDiscovery(RESTART_DISCOVERY_TIMEOUT_MS))
    )
  )
}

export const robotAdminEpic: Epic = combineEpics(
  robotAdminApiEpic,
  startDiscoveryOnRestartEpic
)
