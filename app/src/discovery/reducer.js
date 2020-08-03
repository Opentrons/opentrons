// @flow
// robot discovery state
import keyBy from 'lodash/keyBy'
import { UI_INITIALIZED } from '../shell'
import * as actions from './actions'

import type { Action } from '../types'
import type { DiscoveryState } from './types'

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
      return { ...state, robotsByName: keyBy(action.payload.robots, 'name') }
    }
  }

  return state
}
