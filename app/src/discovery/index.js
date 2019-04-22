// @flow
// robot discovery state
import groupBy from 'lodash/groupBy'
import mapValues from 'lodash/mapValues'
import some from 'lodash/some'
import { getShellRobots } from '../shell'

import type { Service } from '@opentrons/discovery-client'
import type { Action, ThunkAction, Middleware } from '../types'
import type { RestartStatus } from './types'

export * from './types'
export * from './selectors'

type RobotsMap = { [name: string]: Array<Service> }

type RestartsMap = { [name: string]: ?RestartStatus }

type DiscoveryState = {
  scanning: boolean,
  robotsByName: RobotsMap,
  restartsByName: RestartsMap,
}

type StartAction = {|
  type: 'discovery:START',
  meta: {| shell: true |},
|}

type FinishAction = {|
  type: 'discovery:FINISH',
  meta: {| shell: true |},
|}

type UpdateListAction = {|
  type: 'discovery:UPDATE_LIST',
  payload: {| robots: Array<Service> |},
|}

export type DiscoveryAction = StartAction | FinishAction | UpdateListAction

const DISCOVERY_TIMEOUT_MS = 30000
const RESTART_DISCOVERY_TIMEOUT_MS = 60000

export const RESTART_PENDING: RestartStatus = 'pending'
export const RESTART_DOWN: RestartStatus = 'down'

export function startDiscovery(
  timeout: number = DISCOVERY_TIMEOUT_MS
): ThunkAction {
  const start: StartAction = { type: 'discovery:START', meta: { shell: true } }
  const finish: FinishAction = {
    type: 'discovery:FINISH',
    meta: { shell: true },
  }

  return dispatch => {
    setTimeout(() => dispatch(finish), timeout)
    return dispatch(start)
  }
}

// TODO(mc, 2018-08-09): uncomment when we figure out how to get this
// to the app shell
// export function updateDiscoveryList (
//   robots: Array<Service>
// ): UpdateListAction {
//   return {type: 'discovery:UPDATE_LIST', payload: {robots}}
// }

// getShellRobots makes a sync RPC call, so use sparingly
const initialState: DiscoveryState = {
  scanning: false,
  robotsByName: normalizeRobots(getShellRobots()),
  restartsByName: {},
}

export function discoveryReducer(
  state: DiscoveryState = initialState,
  action: Action
): DiscoveryState {
  switch (action.type) {
    case 'discovery:START':
      return { ...state, scanning: true }

    case 'discovery:FINISH':
      return { ...state, scanning: false }

    case 'discovery:UPDATE_LIST': {
      const robotsByName = normalizeRobots(action.payload.robots)
      const restartsByName = mapValues(state.restartsByName, (status, name) => {
        // TODO(mc, 2018-11-07): once POST /restart sets the status to PENDING,
        // we need the robot to be health checked by the discovery client at
        // some point while it's down. This is _probably_ going to happen
        // because we flip into fast polling when a POST /restart 200s, but
        // there's a potential gap here that could lead to a latched PENDING
        const up = some(robotsByName[name], 'ok')
        if (status === RESTART_PENDING && !up) return RESTART_DOWN
        if (status === RESTART_DOWN && up) return null
        return status
      })

      return { ...state, robotsByName, restartsByName }
    }

    case 'api:SERVER_SUCCESS': {
      const { path, robot } = action.payload
      if (path !== 'restart') return state
      return {
        ...state,
        restartsByName: {
          ...state.restartsByName,
          [robot.name]: RESTART_PENDING,
        },
      }
    }
  }

  return state
}

export const discoveryMiddleware: Middleware = store => next => action => {
  switch (action.type) {
    case 'api:SERVER_SUCCESS':
      if (action.payload.path === 'restart') {
        store.dispatch(startDiscovery(RESTART_DISCOVERY_TIMEOUT_MS))
      }
  }

  return next(action)
}

export function normalizeRobots(robots: Array<Service> = []): RobotsMap {
  return groupBy(robots, 'name')
}
