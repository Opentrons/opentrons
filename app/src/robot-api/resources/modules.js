// @flow
// modules endpoints
import { combineEpics } from 'redux-observable'
import pathToRegexp from 'path-to-regexp'

import {
  getRobotApiState,
  createBaseRobotApiEpic,
  passRobotApiResponseAction,
  GET,
  POST,
} from '../utils'

import type { State as AppState, ActionLike } from '../../types'
import type { RobotHost, RobotApiAction } from '../types'
import type {
  Module,
  ModuleCommandRequest,
  ModulesState as State,
} from './types'

const INITIAL_STATE: State = []

export const FETCH_MODULES: 'robotApi:FETCH_MODULES' = 'robotApi:FETCH_MODULES'

export const FETCH_MODULE_DATA: 'robotApi:FETCH_MODULE_DATA' =
  'robotApi:FETCH_MODULE_DATA'

export const SET_MODULE_TARGET_TEMP: 'robotApi:SET_MODULE_TARGET_TEMP' =
  'robotApi:SET_MODULE_TARGET_TEMP'

export const MODULES_PATH = '/modules'
// TODO(mc, 2019-04-29): these endpoints should not have different paths
export const MODULE_DATA_PATH = '/modules/:serial/data'
export const MODULE_BY_SERIAL_PATH = '/modules/:serial'

const RE_MODULE_DATA_PATH = pathToRegexp(MODULE_DATA_PATH)

export const fetchModules = (host: RobotHost): RobotApiAction => ({
  type: FETCH_MODULES,
  payload: { host, method: GET, path: MODULES_PATH },
})

export const fetchModuleData = (
  host: RobotHost,
  id: string
): RobotApiAction => ({
  type: FETCH_MODULE_DATA,
  payload: { host, method: GET, path: `/modules/${id}/data` },
  meta: { id },
})

export const setTargetTemp = (
  host: RobotHost,
  id: string,
  body: ModuleCommandRequest
): RobotApiAction => ({
  type: SET_MODULE_TARGET_TEMP,
  payload: { host, body, method: POST, path: `/modules/${id}` },
  meta: { id },
})

const fetchModulesEpic = createBaseRobotApiEpic(FETCH_MODULES)
const fetchModuleDataEpic = createBaseRobotApiEpic(FETCH_MODULE_DATA)
const setTargetTempEpic = createBaseRobotApiEpic(SET_MODULE_TARGET_TEMP)

export const modulesEpic = combineEpics(
  fetchModulesEpic,
  fetchModuleDataEpic,
  setTargetTempEpic
)

export function modulesReducer(
  state: State = INITIAL_STATE,
  action: ActionLike
): State {
  const resAction = passRobotApiResponseAction(action)

  if (resAction) {
    const { payload, meta } = resAction
    const { method, path, body } = payload

    if (path === MODULES_PATH) {
      return (body.modules: Array<Module>)
    }

    if (
      method === GET &&
      RE_MODULE_DATA_PATH.test(path) &&
      typeof meta.id === 'string'
    ) {
      const { status, data } = body
      return state.map(m =>
        m.serial === meta.id ? ({ ...m, status, data }: any) : m
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
