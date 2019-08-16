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

import type { Reducer } from 'redux'

import type {
  LooseEpic,
  ThunkAction,
  Action,
  ActionLike,
  Dispatch,
  GetState,
} from '../types'

import type { ViewableRobot } from '../discovery'
import type { ShellState } from './types'

const { ipcRenderer } = remote

const log = createLogger(__filename)

export * from './update'
export * from './buildroot'
export * from './types'

const CURRENT_VERSION: string = remote.CURRENT_VERSION
const CURRENT_RELEASE_NOTES: string = remote.CURRENT_RELEASE_NOTES
const API_RELEASE_NOTES = CURRENT_RELEASE_NOTES.replace(
  /<!-- start:@opentrons\/app -->([\S\s]*?)<!-- end:@opentrons\/app -->/,
  ''
)

export { CURRENT_VERSION, CURRENT_RELEASE_NOTES, API_RELEASE_NOTES }

export const shellReducer: Reducer<ShellState, Action> = combineReducers<
  _,
  Action
>({
  update: updateReducer,
  buildroot: buildrootReducer,
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

export function downloadLogs(robot: ViewableRobot): ThunkAction {
  return (dispatch: Dispatch, getState: GetState) => {
    const logPaths = robot.health && robot.health.logs

    if (logPaths) {
      const logUrls = logPaths.map(p => `http://${robot.ip}:${robot.port}${p}`)

      dispatch({
        type: 'shell:DOWNLOAD_LOGS',
        payload: { logUrls },
        meta: { shell: true },
      })
    }
  }
}
