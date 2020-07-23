// @flow
import { createSelector } from 'reselect'
import unionBy from 'lodash/unionBy'
import {
  HEALTH_STATUS_OK,
  HEALTH_STATUS_NOT_OK,
  HEALTH_STATUS_UNREACHABLE,
} from '../constants'

import type { DiscoveryClientRobot } from '../types'
import type { State, RobotState, HostState, Address } from './types'

export const getRobotStates: State => $ReadOnlyArray<RobotState> = createSelector(
  state => state.robotsByName,
  robotsMap => Object.keys(robotsMap).map((name: string) => robotsMap[name])
)

export const getHostStates: State => $ReadOnlyArray<HostState> = createSelector(
  state => state.hostsByIp,
  hostsMap => Object.keys(hostsMap).map((ip: string) => hostsMap[ip])
)

export const getAddresses: State => $ReadOnlyArray<Address> = createSelector(
  state => state.manualAddresses,
  getHostStates,
  (manualAddresses, hosts) => {
    const trackedAddresses = hosts.map(({ ip, port }) => ({ ip, port }))
    return unionBy(trackedAddresses, manualAddresses, 'ip')
  }
)

export const getRobots: State => $ReadOnlyArray<DiscoveryClientRobot> = createSelector(
  getRobotStates,
  getHostStates,
  (robots, hosts) => {
    return robots.map(robot => ({
      ...robot,
      addresses: hosts
        .filter(({ robotName }) => robotName === robot.name)
        .sort(compareHostsByConnectability)
        .map(({ robotName, ...host }) => host),
    }))
  }
)

// accending priority order, where no match is lowest priority
const HEALTH_PRIORITY = [
  HEALTH_STATUS_UNREACHABLE,
  HEALTH_STATUS_NOT_OK,
  HEALTH_STATUS_OK,
]

// accending priority order, where no match is lowest priority
const IP_PRIORITY_MATCH = [
  /^169\.254\.\d+\.\d+$/,
  /^localhost$/,
  /^127\.0\.0\.1$/,
]

export const compareHostsByConnectability = (
  a: HostState,
  b: HostState
): number => {
  const healthSort =
    HEALTH_PRIORITY.indexOf(b.healthStatus) -
    HEALTH_PRIORITY.indexOf(a.healthStatus)

  if (healthSort !== 0) return healthSort

  const serverHealthSort =
    HEALTH_PRIORITY.indexOf(b.serverHealthStatus) -
    HEALTH_PRIORITY.indexOf(a.serverHealthStatus)

  if (serverHealthSort !== 0) return serverHealthSort

  const aIpPriority = IP_PRIORITY_MATCH.findIndex(re => re.test(a.ip))
  const bIpPriority = IP_PRIORITY_MATCH.findIndex(re => re.test(b.ip))
  const ipSort = bIpPriority - aIpPriority

  return ipSort
}
