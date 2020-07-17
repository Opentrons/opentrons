// @flow

import type {
  HealthResponse,
  ServerHealthResponse,
  HealthErrorResponse,
  HealthPollerResult,
} from '../types'

import typeof {
  SERVICE_FOUND,
  HEALTH_POLLED,
  ADD_IP_ADDRESS,
  REMOVE_IP_ADDRESS,
  REMOVE_ROBOT,
} from './actions'

import typeof {
  HEALTH_STATUS_UNREACHABLE,
  HEALTH_STATUS_NOT_OK,
  HEALTH_STATUS_OK,
} from './constants'

/**
 * Health state of a given robot
 */
export type RobotState = $ReadOnly<{|
  /** unique name of the robot */
  name: string,
  /** latest /health response data from the robot */
  health: HealthResponse | null,
  /** latest /server/health response data from the robot */
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

/**
 * State for a given IP address, which should point to a robot
 */
export type HostState = $ReadOnly<{|
  /** IP address */
  ip: string,
  /** Port */
  port: number,
  /** Whether this IP has been seen via mDNS or HTTP while the client has been running */
  seen: boolean,
  /** How the last GET /health responded (null if no response yet) */
  healthStatus: HealthStatus | null,
  /** How the last GET /server/health responded (null if no response yet) */
  serverHealthStatus: HealthStatus | null,
  /** Error status and response from /health if last request was not 200 */
  healthError: HealthErrorResponse | null,
  /** Error status and response from /server/health if last request was not 200 */
  serverHealthError: HealthErrorResponse | null,
  /** Robot that this IP points to, if known */
  robotName: string | null,
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
|}>

/**
 * Action type for when an mDNS service advertisement is received
 */
export type ServiceFoundAction = {|
  type: SERVICE_FOUND,
  payload: {| name: string, ip: string, port: number |},
|}

/**
 * Action type for when an HTTP health poll completes
 */
export type HealthPolledAction = {|
  type: HEALTH_POLLED,
  payload: HealthPollerResult,
|}

/**
 * Add an IP address to the state for tracking
 */
export type AddIpAddressAction = {|
  type: ADD_IP_ADDRESS,
  payload: {| ip: string, port: number |},
|}

/**
 * Remove an IP address to the state if that IP address has not been seen
 */
export type RemoveIpAddressAction = {|
  type: REMOVE_IP_ADDRESS,
  payload: {| ip: string |},
|}

/**
 * Remove an robot from the state if that IP address has not been seen
 */
export type RemoveRobotAction = {|
  type: REMOVE_ROBOT,
  payload: {| name: string |},
|}

export type Action =
  | ServiceFoundAction
  | HealthPolledAction
  | AddIpAddressAction
  | RemoveIpAddressAction
  | RemoveRobotAction
