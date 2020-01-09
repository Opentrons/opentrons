/* eslint-disable no-use-before-define */
// @flow
// application types
import type { Store as ReduxStore, Dispatch as ReduxDispatch } from 'redux'
import type { RouterState, RouterAction } from 'connected-react-router'
import type { Observable } from 'rxjs'

import type { RobotApiState } from './robot-api/types'
import type { RobotAdminState, RobotAdminAction } from './robot-admin/types'
import type {
  RobotControlsState,
  RobotControlsAction,
} from './robot-controls/types'
import type { BuildrootState, BuildrootAction } from './buildroot/types'
import type { PipettesState, PipettesAction } from './pipettes/types'
import type { ModulesState, ModulesAction } from './modules/types'
import type {
  State as SuperDeprecatedRobotApiState,
  HttpApiAction as SuperDeprecatedRobotApiAction,
} from './http-api-client'
import type { RobotState, Action as RobotAction } from './robot'
import type { ShellState, ShellAction } from './shell/types'
import type { Config as ConfigState, ConfigAction } from './config/types'
import type { DiscoveryState, DiscoveryAction } from './discovery/types'
import type { ProtocolState, ProtocolAction } from './protocol/types'
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
  robotApi: RobotApiState,
  robotAdmin: RobotAdminState,
  robotControls: RobotControlsState,
  robotSettings: RobotSettingsState,
  buildroot: BuildrootState,
  pipettes: PipettesState,
  modules: ModulesState,
  config: ConfigState,
  discovery: DiscoveryState,
  labware: CustomLabwareState,
  protocol: ProtocolState,
  shell: ShellState,
  router: RouterState,
|}>

export type Action =
  | RobotAction
  | SuperDeprecatedRobotApiAction
  | RobotAdminAction
  | RobotControlsAction
  | RobotSettingsAction
  | BuildrootAction
  | PipettesAction
  | ModulesAction
  | ShellAction
  | ConfigAction
  | RouterAction
  | DiscoveryAction
  | ProtocolAction
  | CustomLabwareAction

export type GetState = () => State

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

// DEPRECATED(mc, 2020-01-06): prefer StrictEpic
// regular, medium strict epic type
export type Epic = (
  action$: Observable<Action>,
  state$: Observable<State>
) => Observable<mixed>

// for when you need more strict epic typing
export type StrictEpic<R: Action = Action> = (
  action$: Observable<Action>,
  state$: Observable<State>
) => Observable<R>

// DEPRECATED(mc, 2020-01-06): this was a bad idea
// for when the strict typing of Action is too much
export type LooseEpic = (
  action$: Observable<{| type: string, payload: any, meta: any |}>,
  state$: Observable<State>
) => Observable<mixed>

export type Error = { name: string, message: string }
