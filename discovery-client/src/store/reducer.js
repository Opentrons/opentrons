// @flow
import { combineReducers } from 'redux'
import isEqual from 'lodash/isEqual'
import omit from 'lodash/omit'

import * as Actions from './actions'

import type { Reducer } from 'redux'

import type {
  State,
  Action,
  RobotState,
  HostState,
  RobotsByNameMap,
  HostsByIpMap,
} from './types'

const INITIAL_STATE = {
  robotsByName: {},
  hostsByIp: {},
}

const makeInitialHostState = ip => ({
  ip,
  port: 31950,
  seen: false,
  ok: null,
  serverOk: null,
  healthError: null,
  serverHealthError: null,
  robotName: null,
})

export const robotsByNameReducer = (
  state: RobotsByNameMap = INITIAL_STATE.robotsByName,
  action: Action
): RobotsByNameMap => {
  switch (action.type) {
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
    case Actions.ADD_IP_ADDRESS: {
      const { ip } = action.payload
      return ip in state ? state : { [ip]: makeInitialHostState(ip) }
    }

    case Actions.REMOVE_IP_ADDRESS: {
      const { ip } = action.payload
      const host: HostState | void = state[ip]
      return host && host.seen === false ? omit(state, ip) : state
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
        ok: newHost ? null : host?.ok ?? null,
        serverOk: newHost ? null : host?.serverOk ?? null,
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
      const seen =
        host?.seen === true || health !== null || serverHealth !== null
      const ok = health !== null
      const serverOk = serverHealth !== null
      const nextHostState = {
        ip,
        port,
        seen,
        ok,
        serverOk,
        healthError,
        serverHealthError,
        robotName,
      }

      // if we get a healthy poll on a given IP, remove any unhealthy, unseen
      // ips for the same robot from the list to avoid polling them forever
      const removals: Array<string> =
        ok && serverOk
          ? Object.keys(state).filter((targetIp: string) => {
              const {
                seen: targetSeen,
                ok: targetOk,
                serverOk: targetServerOk,
                robotName: targetRobotName,
              } = state[targetIp]

              return (
                targetRobotName === robotName &&
                targetIp !== ip &&
                targetSeen === false &&
                targetOk === false &&
                targetServerOk === false
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

export const reducer: Reducer<State, Action> = combineReducers({
  robotsByName: robotsByNameReducer,
  hostsByIp: hostsByIpReducer,
})
