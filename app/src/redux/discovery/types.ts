import type {
  DiscoveryClientRobot,
  HealthResponse,
  HealthStatus,
} from '@opentrons/discovery-client'

import {
  HEALTH_STATUS_OK,
  CONNECTABLE,
  REACHABLE,
  UNREACHABLE,
} from './constants'

export type { DiscoveryClientRobot, HealthStatus }

export type RobotsMap = Record<string, DiscoveryClientRobot>

export type ConnectivityStatus =
  | typeof CONNECTABLE
  | typeof REACHABLE
  | typeof UNREACHABLE

export interface DiscoveryState {
  scanning: boolean
  robotsByName: RobotsMap
}

export interface BaseRobot extends Omit<DiscoveryClientRobot, 'addresses'> {
  displayName: string
  connected: boolean
  local: boolean | null
  seen: boolean
}

// fully connectable robot
export interface Robot extends BaseRobot {
  status: typeof CONNECTABLE
  health: HealthResponse
  ip: string
  port: number
  healthStatus: typeof HEALTH_STATUS_OK
  serverHealthStatus: HealthStatus
}

// robot with a seen, but not connectable IP
export interface ReachableRobot extends BaseRobot {
  status: typeof REACHABLE
  ip: string
  port: number
  healthStatus: HealthStatus
  serverHealthStatus: HealthStatus
}

// robot with no reachable IP
export interface UnreachableRobot extends BaseRobot {
  status: typeof UNREACHABLE
  ip: string | null
  port: number | null
  healthStatus: HealthStatus | null
  serverHealthStatus: HealthStatus | null
}

export type ViewableRobot = Robot | ReachableRobot

export type DiscoveredRobot = Robot | ReachableRobot | UnreachableRobot

export interface StartDiscoveryAction {
  type: 'discovery:START'
  payload: { timeout: number | null }
  meta: { shell: true }
}

export interface FinishDiscoveryAction {
  type: 'discovery:FINISH'
  meta: { shell: true }
}

export interface UpdateListAction {
  type: 'discovery:UPDATE_LIST'
  payload: { robots: DiscoveryClientRobot[] }
}

export interface RemoveRobotAction {
  type: 'discovery:REMOVE'
  payload: { robotName: string }
  meta: { shell: true }
}

export interface ClearDiscoveryCacheAction {
  type: 'discovery:CLEAR_CACHE'
  meta: { shell: true }
}

export type DiscoveryAction =
  | StartDiscoveryAction
  | FinishDiscoveryAction
  | UpdateListAction
  | RemoveRobotAction
  | ClearDiscoveryCacheAction
