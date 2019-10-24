// @flow
import { of } from 'rxjs'
import { filter, switchMap, delay } from 'rxjs/operators'
import { ofType, combineEpics } from 'redux-observable'

import { DISCOVERY_START, startDiscovery, finishDiscovery } from './actions'

import type { Epic } from '../types'
import type { DiscoveryAction, StartDiscoveryAction } from './types'

export const DISCOVERY_TIMEOUT_MS = 30000
export const RESTART_DISCOVERY_TIMEOUT_MS = 60000

export const startDiscoveryEpic: Epic = action$ =>
  action$.pipe(
    ofType(DISCOVERY_START),
    switchMap<StartDiscoveryAction, _, DiscoveryAction>(startAction => {
      const timeout = startAction.payload.timeout || DISCOVERY_TIMEOUT_MS
      return of(finishDiscovery()).pipe(delay(timeout))
    })
  )

// TODO(mc, 2019-08-01): handle restart requests using robot-api actions
export const startDiscoveryOnRestartEpic: Epic = action$ =>
  action$.pipe(
    filter(
      action =>
        action.type === 'api:SERVER_SUCCESS' &&
        action.payload.path === 'restart'
    ),
    switchMap<_, _, DiscoveryAction>(() =>
      of(startDiscovery(RESTART_DISCOVERY_TIMEOUT_MS))
    )
  )

export const discoveryEpic: Epic = combineEpics(
  startDiscoveryEpic,
  startDiscoveryOnRestartEpic
)
