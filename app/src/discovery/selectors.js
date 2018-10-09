// @flow
import filter from 'lodash/filter'
import groupBy from 'lodash/groupBy'
import head from 'lodash/head'
import map from 'lodash/map'
import mapValues from 'lodash/mapValues'
import pickBy from 'lodash/pickBy'
import {createSelector} from 'reselect'

import type {OutputSelector as Selector} from 'reselect'
import type {Service} from '@opentrons/discovery-client'
import type {State} from '../types'
import type {
  ResolvedService,
  Robot,
  ReachableRobot,
  UnreachableRobot,
} from './types'

type GroupedRobotsMap = {
  [name: string]: {
    connectable: Array<Robot>,
    reachable: Array<ReachableRobot>,
    unreachable: Array<Service>,
  },
}

type GetGroupedRobotsMap = Selector<State, void, GroupedRobotsMap>
type GetConnectableRobots = Selector<State, void, Array<Robot>>
type GetReachableRobots = Selector<State, void, Array<ReachableRobot>>
type GetUnreachableRobots = Selector<State, void, Array<UnreachableRobot>>

const isResolved = (s: Service) =>
  s.ip != null && s.local != null && s.ok != null && s.serverOk != null

const isConnectable = (s: ResolvedService) => s.ok === true && s.health != null

const isReachable = (s: ResolvedService) =>
  s.advertising === true || s.serverOk === true

const maybeGetResolved = (service: Service): ?ResolvedService =>
  isResolved(service) ? (service: any) : null

// group services of each robot into connectable, reachable, and unconnectable
// sort order will be preserved from state (and therefore discovery-client),
// so the head of each group will be the most "desirable" option for that group
const getGroupedRobotsMap: GetGroupedRobotsMap = createSelector(
  state => state.discovery.robotsByName,
  robotsMap =>
    mapValues(robotsMap, services =>
      groupBy(services, s => {
        const resolved = maybeGetResolved(s)
        if (resolved && isConnectable(resolved)) return 'connectable'
        if (resolved && isReachable(resolved)) return 'reachable'
        return 'unreachable'
      })
    )
)

export const getConnectableRobots: GetConnectableRobots = createSelector(
  getGroupedRobotsMap,
  robotsMap => map(robotsMap, g => head(g.connectable)).filter(Boolean)
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
