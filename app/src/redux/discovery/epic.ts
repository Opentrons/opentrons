import { of } from 'rxjs'
import { switchMap, delay } from 'rxjs/operators'
import { ofType, combineEpics } from 'redux-observable'

import { UI_INITIALIZED } from '../shell'
import { DISCOVERY_START, finishDiscovery } from './actions'

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
      // @ts-expect-error TODO: use in operator to protect against accessing timeout when it doesn't exist
      const timeout = startAction.payload
        ? // @ts-expect-error TODO: use in operator to protect against accessing timeout when it doesn't exist
          startAction.payload.timeout ?? DISCOVERY_TIMEOUT_MS
        : DISCOVERY_TIMEOUT_MS

      return of(finishDiscovery()).pipe(delay(timeout))
    })
  )

export const discoveryEpic: Epic = combineEpics<Epic>(startDiscoveryEpic)
