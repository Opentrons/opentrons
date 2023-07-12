import type { Agent } from 'http'

import type {
  HealthResponse,
  ServerHealthResponse,
  HealthErrorResponse,
  HealthPollerResult,
  DiscoveryClientRobot,
} from '../types'

import type { MdnsBrowserService } from '../mdns-browser'

import {
  HEALTH_STATUS_UNREACHABLE,
  HEALTH_STATUS_NOT_OK,
  HEALTH_STATUS_OK,
} from '../constants'

import {
  INITIALIZE_STATE,
  SERVICE_FOUND,
  HEALTH_POLLED,
  REMOVE_ROBOT,
} from './actions'

/**
 * Health state of a given robot
 */
export interface RobotState {
  /** unique name of the robot */
  name: string
  /** latest /health response data from the robot */
  health: HealthResponse | null
  /** latest /server/update/health response data from the robot */
  serverHealth: ServerHealthResponse | null
}

/**
 * Health endpoint status, where a given endpoint is one of:
 * - Unreachable: fetch failed completely
 * - Not ok: Fetch was successful, but the status code was not 2xx
 * - Ok: Fetch was successful and status code was 2xx
 */
export type HealthStatus =
  | typeof HEALTH_STATUS_UNREACHABLE
  | typeof HEALTH_STATUS_NOT_OK
  | typeof HEALTH_STATUS_OK

export interface Address {
  /** IP address */
  ip: string
  /** Port */
  port: number
  /** custom http agent */
  agent?: Agent
}

/**
 * State for a given IP address, which should point to a robot
 */
export interface HostState extends Address {
  /** Whether this IP has been seen via mDNS or HTTP while the client has been running */
  seen: boolean
  /** How the last GET /health responded (null if no response yet) */
  healthStatus: HealthStatus | null
  /** How the last GET /server/update/health responded (null if no response yet) */
  serverHealthStatus: HealthStatus | null
  /** Error status and response from /health if last request was not 200 */
  healthError: HealthErrorResponse | null
  /** Error status and response from /server/update/health if last request was not 200 */
  serverHealthError: HealthErrorResponse | null
  /** Robot that this IP points to */
  robotName: string
  /** the robot model advertised in mdns, if known */
  advertisedModel: string | null
}

export interface RobotsByNameMap {
  [robotName: string]: RobotState
}

export interface HostsByIpMap {
  [ipAddress: string]: HostState
}

export interface State {
  robotsByName: RobotsByNameMap
  hostsByIp: HostsByIpMap
  manualAddresses: Address[]
}

/**
 * Action type to (re)initialize the discovered robots and manualAddress
 * tracking state
 */
export interface InitializeStateAction {
  type: typeof INITIALIZE_STATE
  payload: {
    initialRobots?: DiscoveryClientRobot[]
    manualAddresses?: Address[]
  }
}

/**
 * Action type for when an mDNS service advertisement is received
 */
export interface ServiceFoundAction {
  type: typeof SERVICE_FOUND
  payload: MdnsBrowserService
}

/**
 * Action type for when an HTTP health poll completes
 */
export interface HealthPolledAction {
  type: typeof HEALTH_POLLED
  payload: HealthPollerResult
}

/**
 * Remove an robot from the state if that IP address has not been seen
 */
export interface RemoveRobotAction {
  type: typeof REMOVE_ROBOT
  payload: { name: string }
}

export type Action =
  | InitializeStateAction
  | ServiceFoundAction
  | HealthPolledAction
  | RemoveRobotAction

export type Dispatch = (action: Action) => Action
