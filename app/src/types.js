/* eslint-disable no-use-before-define */
// @flow
// application types
import type { Store as ReduxStore, Dispatch as ReduxDispatch } from 'redux'
import type { RouterState, RouterAction } from 'connected-react-router'
import type { Observable } from 'rxjs'

import type { RobotApiState, RobotApiAction } from './robot-api'
import type { State as HttpApiState, HttpApiAction } from './http-api-client'
import type { RobotState, Action as RobotAction } from './robot'
import type { ShellState, ShellAction } from './shell'
import type { Config, ConfigAction } from './config'
import type { DiscoveryState, DiscoveryAction } from './discovery'
import type { ProtocolState, ProtocolAction } from './protocol'
import type {
  CustomLabwareState,
  CustomLabwareAction,
} from './custom-labware/types'

export type State = $ReadOnly<{|
  robot: RobotState,
  api: HttpApiState,
  robotApi: RobotApiState,
  config: Config,
  discovery: DiscoveryState,
  labware: CustomLabwareState,
  protocol: ProtocolState,
  shell: ShellState,
  router: RouterState,
|}>

export type Action =
  | RobotAction
  | HttpApiAction
  | RobotApiAction
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
