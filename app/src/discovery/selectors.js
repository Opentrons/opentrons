// @flow
import concat from 'lodash/concat'
import filter from 'lodash/filter'
import find from 'lodash/find'
import groupBy from 'lodash/groupBy'
import head from 'lodash/head'
import map from 'lodash/map'
import mapValues from 'lodash/mapValues'
import pickBy from 'lodash/pickBy'
import { createSelector } from 'reselect'
import semver from 'semver'

// TODO(mc, 2018-10-10): fix circular dependency with RPC API client
// that requires us to bypass the robot entry point here
import { getConnectedRobotName } from '../robot/selectors'

import type { Service } from '@opentrons/discovery-client'
import type { State } from '../types'
import type {
  ResolvedRobot,
  Robot,
  ReachableRobot,
  UnreachableRobot,
  ViewableRobot,
  AnyRobot,
  ConnectableStatus,
  ReachableStatus,
  UnreachableStatus,
} from './types'

type GroupedRobotsMap = {
  [name: string]: {
    connectable: Array<Robot>,
    reachable: Array<ReachableRobot>,
    unreachable: Array<Service>,
  },
}

type GetGroupedRobotsMap = State => GroupedRobotsMap
type GetConnectableRobots = State => Array<Robot>
type GetReachableRobots = State => Array<ReachableRobot>
type GetUnreachableRobots = State => Array<UnreachableRobot>
type GetAllRobots = State => Array<AnyRobot>
type GetViewableRobots = State => Array<ViewableRobot>
type GetConnectedRobot = State => ?Robot

export const CONNECTABLE: ConnectableStatus = 'connectable'
export const REACHABLE: ReachableStatus = 'reachable'
export const UNREACHABLE: UnreachableStatus = 'unreachable'

const isResolved = (s: Service) =>
  s.ip != null && s.local != null && s.ok != null && s.serverOk != null

const isConnectable = (s: ResolvedRobot) => s.ok === true && s.health != null

const isReachable = (s: ResolvedRobot) =>
  s.advertising === true || s.serverOk === true

const maybeGetResolved = (service: Service): ?ResolvedRobot =>
  isResolved(service) ? (service: any) : null

const makeDisplayName = (service: Service): string =>
  service.name.replace('opentrons-', '')

// group services of each robot into connectable, reachable, and unconnectable
// sort order will be preserved from state (and therefore discovery-client),
// so the head of each group will be the most "desirable" option for that group
const getGroupedRobotsMap: GetGroupedRobotsMap = createSelector(
  state => state.discovery.robotsByName,
  robotsMap =>
    mapValues(robotsMap, services => {
      const servicesWithStatus = services.map(s => {
        const resolved = maybeGetResolved(s)
        const service = { ...s, displayName: makeDisplayName(s) }

        if (resolved) {
          if (isConnectable(resolved)) {
            return { ...service, status: CONNECTABLE }
          }
          if (isReachable(resolved)) return { ...service, status: REACHABLE }
        }
        return { ...service, status: UNREACHABLE }
      })

      return groupBy(servicesWithStatus, 'status')
    })
)

export function getScanning(state: State) {
  return state.discovery.scanning
}

export const getConnectableRobots: GetConnectableRobots = createSelector(
  getGroupedRobotsMap,
  getConnectedRobotName,
  (robotsMap, connectedName) =>
    map(robotsMap, g => head(g.connectable))
      .filter(Boolean)
      .map(r => ({ ...r, connected: r.name === connectedName }))
)

export const getReachableRobots: GetReachableRobots = createSelector(
  getGroupedRobotsMap,
  robotsMap =>
    filter(robotsMap, g => !g.connectable)
      .map(g => head(g.reachable))
      .filter(Boolean)
)

export const getUnreachableRobots: GetUnreachableRobots = createSelector(
  getGroupedRobotsMap,
  robotsMap => {
    const unreachableMap = pickBy(
      robotsMap,
      g => !g.connectable && !g.reachable
    )
    return map(unreachableMap, g => head(g.unreachable)).filter(Boolean)
  }
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
  robots => find(robots, 'connected')
)

export const getRobotByName = (
  state: State,
  robotName: string
): ViewableRobot | null => {
  return getViewableRobots(state).find(r => r.name === robotName) || null
}

export const getRobotApiVersion = (robot: AnyRobot): string | null =>
  (robot.health && semver.valid(robot.health.api_version)) ??
  (robot.serverHealth && semver.valid(robot.serverHealth.apiServerVersion)) ??
  null

export const getRobotFirmwareVersion = (robot: AnyRobot): string | null =>
  (robot.health && robot.health.fw_version) ??
  (robot.serverHealth && robot.serverHealth.smoothieVersion) ??
  null

export const getRobotProtocolApiVersion = (robot: AnyRobot): string | null => {
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
