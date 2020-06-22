// @flow
// robot discovery state
import groupBy from 'lodash/groupBy'
import { UI_INITIALIZED } from '../shell'
import * as actions from './actions'

import type { Action } from '../types'
import type { Service, RobotsMap, DiscoveryState } from './types'

export const normalizeRobots = (robots: Array<Service> = []): RobotsMap => {
  return groupBy(robots, 'name')
}

export const INITIAL_STATE: DiscoveryState = {
  scanning: false,
  robotsByName: {},
}

export function discoveryReducer(
  state: DiscoveryState = INITIAL_STATE,
  action: Action
): DiscoveryState {
  switch (action.type) {
    case UI_INITIALIZED:
    case actions.DISCOVERY_START:
      return { ...state, scanning: true }

    case actions.DISCOVERY_FINISH:
      return { ...state, scanning: false }

    case actions.DISCOVERY_UPDATE_LIST: {
      return { ...state, robotsByName: normalizeRobots(action.payload.robots) }
    }
  }

  return state
}
