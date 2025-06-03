import { combineEpics } from 'redux-observable'
import { fromEvent } from 'rxjs'
import {
  filter,
  ignoreElements,
  map,
  mapTo,
  pairwise,
  tap,
} from 'rxjs/operators'

import { createLogger } from '../../logger'
import { ALERT_APP_UPDATE_AVAILABLE, alertTriggered } from '../alerts'
import { getUpdateChannel } from '../config'
import { remote } from './remote'
import { checkShellUpdate, getAvailableShellUpdate } from './update'

import type { OperatorFunction } from 'rxjs'
import type { Action, Epic } from '../types'

const { ipcRenderer } = remote

const log = createLogger(new URL('', import.meta.url).pathname)

const sendActionToShellEpic: Epic = action$ =>
  action$.pipe(
    // @ts-expect-error protect against absent meta key on action
    filter<Action>(a => a.meta?.shell != null && a.meta.shell),
    tap<Action>((shellAction: Action) => {
      ipcRenderer.send('dispatch', shellAction)
    }),
    ignoreElements() as OperatorFunction<Action, never>
  )

const receiveActionFromShellEpic: Epic = () =>
  // IPC event listener: (IpcRendererEvent, ...args) => void
  // our action is the only argument, so pluck it out from index 1
  fromEvent<Action>(
    // @ts-expect-error TODO: fromEvent type expects ArrayLike though ipcRenderer doesn't match that type, don't use fromEvent it's deprecated
    ipcRenderer,
    'dispatch',
    (_: unknown, incoming: Action) => incoming
  ).pipe<Action>(
    tap(incoming => {
      log.debug('Received action from main via IPC', {
        actionType: incoming.type,
      })
    })
  )

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
