// @flow
// modules endpoints
import { of } from 'rxjs'
import { filter, switchMap } from 'rxjs/operators'
import { combineEpics } from 'redux-observable'
import pathToRegexp from 'path-to-regexp'

import {
  getRobotApiState,
  createBaseRequestEpic,
  apiCall,
  GET,
  POST,
  API_RESPONSE,
} from '../utils'

import type { State as AppState, Action, Epic } from '../../types'
import type {
  RobotHost,
  ApiAction,
  ApiResponseAction,
  Module,
  SetTemperatureRequest,
  ModulesState as State,
} from '../types'

const INITIAL_STATE: State = []

export const MODULES_PATH = '/modules'
// TODO(mc, 2019-04-29): these endpoints should not have different paths
export const MODULE_DATA_PATH = '/modules/:serial/data'
export const MODULE_BY_SERIAL_PATH = '/modules/:serial'

const RE_MODULE_DATA_PATH = pathToRegexp(MODULE_DATA_PATH)
const RE_MODULE_BY_SERIAL_PATH = pathToRegexp(MODULE_BY_SERIAL_PATH)

export const fetchModules = (host: RobotHost) =>
  apiCall({ method: GET, path: MODULES_PATH, host })

export const fetchModuleData = (host: RobotHost, serial: string) =>
  apiCall({ method: GET, path: `/modules/${serial}/data`, host })

export const setTargetTemp = (
  host: RobotHost,
  serial: string,
  body: SetTemperatureRequest
) => apiCall({ method: POST, path: `/modules/${serial}`, host, body })

const fetchModulesEpic = createBaseRequestEpic('GET', MODULES_PATH)
const fetchModuleDataEpic = createBaseRequestEpic('GET', MODULE_DATA_PATH)

// after POST /modules/:serial completes, call GET /modules/:serial/data
const _setTargetTempEpic = createBaseRequestEpic('POST', MODULE_BY_SERIAL_PATH)

const setTargetTempEpic: Epic = action$ => {
  return _setTargetTempEpic(action$).pipe(
    filter<Action, ApiResponseAction>(a => a.type === API_RESPONSE),
    switchMap<ApiResponseAction, _, ApiAction>(action => {
      const { host, path } = action.payload
      const results: Array<ApiAction> = [action]
      const serialMatch = path.match(RE_MODULE_BY_SERIAL_PATH)
      if (serialMatch) results.push(fetchModuleData(host, serialMatch[1]))

      return of(...results)
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
  action: ApiAction
): State {
  if (action.type === API_RESPONSE) {
    const { path, body } = action.payload

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
