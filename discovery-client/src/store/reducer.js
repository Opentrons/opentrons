// @flow
import { combineReducers } from 'redux'
import isEqual from 'lodash/isEqual'
import keyBy from 'lodash/keyBy'
import omit from 'lodash/omit'

import {
  HEALTH_STATUS_OK,
  HEALTH_STATUS_NOT_OK,
  HEALTH_STATUS_UNREACHABLE,
} from '../constants'

import * as Actions from './actions'

import type { Reducer } from 'redux'

import type {
  State,
  Action,
  RobotState,
  HostState,
  RobotsByNameMap,
  HostsByIpMap,
  Address,
} from './types'

const INITIAL_STATE: State = {
  robotsByName: {},
  hostsByIp: {},
  manualAddresses: [],
}

const makeHostState = (ip, port, robotName) => ({
  ip,
  port,
  robotName,
  seen: false,
  healthStatus: null,
  serverHealthStatus: null,
  healthError: null,
  serverHealthError: null,
})

const getHealthStatus = (responseData, error) => {
  if (responseData) return HEALTH_STATUS_OK
  if (error && error.status >= 400) return HEALTH_STATUS_NOT_OK
  return HEALTH_STATUS_UNREACHABLE
}

export const robotsByNameReducer = (
  state: RobotsByNameMap = INITIAL_STATE.robotsByName,
  action: Action
): RobotsByNameMap => {
  switch (action.type) {
    case Actions.INITIALIZE_STATE: {
      const { initialRobots } = action.payload
      if (!initialRobots) return state

      const states = initialRobots.map(
        ({ addresses, ...robotState }) => robotState
      )
      return keyBy(states, 'name')
    }

    case Actions.REMOVE_ROBOT: {
      const { name } = action.payload
      return name in state ? omit(state, name) : state
    }

    case Actions.SERVICE_FOUND: {
      const { name } = action.payload
      const robot: RobotState | void = state[name]
      const health = robot?.health ?? null
      const serverHealth = robot?.serverHealth ?? null

      return robot == null
        ? { ...state, [name]: { name, health, serverHealth } }
        : state
    }

    case Actions.HEALTH_POLLED: {
      const { health, serverHealth } = action.payload
      const name = serverHealth?.name ?? health?.name ?? null
      if (!name) return state

      const nextHealth = state[name]?.health ?? health
      const nextServerHealth = state[name]?.serverHealth ?? serverHealth
      const nextRobotState = {
        name,
        health: nextHealth,
        serverHealth: nextServerHealth,
      }

      return isEqual(state[name], nextRobotState)
        ? state
        : { ...state, [name]: nextRobotState }
    }
  }

  return state
}

export const hostsByIpReducer = (
  state: HostsByIpMap = INITIAL_STATE.hostsByIp,
  action: Action
): HostsByIpMap => {
  switch (action.type) {
    case Actions.INITIALIZE_STATE: {
      const { initialRobots } = action.payload
      if (!initialRobots) return state

      const states = initialRobots.flatMap<HostState>(({ name, addresses }) => {
        return addresses.map(({ ip, port }) => makeHostState(ip, port, name))
      })

      return keyBy(states, 'ip')
    }

    case Actions.REMOVE_ROBOT: {
      const { name: robotName } = action.payload
      const removals = Object.keys(state).filter((ip: string) => {
        const { robotName: targetRobotName } = state[ip]
        return robotName === targetRobotName
      })

      return removals.length > 1 ? omit(state, removals) : state
    }

    case Actions.SERVICE_FOUND: {
      const { ip, port, name: robotName } = action.payload
      const host: HostState | void = state[ip]
      const newHost = host?.robotName !== robotName
      const nextHostState = {
        ip,
        port,
        robotName,
        seen: true,
        healthStatus: newHost ? null : host?.healthStatus ?? null,
        serverHealthStatus: newHost ? null : host?.serverHealthStatus ?? null,
        healthError: newHost ? null : host?.healthError ?? null,
        serverHealthError: newHost ? null : host?.serverHealthError ?? null,
      }

      return isEqual(host, nextHostState)
        ? state
        : { ...state, [ip]: nextHostState }
    }

    case Actions.HEALTH_POLLED: {
      const {
        ip,
        port,
        health,
        serverHealth,
        healthError,
        serverHealthError,
      } = action.payload
      const host: HostState | void = state[ip]
      const robotName =
        serverHealth?.name ?? health?.name ?? host?.robotName ?? null
      const healthStatus = getHealthStatus(health, healthError)
      const serverHealthStatus = getHealthStatus(
        serverHealth,
        serverHealthError
      )
      const seen =
        host?.seen === true ||
        healthStatus !== HEALTH_STATUS_UNREACHABLE ||
        serverHealthStatus !== HEALTH_STATUS_UNREACHABLE

      const nextHostState = {
        ip,
        port,
        seen,
        healthStatus,
        serverHealthStatus,
        healthError,
        serverHealthError,
        robotName,
      }

      // if we get a healthy poll on a given IP, remove any unhealthy, unseen
      // ips for the same robot from the list to avoid polling them forever
      const ipIsGood =
        healthStatus === HEALTH_STATUS_OK &&
        serverHealthStatus === HEALTH_STATUS_OK

      const removals: Array<string> = ipIsGood
        ? Object.keys(state).filter((targetIp: string) => {
            const {
              seen: targetSeen,
              healthStatus: targetHealthStatus,
              serverHealthStatus: targetServerHealthStatus,
              robotName: targetRobotName,
            } = state[targetIp]

            return (
              targetIp !== ip &&
              targetRobotName === robotName &&
              targetSeen === false &&
              targetHealthStatus === HEALTH_STATUS_UNREACHABLE &&
              targetServerHealthStatus === HEALTH_STATUS_UNREACHABLE
            )
          })
        : []

      return isEqual(state[ip], nextHostState) && removals.length === 0
        ? state
        : { ...omit(state, removals), [ip]: nextHostState }
    }
  }

  return state
}

export const manualAddressesReducer = (
  state: $ReadOnlyArray<Address> = INITIAL_STATE.manualAddresses,
  action: Action
): $ReadOnlyArray<Address> => {
  switch (action.type) {
    case Actions.INITIALIZE_STATE: {
      return action.payload.manualAddresses ?? state
    }
  }

  return state
}

export const reducer: Reducer<State, Action> = combineReducers({
  robotsByName: robotsByNameReducer,
  hostsByIp: hostsByIpReducer,
  manualAddresses: manualAddressesReducer,
})
