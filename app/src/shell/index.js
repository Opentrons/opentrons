// @flow
// desktop shell module
import {remote, ipcRenderer} from 'electron'
import {createSelector, type Selector} from 'reselect'
import createLogger from '../logger'
import {makeGetRobotHealth} from '../http-api-client'
import type {State, Action, Middleware, ThunkPromiseAction, ThunkAction, Error} from '../types'
import type {RobotService} from '../robot'
import type {Config} from '../config'
import type {DiscoveredRobot} from '../discovery'

const {
  CURRENT_VERSION,
  checkForUpdates,
  downloadUpdate,
  quitAndInstall,
} = remote.require('./update')

const {
  getConfig,
} = remote.require('./config')

const {
  getRobots,
} = remote.require('./discovery')

const log = createLogger(__filename)

// TODO(mc, 2018-03-29): update sub reducer
type ShellState = {
  update: {
    checkInProgress: boolean,
    downloadInProgress: boolean,
    available: ?string,
    downloaded: boolean,
    error: ?Error,
    seen: boolean,
  },
}

const INITIAL_STATE: ShellState = {
  update: {
    checkInProgress: false,
    downloadInProgress: false,
    available: null,
    downloaded: false,
    error: null,
    seen: false,
  },
}

type StartUpdateCheckAction = {|
  type: 'shell:START_UPDATE_CHECK',
|}

type FinishUpdateCheckAction = {|
  type: 'shell:FINISH_UPDATE_CHECK',
  payload: {|
    available: ?string,
    error: ?Error,
  |},
|}

type StartDownloadAction = {|
  type: 'shell:START_DOWNLOAD',
|}

type SeenUpdateAction = {|
  type: 'shell:SET_UPDATE_SEEN',
|}

type FinishDownloadAction = {|
  type: 'shell:FINISH_DOWNLOAD',
  payload: {|
    error: ?Error,
  |},
|}

export type ShellAction =
  | StartUpdateCheckAction
  | FinishUpdateCheckAction
  | StartDownloadAction
  | FinishDownloadAction
  | SeenUpdateAction

export function checkForShellUpdates (): ThunkPromiseAction {
  return (dispatch) => {
    dispatch({type: 'shell:START_UPDATE_CHECK'})

    return checkForUpdates()
      .then((info: {updateAvailable: boolean, version: string}) => ({
        available: info.updateAvailable ? info.version : null,
        error: null,
      }))
      .catch((error: Error) => ({error}))
      .then((payload) => dispatch({
        type: 'shell:FINISH_UPDATE_CHECK',
        payload,
      }))
  }
}

export function setUpdateSeen (): ShellAction {
  return {type: 'shell:SET_UPDATE_SEEN'}
}

export function downloadShellUpdate (): ThunkPromiseAction {
  // TODO(mc, 2018-03-29): verify that update is available via state first
  return (dispatch) => {
    dispatch({type: 'shell:START_DOWNLOAD'})

    return downloadUpdate()
      .then(() => ({error: null}))
      .catch((error: Error) => ({error}))
      .then((payload) => dispatch({type: 'shell:FINISH_DOWNLOAD', payload}))
  }
}

export function quitAndInstallShellUpdate () {
  quitAndInstall()
}

export function shellReducer (
  state: ?ShellState,
  action: Action
): ShellState {
  if (!state) return INITIAL_STATE

  switch (action.type) {
    case 'shell:START_UPDATE_CHECK':
      return {...state, update: {...state.update, checkInProgress: true}}

    case 'shell:FINISH_UPDATE_CHECK':
      return {
        ...state,
        update: {...state.update, ...action.payload, checkInProgress: false}}

    case 'shell:START_DOWNLOAD':
      return {...state, update: {...state.update, downloadInProgress: true, seen: true}}

    case 'shell:SET_UPDATE_SEEN':
      return {...state, update: {...state.update, seen: true}}

    case 'shell:FINISH_DOWNLOAD':
      return {
        ...state,
        update: {
          ...state.update,
          ...action.payload,
          downloadInProgress: false,
          downloaded: !action.payload.error,
        },
      }
  }

  return state
}

export const shellMiddleware: Middleware = (store) => {
  const {dispatch} = store

  ipcRenderer.on('dispatch', (_, action) => {
    log.debug('Received action from main via IPC', {action})
    dispatch(action)
  })

  return (next) => (action) => {
    if (action.meta && action.meta.shell) ipcRenderer.send('dispatch', action)

    return next(action)
  }
}

export type ShellUpdate = $PropertyType<ShellState, 'update'> & {
  current: string,
}

export const getShellUpdate: Selector<State, void, ShellUpdate> =
  createSelector(
    selectShellUpdateState,
    (updateState) => ({...updateState, current: CURRENT_VERSION})
  )

// getShellConfig makes a sync RPC call, so use sparingly
export function getShellConfig (): Config {
  return getConfig()
}

// getShellRobots makes a sync RPC call, so use sparingly
export function getShellRobots (): Array<DiscoveredRobot> {
  return getRobots()
}

function selectShellUpdateState (state: State) {
  return state.shell.update
}

export function downloadLogs (robot: RobotService): ThunkAction {
  return (dispatch, getState) => {
    const health = makeGetRobotHealth()(getState(), robot)
    const logPaths = health && health.response && health.response.logs
    if (logPaths) {
      const logUrls = logPaths.map((p) => `http://${robot.ip}:${robot.port}${p}`)
      dispatch({type: 'shell:DOWNLOAD_LOGS', payload: {logUrls}, meta: {shell: true}})
    }
  }
}
