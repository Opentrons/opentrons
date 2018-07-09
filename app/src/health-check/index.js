// @flow
// health check module for keeping tabs on connected robots
import {createSelector} from 'reselect'

import type {Middleware, State, Action} from '../types'
import type {BaseRobot, RobotService} from '../robot'

// TODO(mc, 2018-02-26): figure out this circular dependency
import {
  getDiscoveredByName,
  getConnectRequest,
  getConnectedRobotName
} from '../robot/selectors'

import {fetchHealth} from '../http-api-client'

// since middleware triggers before actions are reduced, health check failure
// is triggered after CHECK_THRESHOLD + 1 missed polls
const CHECK_INTERVAL_MS = 3000
const CHECK_THRESHOLD = 2

const INITIAL_STATE_BY_NAME = {id: null, missed: 0}

export type StartHealthCheckAction = {|
  type: 'api:START_HEALTH_CHECK',
  payload: {|
    robot: RobotService,
  |}
|}

export type StopHealthCheckAction = {|
  type: 'api:STOP_HEALTH_CHECK',
  payload: {|
    robot: BaseRobot,
  |}
|}

export type SetHealthCheckIdAction = {|
  type: 'api:SET_HEALTH_CHECK_ID',
  payload: {|
    robot: BaseRobot,
    id: IntervalID,
  |},
|}

export type ClearHealthCheckIdAction = {|
  type: 'api:CLEAR_HEALTH_CHECK_ID',
  payload: {|
    robot: BaseRobot,
  |},
|}

export type ResetHealthCheckAction = {|
  type: 'api:RESET_HEALTH_CHECK',
  payload: {|
    robot: BaseRobot
  |}
|}

type RobotHealthCheck = {
  missed: number,
  id: ?IntervalID,
}

type HealthCheckState = {
  [robotName: string]: ?RobotHealthCheck
}

export type HealthCheckAction =
  | StartHealthCheckAction
  | StopHealthCheckAction
  | ResetHealthCheckAction
  | SetHealthCheckIdAction
  | ClearHealthCheckIdAction

export function startHealthCheck (robot: RobotService): StartHealthCheckAction {
  return {
    type: 'api:START_HEALTH_CHECK',
    payload: {robot}
  }
}

export function stopHealthCheck (robot: BaseRobot): StopHealthCheckAction {
  return {
    type: 'api:STOP_HEALTH_CHECK',
    payload: {robot}
  }
}

export function setHealthCheckId (
  robot: BaseRobot,
  id: IntervalID
): SetHealthCheckIdAction {
  return {type: 'api:SET_HEALTH_CHECK_ID', payload: {robot, id}}
}

export function clearHealthCheckId (
  robot: BaseRobot
): ClearHealthCheckIdAction {
  return {type: 'api:CLEAR_HEALTH_CHECK_ID', payload: {robot}}
}

export function resetHealthCheck (robot: BaseRobot): ResetHealthCheckAction {
  return {type: 'api:RESET_HEALTH_CHECK', payload: {robot}}
}

export const healthCheckMiddleware: Middleware =
  (store) => (next) => (action) => {
    switch (action.type) {
      case 'api:START_HEALTH_CHECK':
        startChecking(store, action.payload.robot)
        break

      case 'api:STOP_HEALTH_CHECK':
        stopChecking(store, action.payload.robot)
        break

      case 'api:FAILURE':
        if (action.payload.path === 'health') {
          handleHealthFailure(store, action.payload.robot)
        }
        break

      case 'robot:CONNECT_RESPONSE':
        if (!action.payload.error) {
          const state = store.getState()
          const name = getConnectRequest(state).name
          const robot = getDiscoveredByName(state)[name]
          if (robot) store.dispatch(startHealthCheck(robot))
        }
        break

      case 'robot:DISCONNECT_RESPONSE':
        const robot = {name: getConnectedRobotName(store.getState())}
        store.dispatch(stopHealthCheck(robot))
        store.dispatch(resetHealthCheck(robot))
    }

    return next(action)
  }

export function healthCheckReducer (
  state: ?HealthCheckState,
  action: Action
): HealthCheckState {
  if (!state) return {}

  switch (action.type) {
    case 'api:RESET_HEALTH_CHECK': {
      const name = action.payload.robot.name
      return {...state, [name]: INITIAL_STATE_BY_NAME}
    }

    case 'api:SET_HEALTH_CHECK_ID': {
      const name = action.payload.robot.name
      return {...state, [name]: {id: action.payload.id, missed: 0}}
    }

    case 'api:CLEAR_HEALTH_CHECK_ID': {
      const name = action.payload.robot.name
      const stateByName = state[name]
      return {...state, [name]: {...stateByName, id: null}}
    }

    case 'api:SUCCESS': {
      const name = action.payload.robot.name
      const stateByName = state[name] || {}
      return action.payload.path === 'health' && stateByName.id
        ? {...state, [name]: {...stateByName, missed: 0}}
        : state
    }

    case 'api:FAILURE': {
      const name = action.payload.robot.name
      const stateByName = state[name] || {}
      return action.payload.path === 'health' && stateByName.id
        ? {...state, [name]: {...stateByName, missed: stateByName.missed + 1}}
        : state
    }
  }

  return state
}

export const makeGetHealthCheckOk = () => createSelector(
  selectRobotHealthCheck,
  (state: ?RobotHealthCheck): ?boolean => {
    if (!state) return null

    const failed = state.id == null && state.missed >= CHECK_THRESHOLD

    return !failed
  }
)

function startChecking (store, robot: RobotService): void {
  if (!shouldCheck(store, robot)) return

  const action = fetchHealth(robot)
  const id = setInterval(() => store.dispatch(action), CHECK_INTERVAL_MS)

  store.dispatch(setHealthCheckId(robot, id))
}

function stopChecking (store, robot: BaseRobot): void {
  const state = selectRobotHealthCheck(store.getState(), robot)

  if (state && state.id) {
    clearInterval(state.id)
    store.dispatch(clearHealthCheckId(robot))
  }
}

function handleHealthFailure (store, robot: BaseRobot): void {
  const state = selectRobotHealthCheck(store.getState(), robot)

  if (state && state.id && state.missed >= CHECK_THRESHOLD) {
    store.dispatch(stopHealthCheck(robot))
  }
}

function shouldCheck (store, robot: RobotService): boolean {
  const state = selectRobotHealthCheck(store.getState(), robot)

  return !state || state.id == null
}

function selectRobotHealthCheck (
  state: State,
  props: BaseRobot
): ?RobotHealthCheck {
  return state.healthCheck[props.name]
}
