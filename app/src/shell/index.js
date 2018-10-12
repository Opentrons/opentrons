// @flow
// desktop shell module
import {combineReducers} from 'redux'

import createLogger from '../logger'
import {updateReducer} from './update'
import {apiUpdateReducer} from './api-update'

import type {Service} from '@opentrons/discovery-client'
import type {Middleware, ThunkAction} from '../types'
import type {ViewableRobot} from '../discovery'
import type {Config} from '../config'
import type {ShellUpdateAction} from './update'

export type ShellAction = ShellUpdateAction

const {
  ipcRenderer,
  update: {CURRENT_VERSION, CURRENT_RELEASE_NOTES},
  config: {getConfig},
  discovery: {getRobots},
} = global.APP_SHELL

const log = createLogger(__filename)

export * from './update'
export * from './api-update'

export {CURRENT_VERSION, CURRENT_RELEASE_NOTES}

export const shellReducer = combineReducers({
  update: updateReducer,
  apiUpdate: apiUpdateReducer,
})

export const shellMiddleware: Middleware = store => {
  const {dispatch} = store

  ipcRenderer.on('dispatch', (_, action) => {
    log.debug('Received action from main via IPC', {action})
    dispatch(action)
  })

  return next => action => {
    if (action.meta && action.meta.shell) ipcRenderer.send('dispatch', action)

    return next(action)
  }
}

// getShellConfig makes a sync RPC call, so use sparingly
export function getShellConfig (): Config {
  return getConfig()
}

// getShellRobots makes a sync RPC call, so use sparingly
export function getShellRobots (): Array<Service> {
  return getRobots()
}

export function downloadLogs (robot: ViewableRobot): ThunkAction {
  return (dispatch, getState) => {
    const logPaths = robot.health && robot.health.logs

    if (logPaths) {
      const logUrls = logPaths.map(p => `http://${robot.ip}:${robot.port}${p}`)

      dispatch({
        type: 'shell:DOWNLOAD_LOGS',
        payload: {logUrls},
        meta: {shell: true},
      })
    }
  }
}
