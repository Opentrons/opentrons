// @flow
// modules endpoints
import { combineEpics, ofType } from 'redux-observable'
import pathToRegexp from 'path-to-regexp'
import { of } from 'rxjs'

import { switchMap, withLatestFrom, filter } from 'rxjs/operators'

import {
  getRobotApiState,
  createBaseRobotApiEpic,
  passRobotApiResponseAction,
  GET,
  POST,
} from '../utils'

import { getConnectedRobot } from '../../discovery'
import { selectors as robotSelectors } from '../../robot'

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

export const SEND_MODULE_COMMAND: 'robotApi:SEND_MODULE_COMMAND' =
  'robotApi:SEND_MODULE_COMMAND'

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

export const sendModuleCommand = (
  host: RobotHost,
  id: string,
  body: ModuleCommandRequest
): RobotApiAction => ({
  type: SEND_MODULE_COMMAND,
  payload: { host, body, method: POST, path: `/modules/${id}` },
  meta: { id },
})

const fetchModulesEpic = createBaseRobotApiEpic(FETCH_MODULES)
const fetchModuleDataEpic = createBaseRobotApiEpic(FETCH_MODULE_DATA)
const sendModuleCommandEpic = createBaseRobotApiEpic(SEND_MODULE_COMMAND)

const eagerlyLoadModulesEpic: Epic = (action$, state$) =>
  action$.pipe(
    ofType('robot:CONNECT_RESPONSE'),
    filter(action => !action.payload?.error),
    withLatestFrom(state$),
    switchMap<[ConnectResponseAction, State], _, mixed>(([action, state]) => {
      return of(fetchModules(getConnectedRobot(state)))
    })
  )

export const modulesEpic = combineEpics(
  fetchModulesEpic,
  fetchModuleDataEpic,
  sendModuleCommandEpic,
  eagerlyLoadModulesEpic
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

const PREPARABLE_MODULES = ['thermocycler']

export const getUnpreparedModules = (state: AppState): Array<Module> => {
  const robot = getConnectedRobot(state)
  if (!robot) return []

  const sessionModules = robotSelectors.getModules(state)
  const actualModules = getModulesState(state, robot.name) || []

  const preparableModules = sessionModules.reduce(
    (acc, mod) =>
      PREPARABLE_MODULES.includes(mod.name) ? [...acc, mod.name] : acc,
    []
  )
  if (preparableModules.length > 0) {
    const actualPreparableModules = actualModules.filter(mod =>
      preparableModules.includes(mod.name)
    )
    return actualPreparableModules.reduce((acc, mod) => {
      if (mod.name === 'thermocycler' && mod.data.lid !== 'open') {
        return [...acc, mod]
      }
      return acc
    }, [])
  } else {
    return []
  }
}
