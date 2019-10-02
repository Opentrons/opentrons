// @flow
// desktop shell module
import { combineReducers } from 'redux'
import { combineEpics } from 'redux-observable'
import { fromEvent } from 'rxjs'
import { filter, tap, ignoreElements } from 'rxjs/operators'

import createLogger from '../logger'
import remote from './remote'
import { updateReducer } from './update'
import { buildrootReducer, buildrootUpdateEpic } from './buildroot'
import { robotLogsReducer } from './robot-logs/reducer'

import type { Reducer } from 'redux'
import type { LooseEpic, Action, ActionLike } from '../types'
import type { ShellState } from './types'

const { ipcRenderer, CURRENT_VERSION, CURRENT_RELEASE_NOTES } = remote

const log = createLogger(__filename)

export * from './update'
export * from './buildroot'
export * from './types'

export { CURRENT_VERSION, CURRENT_RELEASE_NOTES }

export const shellReducer: Reducer<ShellState, Action> = combineReducers<
  _,
  Action
>({
  update: updateReducer,
  buildroot: buildrootReducer,
  robotLogs: robotLogsReducer,
})

export const sendActionToShellEpic: LooseEpic = action$ =>
  action$.pipe(
    filter<ActionLike>((action: ActionLike) => action.meta?.shell === true),
    tap<ActionLike>((shellAction: ActionLike) =>
      ipcRenderer.send('dispatch', shellAction)
    ),
    ignoreElements()
  )

export const receiveActionFromShellEpic = () =>
  // IPC event listener: (IpcRendererEvent, ...args) => void
  // our action is the only argument, so pluck it out from index 1
  fromEvent<ActionLike>(
    ipcRenderer,
    'dispatch',
    (_: mixed, incoming: ActionLike) => incoming
  ).pipe<ActionLike>(
    tap(incoming => {
      log.debug('Received action from main via IPC', {
        actionType: incoming.type,
      })
    })
  )

export const shellEpic = combineEpics(
  sendActionToShellEpic,
  receiveActionFromShellEpic,
  buildrootUpdateEpic
)
