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
 * State for a given IP address, which should point to a robot
 */
export type HostState = $ReadOnly<{|
  /** IP address */
  ip: string,
  /** Port */
  port: number,
  /** Whether this IP has been seen via mDNS or HTTP while the client has been running */
  seen: boolean,
  /**
   * If last /health request to this IP returned 200 (null if request not yet made)
   * TODO(mc, 2020-07-13): replace with an enum to capture the difference between
   * a fetch error due to networking and a 4xx or 5xx response
   */
  ok: boolean | null,
  /**
   * If last /server/health request to this IP returned 200 (null if request not yet made)
   * TODO(mc, 2020-07-13): replace with an enum to capture the difference between
   * a fetch error due to networking and a 4xx or 5xx response
   */
  serverOk: boolean | null,
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
  payload: {| ip: string |},
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
