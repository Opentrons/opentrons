import { createSelector } from 'reselect'
import isIp from 'is-ip'
import unionBy from 'lodash/unionBy'
import {
  HEALTH_STATUS_OK,
  HEALTH_STATUS_NOT_OK,
  HEALTH_STATUS_UNREACHABLE,
  RE_HOSTNAME_IPV6_LL,
  RE_HOSTNAME_IPV4_LL,
  RE_HOSTNAME_LOCALHOST,
  RE_HOSTNAME_LOOPBACK,
} from '../constants'

import type { DiscoveryClientRobot } from '../types'
import type {
  State,
  RobotState,
  HostState,
  Address,
  HealthStatus,
} from './types'

export const getRobotStates: (state: State) => RobotState[] = createSelector(
  state => state.robotsByName,
  robotsMap => Object.keys(robotsMap).map((name: string) => robotsMap[name])
)

export const getHostStates: (state: State) => HostState[] = createSelector(
  state => state.hostsByIp,
  hostsMap => Object.keys(hostsMap).map((ip: string) => hostsMap[ip])
)

export const getAddresses: (state: State) => Address[] = createSelector(
  state => state.manualAddresses,
  getHostStates,
  (manualAddresses, hosts) => {
    const trackedAddresses = hosts.map(({ ip, port, agent }) =>
      agent != null
        ? {
            ip,
            port,
            agent,
          }
        : { ip, port }
    )
    // prefer reference from manualAddresses
    return unionBy(manualAddresses, trackedAddresses, 'ip')
  }
)

export const getRobots: (
  state: State
) => DiscoveryClientRobot[] = createSelector(
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

// ascending priority order, where no match is lowest priority
const HEALTH_PRIORITY = [
  HEALTH_STATUS_UNREACHABLE,
  HEALTH_STATUS_NOT_OK,
  HEALTH_STATUS_OK,
]

const SEEN_PRIORITY = [false, true]

// ascending priority order, where no match is lowest priority
const IP_PRIORITY_MATCH = [
  RE_HOSTNAME_IPV6_LL,
  RE_HOSTNAME_IPV4_LL,
  RE_HOSTNAME_LOCALHOST,
  RE_HOSTNAME_LOOPBACK,
]

// compare hosts in descending priority order
export function compareHostsByConnectability(
  a: HostState,
  b: HostState
): number {
  const healthSort =
    HEALTH_PRIORITY.indexOf(b.healthStatus as HealthStatus) -
    HEALTH_PRIORITY.indexOf(a.healthStatus as HealthStatus)

  if (healthSort !== 0) return healthSort

  const serverHealthSort =
    HEALTH_PRIORITY.indexOf(b.serverHealthStatus as HealthStatus) -
    HEALTH_PRIORITY.indexOf(a.serverHealthStatus as HealthStatus)

  if (serverHealthSort !== 0) return serverHealthSort

  const seenSort = SEEN_PRIORITY.indexOf(b.seen) - SEEN_PRIORITY.indexOf(a.seen)

  if (seenSort !== 0) return seenSort

  const aIpPriority = IP_PRIORITY_MATCH.findIndex(re => re.test(a.ip))
  const bIpPriority = IP_PRIORITY_MATCH.findIndex(re => re.test(b.ip))
  const ipSort = bIpPriority - aIpPriority

  if (ipSort !== 0) return ipSort

  // prefer ip hostname
  const isIpSort = isIp(b.ip) ? 1 : -1

  return isIpSort
}
