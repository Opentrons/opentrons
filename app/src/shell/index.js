// @flow
// desktop shell module
import {remote, ipcRenderer} from 'electron'
import {combineReducers} from 'redux'

import createLogger from '../logger'
import {makeGetRobotHealth} from '../http-api-client'
import {updateReducer} from './update'
import {apiUpdateReducer} from './api-update'

import type {Middleware, ThunkAction} from '../types'
import type {RobotService} from '../robot'
import type {Config} from '../config'
import type {DiscoveredRobot} from '../discovery'
import type {ShellUpdateAction} from './update'

export type ShellAction = ShellUpdateAction

const {CURRENT_VERSION, CURRENT_RELEASE_NOTES} = remote.require('./update')
const {getConfig} = remote.require('./config')
const {getRobots} = remote.require('./discovery')

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
export function getShellRobots (): Array<DiscoveredRobot> {
  return getRobots()
}

export function downloadLogs (robot: RobotService): ThunkAction {
  return (dispatch, getState) => {
    const health = makeGetRobotHealth()(getState(), robot)
    const logPaths = health && health.response && health.response.logs
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
