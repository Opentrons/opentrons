// @flow

import type { DiscoveryAction } from './types'

export const DISCOVERY_START: 'discovery:START' = 'discovery:START'

export const DISCOVERY_FINISH: 'discovery:FINISH' = 'discovery:FINISH'

export const DISCOVERY_UPDATE_LIST: 'discovery:UPDATE_LIST' =
  'discovery:UPDATE_LIST'

export const DISCOVERY_REMOVE: 'discovery:REMOVE' = 'discovery:REMOVE'

export function startDiscovery(timeout: number | null = null): DiscoveryAction {
  return {
    type: DISCOVERY_START,
    payload: { timeout },
    meta: { shell: true },
  }
}

export function finishDiscovery(): DiscoveryAction {
  return { type: DISCOVERY_FINISH, meta: { shell: true } }
}

export function removeRobot(robotName: string): DiscoveryAction {
  return {
    type: DISCOVERY_REMOVE,
    payload: { robotName },
    meta: { shell: true },
  }
}
