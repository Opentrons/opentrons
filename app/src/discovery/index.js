// @flow
// robot discovery state
import type {State, Action, ThunkAction} from '../types'
import type {RobotService} from '../robot'
import type {DiscoveredRobot} from './types'

type DiscoveryState = {
  scanning: boolean,
  robotsByName: {[name: string]: DiscoveredRobot}
}

type StartAction = {|
  type: 'discovery:START',
  meta: {| shell: true |},
|}

type FinishAction = {|
  type: 'discovery:FINISH',
  meta: {| shell: true |},
|}

type UpdateListAction = {|
  type: 'discovery:UPDATE_LIST',
  payload: {| robots: Array<DiscoveredRobot> |},
|}

export type DiscoveryAction =
  | StartAction
  | FinishAction
  | UpdateListAction

const DISCOVERY_TIMEOUT = 30000

export function startDiscovery (): ThunkAction {
  const start: StartAction = {type: 'discovery:START', meta: {shell: true}}
  const finish: FinishAction = {type: 'discovery:FINISH', meta: {shell: true}}

  return (dispatch, getState) => {
    // TODO(mc, 2018-08-10): remove legacy discovery
    if (!getState().config.discovery.enabled) {
      return dispatch({type: 'robot:DISCOVER', meta: {robotCommand: true}})
    }

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

// TODO(mc, 2018-08-10): implement
// export function getRobots (state: State) {
//
// }

// TODO(mc, 2018-08-09): implement this reducer
export function discoveryReducer (
  state: DiscoveryState = {scanning: false, robotsByName: {}},
  action: Action
): DiscoveryState {
  switch (action.type) {
    // TODO(mc, 2018-08-10): remove robot:DISCOVER
    case 'robot:DISCOVER':
    case 'discovery:START':
      return {...state, scanning: true}

    // TODO(mc, 2018-08-10): remove robot:DISCOVER_FINISH
    case 'robot:DISCOVER_FINISH':
    case 'discovery:FINISH':
      return {...state, scanning: false}

    // TODO(mc, 2018-08-10): remove robot:ADD_DISCOVERED
    case 'robot:ADD_DISCOVERED':
      return {
        ...state,
        robotsByName: {
          ...state.robotsByName,
          [action.payload.name]: robotServiceToDiscoveredRobot(action.payload, true)
        }
      }

    // TODO(mc, 2018-08-10): remove robot:REMOVE_DISCOVERED
    case 'robot:REMOVE_DISCOVERED':
      return {
        ...state,
        robotsByName: {
          ...state.robotsByName,
          [action.payload.name]: robotServiceToDiscoveredRobot(action.payload, false)
        }
      }

    case 'discovery:UPDATE_LIST':
      return {
        ...state,
        robotsByName: action.payload.robots.reduce((robotsMap, robot) => ({
          ...robotsMap,
          [robot.name]: robot
        }), {})
      }
  }

  return state
}

// TODO(mc, 2018-08-10): remove this function when no longer needed
function robotServiceToDiscoveredRobot (
  robot: RobotService,
  ok: boolean
): DiscoveredRobot {
  return {
    name: robot.name,
    connections: [
      {ip: robot.ip, port: robot.port, local: !!robot.wired, ok}
    ]
  }
}
