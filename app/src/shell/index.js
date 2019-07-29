// @flow
// desktop shell module
import { combineReducers } from 'redux'

import createLogger from '../logger'
import remote from './remote'
import { updateReducer } from './update'
import { apiUpdateReducer } from './api-update'
import { buildrootReducer } from './buildroot'

import type { Reducer } from 'redux'
import type { Service } from '@opentrons/discovery-client'
import type {
  Middleware,
  ThunkAction,
  Action,
  Dispatch,
  GetState,
} from '../types'
import type { ViewableRobot } from '../discovery'
import type { Config } from '../config'
import type { ApiUpdateInfo as ApiUpdateState } from './api-update'
import type { ShellUpdateState, ShellUpdateAction } from './update'
import type { BuildrootState, BuildrootAction } from './buildroot'

type ShellLogsDownloadAction = {|
  type: 'shell:DOWNLOAD_LOGS',
  payload: {| logUrls: Array<string> |},
  meta: {| shell: true |},
|}

export type ShellState = {|
  update: ShellUpdateState,
  apiUpdate: ApiUpdateState,
  buildroot: BuildrootState,
|}

export type ShellAction =
  | ShellUpdateAction
  | ShellLogsDownloadAction
  | BuildrootAction

const {
  ipcRenderer,
  config: { getConfig },
  discovery: { getRobots },
} = remote

const log = createLogger(__filename)

export * from './update'
export * from './api-update'
export * from './buildroot'

const CURRENT_VERSION: string = remote.update.CURRENT_VERSION
const CURRENT_RELEASE_NOTES: string = remote.update.CURRENT_RELEASE_NOTES
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
  apiUpdate: apiUpdateReducer,
  buildroot: buildrootReducer,
})

export const shellMiddleware: Middleware = store => {
  const { dispatch } = store

  ipcRenderer.on('dispatch', (_, action) => {
    log.debug('Received action from main via IPC', { action })
    dispatch(action)
  })

  return next => action => {
    if (action.meta && action.meta.shell) ipcRenderer.send('dispatch', action)

    return next(action)
  }
}

// getShellConfig makes a sync RPC call, so use sparingly
export function getShellConfig(): Config {
  return getConfig()
}

// getShellRobots makes a sync RPC call, so use sparingly
export function getShellRobots(): Array<Service> {
  return getRobots()
}

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
