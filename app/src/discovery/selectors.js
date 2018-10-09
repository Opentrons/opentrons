// @flow
import filter from 'lodash/filter'
import groupBy from 'lodash/groupBy'
import head from 'lodash/head'
import map from 'lodash/map'
import mapValues from 'lodash/mapValues'
import pickBy from 'lodash/pickBy'
import {createSelector} from 'reselect'

import {selectors as robotSelectors} from '../robot'

import type {OutputSelector as Selector} from 'reselect'
import type {Service} from '@opentrons/discovery-client'
import type {State} from '../types'
import type {
  ResolvedRobot,
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

const isConnectable = (s: ResolvedRobot) => s.ok === true && s.health != null

const isReachable = (s: ResolvedRobot) =>
  s.advertising === true || s.serverOk === true

const maybeGetResolved = (service: Service): ?ResolvedRobot =>
  isResolved(service) ? (service: any) : null

// group services of each robot into connectable, reachable, and unconnectable
// sort order will be preserved from state (and therefore discovery-client),
// so the head of each group will be the most "desirable" option for that group
const getGroupedRobotsMap: GetGroupedRobotsMap = createSelector(
  state => state.discovery.robotsByName,
  robotsMap =>
    mapValues(robotsMap, services => {
      const servicesWithStatus = services.map(s => {
        const resolved = maybeGetResolved(s)
        if (resolved) {
          if (isConnectable(resolved)) return {...s, status: 'connectable'}
          if (isReachable(resolved)) return {...s, status: 'reachable'}
        }
        return {...s, status: 'unreachable'}
      })

      return groupBy(servicesWithStatus, 'status')
    })
)

export const getConnectableRobots: GetConnectableRobots = createSelector(
  getGroupedRobotsMap,
  robotSelectors.getConnectedRobotName,
  (robotsMap, connectedName) =>
    map(robotsMap, g => head(g.connectable))
      .filter(Boolean)
      .map(r => ({...r, connected: r.name === connectedName}))
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
