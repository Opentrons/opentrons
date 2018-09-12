// @flow
// robot discovery state
import {getShellRobots} from '../shell'

import type {State, Action, ThunkAction} from '../types'
import type {DiscoveredRobot} from './types'

type RobotsMap = {[name: string]: DiscoveredRobot}

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
  payload: {|robots: Array<DiscoveredRobot>|},
|}

export * from './types'

export type DiscoveryAction = StartAction | FinishAction | UpdateListAction

const DISCOVERY_TIMEOUT = 15000

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
//   robots: Array<DiscoveredRobot>
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

function normalizeRobots (robots: Array<DiscoveredRobot> = []): RobotsMap {
  return robots.reduce(
    (robotsMap: RobotsMap, robot: DiscoveredRobot) => ({
      ...robotsMap,
      [robot.name]: robot,
    }),
    {}
  )
}
