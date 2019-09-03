// @flow
// modules endpoints
import { combineEpics, ofType } from 'redux-observable'
import pathToRegexp from 'path-to-regexp'
import { of } from 'rxjs'
import countBy from 'lodash/countBy'

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
import type { ConnectResponseAction } from '../../robot/actions'
import type { SessionModule } from '../../robot/types'

import type { State as AppState, ActionLike, Epic } from '../../types'
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
    switchMap<[ConnectResponseAction, AppState], _, mixed>(
      ([action, state]) => {
        const robotHost = getConnectedRobot(state)
        return robotHost ? of(fetchModules(robotHost)) : of(null)
      }
    ),
    filter(Boolean)
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

const PREPARABLE_MODULES = ['thermocycler']

export function getModulesState(
  state: AppState,
  robotName: string
): Array<Module> {
  const robotState = getRobotApiState(state, robotName)

  return robotState?.resources.modules || []
}

export function getUnpreparedModules(state: AppState): Array<Module> {
  const robot = getConnectedRobot(state)
  const sessionModules = robotSelectors.getModules(state)
  const actualModules = robot ? getModulesState(state, robot.name) : []
  const preparableSessionModules = sessionModules
    .map(m => m.name)
    .filter(name => PREPARABLE_MODULES.includes(name))

  return actualModules.filter(
    m =>
      preparableSessionModules.includes(m.name) &&
      (m.name !== 'thermocycler' || m.data.lid !== 'open')
  )
}

export function getMissingModules(state: AppState): Array<SessionModule> {
  const robot = getConnectedRobot(state)
  const sessionModules = robotSelectors.getModules(state)
  const actualModules = robot ? getModulesState(state, robot.name) : []
  const requiredCountMap: { [string]: number } = countBy(sessionModules, 'name')
  const actualCountMap: { [string]: number } = countBy(actualModules, 'name')

  return sessionModules.filter(
    m => requiredCountMap[m.name] > (actualCountMap[m.name] || 0)
  )
}
