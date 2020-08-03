// @flow
import isIp from 'is-ip'
import concat from 'lodash/concat'
import find from 'lodash/find'
import head from 'lodash/head'
import { createSelector } from 'reselect'
import semver from 'semver'

import {
  HEALTH_STATUS_OK,
  HEALTH_STATUS_UNREACHABLE,
  RE_HOSTNAME_IPV6_LL,
  RE_HOSTNAME_IPV4_LL,
  RE_HOSTNAME_LOCALHOST,
  RE_HOSTNAME_LOOPBACK,
  CONNECTABLE,
  REACHABLE,
  UNREACHABLE,
} from './constants'

// TODO(mc, 2018-10-10): fix circular dependency with RPC API client
// that requires us to bypass the robot entry point here
import { getConnectedRobotName } from '../robot/selectors'

import type { State } from '../types'
import type {
  DiscoveredRobot,
  Robot,
  ReachableRobot,
  UnreachableRobot,
  ViewableRobot,
} from './types'

type GetConnectableRobots = State => Array<Robot>
type GetReachableRobots = State => Array<ReachableRobot>
type GetUnreachableRobots = State => Array<UnreachableRobot>
type GetAllRobots = State => Array<DiscoveredRobot>
type GetViewableRobots = State => Array<ViewableRobot>
type GetConnectedRobot = State => Robot | null

const makeDisplayName = (name: string): string => name.replace('opentrons-', '')

const isLocal = (ip: string) => {
  return (
    RE_HOSTNAME_IPV6_LL.test(ip) ||
    RE_HOSTNAME_IPV4_LL.test(ip) ||
    RE_HOSTNAME_LOCALHOST.test(ip) ||
    RE_HOSTNAME_LOOPBACK.test(ip)
  )
}

const ipToHostname = (ip: string) => (isIp.v6(ip) ? `[${ip}]` : ip)

export function getScanning(state: State): boolean {
  return state.discovery.scanning
}

export const getDiscoveredRobots: State => Array<DiscoveredRobot> = createSelector(
  state => state.discovery.robotsByName,
  getConnectedRobotName,
  (robotsMap, connectedRobotName) => {
    return Object.keys(robotsMap).map((robotName: string) => {
      const robot = robotsMap[robotName]
      const { addresses, ...robotState } = robot
      const { health } = robotState
      const addr = head(addresses)
      const ip = addr?.ip ? ipToHostname(addr.ip) : null
      const port = addr?.port ?? null
      const healthStatus = addr?.healthStatus ?? null
      const serverHealthStatus = addr?.serverHealthStatus ?? null
      const baseRobot = {
        ...robotState,
        displayName: makeDisplayName(robotName),
        connected: robotName === connectedRobotName,
        local: ip !== null ? isLocal(ip) : null,
        seen: addr?.seen === true,
      }

      if (ip !== null && port !== null && healthStatus && serverHealthStatus) {
        if (health && healthStatus === HEALTH_STATUS_OK) {
          return {
            ...baseRobot,
            ip,
            port,
            health,
            serverHealthStatus,
            healthStatus: HEALTH_STATUS_OK,
            status: CONNECTABLE,
          }
        }

        if (healthStatus !== HEALTH_STATUS_UNREACHABLE || addr?.seen) {
          return {
            ...baseRobot,
            ip,
            port,
            healthStatus,
            serverHealthStatus,
            status: REACHABLE,
          }
        }
      }

      return {
        ...baseRobot,
        ip,
        port,
        healthStatus,
        serverHealthStatus,
        status: UNREACHABLE,
      }
    })
  }
)

export const getConnectableRobots: GetConnectableRobots = createSelector(
  getDiscoveredRobots,
  robots => robots.flatMap(r => (r.status === CONNECTABLE ? [r] : []))
)

export const getReachableRobots: GetReachableRobots = createSelector(
  getDiscoveredRobots,
  robots => robots.flatMap(r => (r.status === REACHABLE ? [r] : []))
)

export const getUnreachableRobots: GetUnreachableRobots = createSelector(
  getDiscoveredRobots,
  robots => robots.flatMap(r => (r.status === UNREACHABLE ? [r] : []))
)

export const getAllRobots: GetAllRobots = createSelector(
  getConnectableRobots,
  getReachableRobots,
  getUnreachableRobots,
  concat
)

export const getViewableRobots: GetViewableRobots = createSelector(
  getConnectableRobots,
  getReachableRobots,
  concat
)

export const getConnectedRobot: GetConnectedRobot = createSelector(
  getConnectableRobots,
  robots => find(robots, 'connected') ?? null
)

export const getRobotByName = (
  state: State,
  robotName: string
): ViewableRobot | null => {
  return getViewableRobots(state).find(r => r.name === robotName) || null
}

export const getRobotApiVersion = (robot: DiscoveredRobot): string | null =>
  (robot.health && semver.valid(robot.health.api_version)) ??
  (robot.serverHealth && semver.valid(robot.serverHealth.apiServerVersion)) ??
  null

export const getRobotFirmwareVersion = (
  robot: DiscoveredRobot
): string | null =>
  (robot.health && robot.health.fw_version) ??
  (robot.serverHealth && robot.serverHealth.smoothieVersion) ??
  null

export const getRobotProtocolApiVersion = (
  robot: DiscoveredRobot
): string | null => {
  const maxApiVersion = robot.health?.protocol_api_version
  return maxApiVersion ? maxApiVersion.join('.') : null
}

export const getRobotApiVersionByName = (
  state: State,
  robotName: string
): string | null => {
  const robot = getRobotByName(state, robotName)
  return robot ? getRobotApiVersion(robot) : null
}
