// @flow
// robot discovery state
import groupBy from 'lodash/groupBy'
import map from 'lodash/map'
import {createSelector} from 'reselect'
import {getShellRobots} from '../shell'

import type {OutputSelector} from 'reselect'
import type {Service} from '@opentrons/discovery-client'
import type {State, Action, ThunkAction} from '../types'

type RobotsMap = {[name: string]: Array<Service>}

type DiscoveryState = {
  scanning: boolean,
  robotsByName: RobotsMap,
}

type StartAction = {|
  type: 'discovery:START',
  meta: {|shell: true|},
|}

type FinishAction = {|
  type: 'discovery:FINISH',
  meta: {|shell: true|},
|}

type UpdateListAction = {|
  type: 'discovery:UPDATE_LIST',
  payload: {|robots: Array<Service>|},
|}

export type UnreachableRobot = {
  name: string,
}

export type DiscoveryAction = StartAction | FinishAction | UpdateListAction

const DISCOVERY_TIMEOUT = 20000

export function startDiscovery (): ThunkAction {
  const start: StartAction = {type: 'discovery:START', meta: {shell: true}}
  const finish: FinishAction = {type: 'discovery:FINISH', meta: {shell: true}}

  return dispatch => {
    setTimeout(() => dispatch(finish), DISCOVERY_TIMEOUT)
    return dispatch(start)
  }
}

// TODO(mc, 2018-08-09): uncomment when we figure out how to get this
// to the app shell
// export function updateDiscoveryList (
//   robots: Array<Service>
// ): UpdateListAction {
//   return {type: 'discovery:UPDATE_LIST', payload: {robots}}
// }

export function getScanning (state: State) {
  return state.discovery.scanning
}

export function getDiscoveredRobotsByName (state: State) {
  return state.discovery.robotsByName
}

// TODO(mc, 2018-08-10): implement in favor of robotSelectors.getDiscovered
// export function getRobots (state: State) {
//
// }

type UnreachableSelector = OutputSelector<State, void, Array<UnreachableRobot>>

const serviceUnreachable = (service: Service) =>
  !service.ip || (!service.advertising && !service.ok && !service.serverOk)

const robotUnreachable = (robot: Array<Service>) =>
  robot.every(serviceUnreachable)

const makeUnreachableRobot = (robot: Array<Service>, name: string) =>
  robotUnreachable(robot) ? {name} : null

export const getUnreachableRobots: UnreachableSelector = createSelector(
  state => state.discovery.robotsByName,
  robotsByName => map(robotsByName, makeUnreachableRobot).filter(Boolean)
)

// getShellRobots makes a sync RPC call, so use sparingly
const initialState: DiscoveryState = {
  scanning: false,
  robotsByName: normalizeRobots(getShellRobots()),
}

export function discoveryReducer (
  state: DiscoveryState = initialState,
  action: Action
): DiscoveryState {
  switch (action.type) {
    case 'discovery:START':
      return {...state, scanning: true}

    case 'discovery:FINISH':
      return {...state, scanning: false}

    case 'discovery:UPDATE_LIST':
      return {
        ...state,
        robotsByName: normalizeRobots(action.payload.robots),
      }
  }

  return state
}

function normalizeRobots (robots: Array<Service> = []): RobotsMap {
  return groupBy(robots, 'name')
}
