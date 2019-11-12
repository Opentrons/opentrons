/* eslint-disable no-use-before-define */
// @flow
// application types
import type { Store as ReduxStore, Dispatch as ReduxDispatch } from 'redux'
import type { RouterState, RouterAction } from 'connected-react-router'
import type { Observable } from 'rxjs'

import type {
  DeprecatedRobotApiState,
  DeprecatedRobotApiAction,
} from './robot-api/types'
import type { RobotAdminState, RobotAdminAction } from './robot-admin/types'
import type {
  State as SuperDeprecatedRobotApiState,
  HttpApiAction as SuperDeprecatedRobotApiAction,
} from './http-api-client'
import type { RobotState, Action as RobotAction } from './robot'
import type { ShellState, ShellAction } from './shell/types'
import type { Config, ConfigAction } from './config/types'
import type { DiscoveryState, DiscoveryAction } from './discovery/types'
import type { ProtocolState, ProtocolAction } from './protocol'
import type {
  CustomLabwareState,
  CustomLabwareAction,
} from './custom-labware/types'

import type {
  RobotSettingsState,
  RobotSettingsAction,
} from './robot-settings/types'

export type State = $ReadOnly<{|
  robot: RobotState,
  superDeprecatedRobotApi: SuperDeprecatedRobotApiState,
  deprecatedRobotApi: DeprecatedRobotApiState,
  robotAdmin: RobotAdminState,
  robotSettings: RobotSettingsState,
  config: Config,
  discovery: DiscoveryState,
  labware: CustomLabwareState,
  protocol: ProtocolState,
  shell: ShellState,
  router: RouterState,
|}>

export type Action =
  | RobotAction
  | SuperDeprecatedRobotApiAction
  | DeprecatedRobotApiAction
  | RobotAdminAction
  | RobotSettingsAction
  | ShellAction
  | ConfigAction
  | RouterAction
  | DiscoveryAction
  | ProtocolAction
  | CustomLabwareAction

export type ActionLike = {| type: string, payload: any, meta: any |}

export type GetState = () => State

export type ActionType = $PropertyType<Action, 'type'>

export type ThunkAction = (Dispatch, GetState) => ?Action

export type ThunkPromiseAction = (Dispatch, GetState) => Promise<?Action>

export type Store = ReduxStore<State, Action>

export type Dispatch = PlainDispatch & ThunkDispatch & ThunkPromiseDispatch

export type Middleware = (s: MwStore) => (n: PlainDispatch) => PlainDispatch

type MwStore = {
  getState: GetState,
  dispatch: Dispatch,
}

type PlainDispatch = ReduxDispatch<Action>

type ThunkDispatch = (thunk: ThunkAction) => ?Action

type ThunkPromiseDispatch = (thunk: ThunkPromiseAction) => Promise<?Action>

export type Epic = (
  action$: Observable<Action>,
  state$: Observable<State>
) => Observable<mixed>

// for when the strict typing of Action is too much
export type LooseEpic = (
  action$: Observable<ActionLike>,
  state$: Observable<State>
) => Observable<mixed>

export type Error = { name: string, message: string }
