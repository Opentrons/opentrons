import { isIPv6 } from 'is-ip'
import concat from 'lodash/concat'
import find from 'lodash/find'
import head from 'lodash/head'
import isEqual from 'lodash/isEqual'
import orderBy from 'lodash/orderBy'
import { createSelector, lruMemoize } from 'reselect'
import semver from 'semver'

import {
  CONNECTABLE,
  HEALTH_STATUS_OK,
  HEALTH_STATUS_UNREACHABLE,
  OPENTRONS_USB,
  RE_HOSTNAME_IPV4_LL,
  RE_HOSTNAME_IPV6_LL,
  RE_HOSTNAME_LOCALHOST,
  RE_HOSTNAME_LOOPBACK,
  RE_ROBOT_MODEL_OT2,
  RE_ROBOT_MODEL_OT3,
  REACHABLE,
  ROBOT_MODEL_OT2,
  ROBOT_MODEL_OT3,
  UNREACHABLE,
} from './constants'

import type { State } from '../types'
import type {
  DiscoveredRobot,
  DiscoveryClientRobotAddress,
  ReachableRobot,
  Robot,
  RobotModel,
  UnreachableRobot,
  ViewableRobot,
} from './types'

type GetConnectableRobots = (state: State) => Robot[]
type GetReachableRobots = (state: State) => ReachableRobot[]
type GetUnreachableRobots = (state: State) => UnreachableRobot[]
type GetAllRobots = (state: State) => DiscoveredRobot[]
type GetViewableRobots = (state: State) => ViewableRobot[]
type GetLocalRobot = (state: State) => DiscoveredRobot | null

const isLocal = (ip: string): boolean => {
  return (
    RE_HOSTNAME_IPV6_LL.test(ip) ||
    RE_HOSTNAME_IPV4_LL.test(ip) ||
    RE_HOSTNAME_LOCALHOST.test(ip) ||
    RE_HOSTNAME_LOOPBACK.test(ip) ||
    ip === OPENTRONS_USB
  )
}

const ipToHostname = (ip: string): string => (isIPv6(ip) ? `[${ip}]` : ip)

const makeRobotModel = (
  healthModel: string | null,
  serverHealthModel: string | null,
  advertisedModel: string | null
): RobotModel => {
  return (
    [healthModel, serverHealthModel, advertisedModel].reduce(
      (
        bestModel: RobotModel | null,
        modelEntry: string | null
      ): RobotModel | null => {
        if (bestModel || !modelEntry) return bestModel
        if (RE_ROBOT_MODEL_OT3.test(modelEntry)) return ROBOT_MODEL_OT3
        if (RE_ROBOT_MODEL_OT2.test(modelEntry)) return ROBOT_MODEL_OT2
        return null
      },
      null
    ) ?? ROBOT_MODEL_OT2
  )
}

export function getScanning(state: State): boolean {
  return state.discovery.scanning
}

const getRobotModelDisplayName = (robot: DiscoveredRobot): string | null => {
  const robotModelName = robot.robotModel?.split(/\s/)[0] ?? null

  return robotModelName === 'OT-3' ? 'Opentrons Flex' : robotModelName
}

const isNotOT2Robot = (robot: DiscoveredRobot): boolean => {
  const displayName = getRobotModelDisplayName(robot)

  return displayName !== 'OT-2' && displayName !== null
}

export const getDiscoveredRobots: (state: State) => DiscoveredRobot[] =
  createSelector(
    (state: State) => state.discovery.robotsByName,
    robotsMap => {
      const robots = Object.keys(robotsMap).map((robotName: string) => {
        const robot = robotsMap[robotName]
        const { addresses, ...robotState } = robot
        const { health, serverHealth } = robotState
        const addr = head(addresses)
        const advertisedModel = addr?.advertisedModel ?? null
        const ip = addr?.ip ? ipToHostname(addr.ip) : null
        const port = addr?.port ?? null
        const healthStatus = addr?.healthStatus ?? null
        const serverHealthStatus = addr?.serverHealthStatus ?? null
        const baseRobot = {
          ...robotState,
          local: ip !== null ? isLocal(ip) : null,
          seen: addr?.seen === true,
          robotModel: makeRobotModel(
            health?.robot_model ?? null,
            serverHealth?.robotModel ?? null,
            advertisedModel ?? null
          ),
        }

        if (
          ip !== null &&
          port !== null &&
          healthStatus &&
          serverHealthStatus
        ) {
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

      return robots.filter(robot => isNotOT2Robot(robot))
    }
  )

export const getConnectableRobots: GetConnectableRobots = createSelector(
  getDiscoveredRobots,
  robots =>
    orderBy(
      robots.flatMap(r => (r.status === CONNECTABLE ? [r] : [])),
      [robot => robot.name.toLowerCase()],
      ['asc']
    )
)

export const getReachableRobots: GetReachableRobots = createSelector(
  getDiscoveredRobots,
  robots =>
    orderBy(
      robots.flatMap(r => (r.status === REACHABLE ? [r] : [])),
      [robot => robot.name.toLowerCase()],
      ['asc']
    )
)

export const getUnreachableRobots: GetUnreachableRobots = createSelector(
  getDiscoveredRobots,
  robots =>
    orderBy(
      robots.flatMap(r => (r.status === UNREACHABLE ? [r] : [])),
      [robot => robot.name.toLowerCase()],
      ['asc']
    )
)

export const getAllRobots: GetAllRobots = createSelector(
  getConnectableRobots,
  getReachableRobots,
  getUnreachableRobots,
  (cr: DiscoveredRobot[], rr: DiscoveredRobot[], ur: DiscoveredRobot[]) =>
    orderBy(
      concat<DiscoveredRobot>(cr, rr, ur),
      [robot => robot.name.toLowerCase()],
      ['asc']
    )
)

export const getViewableRobots: GetViewableRobots = createSelector(
  getConnectableRobots,
  getReachableRobots,
  (cr: ViewableRobot[], rr: ViewableRobot[]) =>
    orderBy(
      concat<ViewableRobot>(cr, rr),
      [robot => robot.name.toLowerCase()],
      ['asc']
    )
)

export const getLocalRobot: GetLocalRobot = createSelector(
  getAllRobots,
  robots => find(robots, { ip: _ODD_IP_ ?? 'localhost' }) ?? null
)

export const getRobotByName = (
  state: State,
  robotName: string
): ViewableRobot | null => {
  return getViewableRobots(state).find(r => r.name === robotName) || null
}

export const getDiscoverableRobotByName: (
  state: State,
  robotName: string | null
) => DiscoveredRobot | null = createSelector(
  getAllRobots,
  (state: State, robotName: string | null) => robotName,
  (robots, robotName) => robots.find(r => r.name === robotName) ?? null,
  {
    memoize: lruMemoize,
    memoizeOptions: {
      resultEqualityCheck: isEqual,
    },
  }
)

export const getRobotSerialNumber = (robot: DiscoveredRobot): string | null =>
  robot.health?.robot_serial ?? robot.serverHealth?.serialNumber ?? null

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
): { min: string; max: string } | null => {
  const healthField = robot.health
  const DEFAULT_API_VERSION = '1.0'
  if (!healthField) {
    return null
  }

  const maxApiVersion =
    healthField.protocol_api_version ?? healthField.maximum_protocol_api_version
  const minApiVersion = healthField.minimum_protocol_api_version
  return {
    min: minApiVersion ? minApiVersion.join('.') : DEFAULT_API_VERSION,
    max: maxApiVersion ? maxApiVersion.join('.') : DEFAULT_API_VERSION,
  }
}

export const getRobotApiVersionByName = (
  state: State,
  robotName: string
): string | null => {
  const robot = getRobotByName(state, robotName)
  return robot ? getRobotApiVersion(robot) : null
}

export const getRobotModel = (robot: DiscoveredRobot): RobotModel => {
  return robot.robotModel
}

export const getRobotModelByName = (
  state: State,
  robotName: string
): string | null => {
  const robot = getDiscoverableRobotByName(state, robotName)

  return robot != null ? getRobotModelDisplayName(robot) : null
}

export const getRobotAddressesByName: (
  state: State,
  robotName: string
) => DiscoveryClientRobotAddress[] = createSelector(
  state => state.discovery.robotsByName,
  (state: State, robotName: string) => robotName,
  (robotsMap, robotName) => {
    const robot = robotsMap[robotName]
    const { addresses } = robot
    return addresses
  }
)
