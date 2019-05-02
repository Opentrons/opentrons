// @flow
// modules endpoints
import { of as observableOf } from 'rxjs'
import { switchMap } from 'rxjs/operators'
import { combineEpics } from 'redux-observable'
import pathToRegexp from 'path-to-regexp'

import {
  getRobotApiState,
  createBaseRequestEpic,
  passResponseAction,
  GET,
  POST,
} from '../utils'

import type { State as AppState, ActionLike, Epic } from '../../types'
import type {
  RobotHost,
  ApiAction,
  ApiActionLike,
  Module,
  SetTemperatureRequest,
  ModulesState as State,
} from '../types'

const INITIAL_STATE: State = []

export const FETCH_MODULES: 'robotHttp:FETCH_MODULES' =
  'robotHttp:FETCH_MODULES'
export const FETCH_MODULE_DATA: 'robotHttp:FETCH_MODULE_DATA' =
  'robotHttp:FETCH_MODULE_DATA'
export const SET_MODULE_TARGET_TEMP: 'robotHttp:SET_MODULE_TARGET_TEMP' =
  'robotHttp:SET_MODULE_TARGET_TEMP'

export const MODULES_PATH = '/modules'
// TODO(mc, 2019-04-29): these endpoints should not have different paths
export const MODULE_DATA_PATH = '/modules/:serial/data'
export const MODULE_BY_SERIAL_PATH = '/modules/:serial'

const RE_MODULE_DATA_PATH = pathToRegexp(MODULE_DATA_PATH)
const RE_MODULE_BY_SERIAL_PATH = pathToRegexp(MODULE_BY_SERIAL_PATH)

export const fetchModules = (host: RobotHost): ApiAction => ({
  type: FETCH_MODULES,
  payload: { host, method: GET, path: MODULES_PATH },
})

export const fetchModuleData = (
  host: RobotHost,
  serial: string
): ApiAction => ({
  type: FETCH_MODULE_DATA,
  payload: { host, method: GET, path: `/modules/${serial}/data` },
})

export const setTargetTemp = (
  host: RobotHost,
  serial: string,
  body: SetTemperatureRequest
): ApiAction => ({
  type: SET_MODULE_TARGET_TEMP,
  payload: { host, body, method: POST, path: `/modules/${serial}` },
})

const fetchModulesEpic = createBaseRequestEpic(FETCH_MODULES)
const fetchModuleDataEpic = createBaseRequestEpic(FETCH_MODULE_DATA)

const setTargetTempEpic: Epic = action$ => {
  const baseEpic = createBaseRequestEpic(SET_MODULE_TARGET_TEMP)

  return baseEpic(action$).pipe(
    switchMap<ApiActionLike, _, ApiActionLike>(action => {
      const response = passResponseAction(action)
      if (response) {
        const { host, path } = response.payload
        const serialMatch = path.match(RE_MODULE_BY_SERIAL_PATH)

        // if POST /modules/:serial completes, call GET /modules/:serial/data
        if (serialMatch) {
          const refresh = fetchModuleData(host, serialMatch[1])
          return observableOf(action, ((refresh: any): ApiActionLike))
        }
      }

      return observableOf(action)
    })
  )
}

export const modulesEpic = combineEpics(
  fetchModulesEpic,
  fetchModuleDataEpic,
  setTargetTempEpic
)

export function modulesReducer(
  state: State = INITIAL_STATE,
  action: ActionLike
): State {
  const response = passResponseAction(action)

  if (response) {
    const { path, body } = response.payload

    if (path === MODULES_PATH) {
      return (body.modules: Array<Module>)
    }

    const dataPathMatch = path.match(RE_MODULE_DATA_PATH)

    if (dataPathMatch) {
      const serial = dataPathMatch[1]
      const { status, data } = body

      return state.map(m =>
        m.serial === serial ? ({ ...m, status, data }: any) : m
      )
    }
  }

  return state
}

export function getModulesState(
  state: AppState,
  robotName: string
): Array<Module> {
  const robotState = getRobotApiState(state, robotName)
  const modules = robotState?.resources.modules || []
  const tcEnabled = Boolean(state.config.devInternal?.enableThermocycler)

  // TODO: remove this filter when feature flag removed
  return modules.filter(m => tcEnabled || m.name !== 'thermocycler')
}
