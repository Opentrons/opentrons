import { of } from 'rxjs'
import { filter, switchMap, delay } from 'rxjs/operators'
import { ofType, combineEpics } from 'redux-observable'

import { UI_INITIALIZED } from '../shell'
import { DISCOVERY_START, startDiscovery, finishDiscovery } from './actions'

import type { Observable } from 'rxjs'
import type { Action, Epic } from '../types'
import type { UiInitializedAction } from '../shell/types'
import type { DiscoveryAction, StartDiscoveryAction } from './types'

export const DISCOVERY_TIMEOUT_MS = 30000
export const RESTART_DISCOVERY_TIMEOUT_MS = 60000

export const startDiscoveryEpic: Epic = action$ =>
  action$.pipe(
    ofType<Action, StartDiscoveryAction | UiInitializedAction>(
      DISCOVERY_START,
      UI_INITIALIZED
    ),
    switchMap<
      StartDiscoveryAction | UiInitializedAction,
      Observable<DiscoveryAction>
    >(startAction => {
      const timeout = startAction.payload
        ? startAction.payload.timeout ?? DISCOVERY_TIMEOUT_MS
        : DISCOVERY_TIMEOUT_MS

      return of(finishDiscovery()).pipe(delay(timeout))
    })
  )

// TODO(mc, 2019-08-01): handle restart requests using robot-api actions
export const startDiscoveryOnRestartEpic: Epic = action$ =>
  action$.pipe(
    filter<Action, Action>(
      (action): action is Action =>
        action.type === 'api:SERVER_SUCCESS' &&
        action.payload.path === 'restart'
    ),
    switchMap<Action, Observable<DiscoveryAction>>(() =>
      of(startDiscovery(RESTART_DISCOVERY_TIMEOUT_MS))
    )
  )

export const discoveryEpic: Epic = combineEpics<Epic>(
  startDiscoveryEpic,
  startDiscoveryOnRestartEpic
)
