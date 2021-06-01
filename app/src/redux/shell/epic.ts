import { combineEpics } from 'redux-observable'
import {
  map,
  mapTo,
  filter,
  pairwise,
  tap,
  ignoreElements,
} from 'rxjs/operators'

import { alertTriggered, ALERT_APP_UPDATE_AVAILABLE } from '../alerts'
import { getUpdateChannel } from '../config'
import { getAvailableShellUpdate, checkShellUpdate } from './update'
import { remote } from './remote'

import type { Epic, Action } from '../types'

const sendActionToShellEpic: Epic = action$ =>
  action$.pipe(
    filter<Action>(a => {
      return 'meta' in a && 'shell' in a.meta && Boolean(a.meta.shell)
    }),
    tap<Action>((shellAction: Action) => remote.dispatch(shellAction)),
    ignoreElements()
  )

const receiveActionFromShellEpic: Epic = () => {
  return remote.inbox
}

const appUpdateAvailableAlertEpic: Epic = (action$, state$) => {
  return state$.pipe(
    map(getAvailableShellUpdate),
    pairwise(),
    filter(([prev, next]) => prev === null && next !== null),
    mapTo(alertTriggered(ALERT_APP_UPDATE_AVAILABLE))
  )
}

const checkForUpdateAfterChannelChangeEpic: Epic = (action$, state$) => {
  return state$.pipe(
    map(getUpdateChannel),
    pairwise(),
    filter(([prev, next]) => prev !== next),
    mapTo(checkShellUpdate())
  )
}

export const shellEpic: Epic = combineEpics<Epic>(
  sendActionToShellEpic,
  receiveActionFromShellEpic,
  appUpdateAvailableAlertEpic,
  checkForUpdateAfterChannelChangeEpic
)
