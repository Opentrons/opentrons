// @flow
import concat from 'lodash/concat'
import filter from 'lodash/filter'
import find from 'lodash/find'
import get from 'lodash/get'
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

import type { OutputSelector as Selector } from 'reselect'
import type { Service } from '@opentrons/discovery-client'
import type { State } from '../types'
import type {
  ResolvedRobot,
  Robot,
  ReachableRobot,
  UnreachableRobot,
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

export type BuildrootStatus = 'balena' | 'migrating' | 'buildroot'

type GetGroupedRobotsMap = Selector<State, void, GroupedRobotsMap>
type GetConnectableRobots = Selector<State, void, Array<Robot>>
type GetReachableRobots = Selector<State, void, Array<ReachableRobot>>
type GetUnreachableRobots = Selector<State, void, Array<UnreachableRobot>>
type GetAllRobots = Selector<State, void, Array<AnyRobot>>
type GetLiveRobots = Selector<State, void, Array<Robot | ReachableRobot>>
type GetConnectedRobot = Selector<State, void, ?Robot>

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
  state => state.discovery.restartsByName,
  (robotsMap, restartsMap) =>
    mapValues(robotsMap, services => {
      const servicesWithStatus = services.map(s => {
        const resolved = maybeGetResolved(s)
        const service = {
          ...s,
          displayName: makeDisplayName(s),
          restartStatus: get(restartsMap, s.name, null),
        }

        if (resolved) {
          if (isConnectable(resolved))
            return { ...service, status: CONNECTABLE }
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

export const getLiveRobots: GetLiveRobots = createSelector(
  getConnectableRobots,
  getReachableRobots,
  concat
)

export const getConnectedRobot: GetConnectedRobot = createSelector(
  getConnectableRobots,
  robots => find(robots, 'connected')
)

export const getRobotApiVersion = (robot: AnyRobot): ?string =>
  (robot.health && semver.valid(robot.health.api_version)) ||
  (robot.serverHealth && semver.valid(robot.serverHealth.apiServerVersion))

export const getRobotFirmwareVersion = (robot: AnyRobot): ?string =>
  (robot.health && robot.health.fw_version) ||
  (robot.serverHealth && robot.serverHealth.smoothieVersion)

export const getRobotBuildrootStatus = (
  robot: AnyRobot
): BuildrootStatus | null => {
  if (robot.serverHealth) {
    // no capabilities object present, robot is on balena and not migration capable
    if (!robot.serverHealth.capabilities) {
      return 'balena'
    }
    // migration capable proceed to step 2 automatically
    if (
      robot.serverHealth.capabilities &&
      robot.serverHealth.capabilities['buildroot-migration']
    ) {
      return 'migrating'
    }
    // robot is already on buildroot and capable of receiving normal buidlroot updates
    if (
      robot.serverHealth.capabilities &&
      robot.serverHealth.capabilities['buildroot-update']
    ) {
      return 'buildroot'
    }
  }
  return null
}
