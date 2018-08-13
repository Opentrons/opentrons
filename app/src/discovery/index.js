// @flow
// robot discovery state
import type {Action, ThunkAction} from '../types'
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

  return dispatch => {
    dispatch(start)
    setTimeout(() => dispatch(finish), DISCOVERY_TIMEOUT)
  }
}

// TODO(mc, 2018-08-09): uncomment when we figure out how to get this
// to the app shell
// export function updateDiscoveryList (
//   robots: Array<DiscoveredRobot>
// ): UpdateListAction {
//   return {type: 'discovery:UPDATE_LIST', payload: {robots}}
// }

// TODO(mc, 2018-08-09): implement this reducer
export function discoveryReducer (
  state: DiscoveryState = {scanning: false, robotsByName: {}},
  action: Action
): DiscoveryState {
  switch (action.type) {
    case 'discovery:START': return state
    case 'discovery:FINISH': return state
    case 'discovery:UPDATE_LIST': return state
  }

  return state
}
