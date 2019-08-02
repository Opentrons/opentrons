// @flow
// robot discovery state
import groupBy from 'lodash/groupBy'
import mapValues from 'lodash/mapValues'
import some from 'lodash/some'

import { getShellRobots } from '../shell'
import * as actions from './actions'

import type { Service } from '@opentrons/discovery-client'
import type { Action } from '../types'
import type { RestartStatus } from './types'

export * from './types'
export * from './actions'
export * from './selectors'
export { discoveryEpic } from './epics'

type RobotsMap = { [name: string]: Array<Service> }

type RestartsMap = { [name: string]: ?RestartStatus }

export type DiscoveryState = {|
  scanning: boolean,
  robotsByName: RobotsMap,
  restartsByName: RestartsMap,
|}

export const RESTART_PENDING: RestartStatus = 'pending'
export const RESTART_DOWN: RestartStatus = 'down'

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
    case actions.DISCOVERY_START:
      return { ...state, scanning: true }

    case actions.DISCOVERY_FINISH:
      return { ...state, scanning: false }

    case actions.DISCOVERY_UPDATE_LIST: {
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

export function normalizeRobots(robots: Array<Service> = []): RobotsMap {
  return groupBy(robots, 'name')
}
