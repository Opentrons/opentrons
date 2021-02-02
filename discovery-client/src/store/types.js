// @flow

import type {
  HealthResponse,
  ServerHealthResponse,
  HealthErrorResponse,
  HealthPollerResult,
  MdnsBrowserService,
  DiscoveryClientRobot,
} from '../types'

import typeof {
  HEALTH_STATUS_UNREACHABLE,
  HEALTH_STATUS_NOT_OK,
  HEALTH_STATUS_OK,
} from '../constants'

import typeof {
  INITIALIZE_STATE,
  SERVICE_FOUND,
  HEALTH_POLLED,
  REMOVE_ROBOT,
} from './actions'

/**
 * Health state of a given robot
 */
export type RobotState = $ReadOnly<{|
  /** unique name of the robot */
  name: string,
  /** latest /health response data from the robot */
  health: HealthResponse | null,
  /** latest /server/update/health response data from the robot */
  serverHealth: ServerHealthResponse | null,
|}>

/**
 * Health endpoint status, where a given endpoint is one of:
 * - Unreachable: fetch failed completely
 * - Not ok: Fetch was successful, but the status code was not 2xx
 * - Ok: Fetch was successful and status code was 2xx
 */
export type HealthStatus =
  | HEALTH_STATUS_UNREACHABLE
  | HEALTH_STATUS_NOT_OK
  | HEALTH_STATUS_OK

export type Address = $ReadOnly<{|
  /** IP address */
  ip: string,
  /** Port */
  port: number,
|}>

/**
 * State for a given IP address, which should point to a robot
 */
export type HostState = $ReadOnly<{|
  ...Address,
  /** Whether this IP has been seen via mDNS or HTTP while the client has been running */
  seen: boolean,
  /** How the last GET /health responded (null if no response yet) */
  healthStatus: HealthStatus | null,
  /** How the last GET /server/update/health responded (null if no response yet) */
  serverHealthStatus: HealthStatus | null,
  /** Error status and response from /health if last request was not 200 */
  healthError: HealthErrorResponse | null,
  /** Error status and response from /server/update/health if last request was not 200 */
  serverHealthError: HealthErrorResponse | null,
  /** Robot that this IP points to */
  robotName: string,
|}>

export type RobotsByNameMap = $ReadOnly<{
  [robotName: string]: RobotState,
  ...,
}>

export type HostsByIpMap = $ReadOnly<{
  [ipAddress: string]: HostState,
  ...,
}>

export type State = $ReadOnly<{|
  robotsByName: RobotsByNameMap,
  hostsByIp: HostsByIpMap,
  manualAddresses: $ReadOnlyArray<Address>,
|}>

/**
 * Action type to (re)initialize the discovered robots and manualAddress
 * tracking state
 */
export type InitializeStateAction = $ReadOnly<{|
  type: INITIALIZE_STATE,
  payload: $ReadOnly<{|
    initialRobots?: $ReadOnlyArray<DiscoveryClientRobot>,
    manualAddresses?: $ReadOnlyArray<Address>,
  |}>,
|}>

/**
 * Action type for when an mDNS service advertisement is received
 */
export type ServiceFoundAction = $ReadOnly<{|
  type: SERVICE_FOUND,
  payload: MdnsBrowserService,
|}>

/**
 * Action type for when an HTTP health poll completes
 */
export type HealthPolledAction = $ReadOnly<{|
  type: HEALTH_POLLED,
  payload: HealthPollerResult,
|}>

/**
 * Remove an robot from the state if that IP address has not been seen
 */
export type RemoveRobotAction = $ReadOnly<{|
  type: REMOVE_ROBOT,
  payload: $ReadOnly<{| name: string |}>,
|}>

export type Action =
  | InitializeStateAction
  | ServiceFoundAction
  | HealthPolledAction
  | RemoveRobotAction

export type Dispatch = (action: Action) => Action
