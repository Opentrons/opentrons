// @flow

import type {
  DiscoveryClientRobot,
  HealthResponse,
  HealthStatus,
} from '@opentrons/discovery-client'

import typeof {
  HEALTH_STATUS_OK,
  CONNECTABLE,
  REACHABLE,
  UNREACHABLE,
} from './constants'

export type { DiscoveryClientRobot, HealthStatus }

export type RobotsMap = $Shape<{| [name: string]: DiscoveryClientRobot |}>

export type DiscoveryState = {|
  scanning: boolean,
  robotsByName: RobotsMap,
|}

export type BaseRobot = {|
  ...$Rest<DiscoveryClientRobot, {| addresses: mixed |}>,
  displayName: string,
  connected: boolean,
  local: boolean | null,
  seen: boolean,
|}

// fully connectable robot
export type Robot = {|
  ...BaseRobot,
  status: CONNECTABLE,
  health: HealthResponse,
  ip: string,
  port: number,
  healthStatus: HEALTH_STATUS_OK,
  serverHealthStatus: HealthStatus,
|}

// robot with a seen, but not connecteable IP
export type ReachableRobot = {|
  ...BaseRobot,
  status: REACHABLE,
  ip: string,
  port: number,
  healthStatus: HealthStatus,
  serverHealthStatus: HealthStatus,
|}

// robot with no reachable IP
export type UnreachableRobot = {|
  ...BaseRobot,
  status: UNREACHABLE,
  ip: string | null,
  port: number | null,
  healthStatus: HealthStatus | null,
  serverHealthStatus: HealthStatus | null,
|}

export type ViewableRobot = Robot | ReachableRobot

export type DiscoveredRobot = Robot | ReachableRobot | UnreachableRobot

export type StartDiscoveryAction = {|
  type: 'discovery:START',
  payload: {| timeout: number | null |},
  meta: {| shell: true |},
|}

export type FinishDiscoveryAction = {|
  type: 'discovery:FINISH',
  meta: {| shell: true |},
|}

export type UpdateListAction = {|
  type: 'discovery:UPDATE_LIST',
  payload: {| robots: Array<DiscoveryClientRobot> |},
|}

export type RemoveRobotAction = {|
  type: 'discovery:REMOVE',
  payload: {| robotName: string |},
  meta: {| shell: true |},
|}

export type ClearDiscoveryCacheAction = {|
  type: 'discovery:CLEAR_CACHE',
  meta: {| shell: true |},
|}

export type DiscoveryAction =
  | StartDiscoveryAction
  | FinishDiscoveryAction
  | UpdateListAction
  | RemoveRobotAction
  | ClearDiscoveryCacheAction
