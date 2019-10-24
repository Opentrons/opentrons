// @flow
import { of } from 'rxjs'
import { ofType, combineEpics } from 'redux-observable'
import { filter, switchMap } from 'rxjs/operators'

import {
  makeRobotApiRequest,
  passRobotApiResponseAction,
} from '../robot-api/utils'
import { startDiscovery } from '../discovery/actions'
import { RESTART, RESTART_PATH } from './constants'

import type { Epic, LooseEpic } from '../types'
import type { RequestMeta, RobotApiResponseAction } from '../robot-api/types'
import type { RobotAdminAction } from './types'

export const RESTART_DISCOVERY_TIMEOUT_MS = 60000

const robotAdminApiEpic: Epic = action$ => {
  return action$.pipe(
    ofType(RESTART),
    switchMap<RobotAdminAction, _, _>(a => {
      const meta: RequestMeta = {}
      return makeRobotApiRequest(a.payload, meta)
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
