// @flow
import { combineEpics } from 'redux-observable'
import { fromEvent } from 'rxjs'
import { filter, tap, ignoreElements } from 'rxjs/operators'

import { createLogger } from '../logger'
import { remote } from './remote'

import type { StrictEpic, Action } from '../types'

const { ipcRenderer } = remote

const log = createLogger(__filename)

const sendActionToShellEpic: StrictEpic<> = action$ =>
  action$.pipe(
    filter<Action>(a => a.meta != null && a.meta.shell != null && a.meta.shell),
    tap<Action>((shellAction: Action) =>
      ipcRenderer.send('dispatch', shellAction)
    ),
    ignoreElements()
  )

const receiveActionFromShellEpic: StrictEpic<> = () =>
  // IPC event listener: (IpcRendererEvent, ...args) => void
  // our action is the only argument, so pluck it out from index 1
  fromEvent<Action>(
    ipcRenderer,
    'dispatch',
    (_: mixed, incoming: Action) => incoming
  ).pipe<Action>(
    tap(incoming => {
      log.debug('Received action from main via IPC', {
        actionType: incoming.type,
      })
    })
  )

export const shellEpic: StrictEpic<> = combineEpics(
  sendActionToShellEpic,
  receiveActionFromShellEpic
)
