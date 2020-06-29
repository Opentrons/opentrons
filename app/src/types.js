/* eslint-disable no-use-before-define */
// @flow
// application types
import type { RouterAction, RouterState } from 'connected-react-router'
import type { Dispatch as ReduxDispatch, Store as ReduxStore } from 'redux'
import type { Observable } from 'rxjs'

import type { AlertsAction, AlertsState } from './alerts/types'
import type { BuildrootAction, BuildrootState } from './buildroot/types'
import type { CalibrationAction, CalibrationState } from './calibration/types'
import type { ConfigAction, ConfigState } from './config/types'
import type {
  CustomLabwareAction,
  CustomLabwareState,
} from './custom-labware/types'
import type { DiscoveryAction, DiscoveryState } from './discovery/types'
import type {
  HttpApiAction as SuperDeprecatedRobotApiAction,
  State as SuperDeprecatedRobotApiState,
} from './http-api-client'
import type { ModulesAction, ModulesState } from './modules/types'
import type { NetworkingAction, NetworkingState } from './networking/types'
import type { PipettesAction, PipettesState } from './pipettes/types'
import type { ProtocolAction, ProtocolState } from './protocol/types'
import type { Action as RobotAction, RobotState } from './robot'
import type { RobotAdminAction, RobotAdminState } from './robot-admin/types'
import type { RobotApiAction, RobotApiState } from './robot-api/types'
import type {
  RobotControlsAction,
  RobotControlsState,
} from './robot-controls/types'
import type {
  RobotSettingsAction,
  RobotSettingsState,
} from './robot-settings/types'
import type { SessionsAction, SessionState } from './sessions/types'
import type { ShellAction, ShellState } from './shell/types'
import type { SystemInfoAction, SystemInfoState } from './system-info/types'

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
  networking: NetworkingState,
  labware: CustomLabwareState,
  protocol: ProtocolState,
  shell: ShellState,
  systemInfo: SystemInfoState,
  alerts: AlertsState,
  sessions: SessionState,
  calibration: CalibrationState,
  router: RouterState,
|}>

export type Action =
  | RobotAction
  | SuperDeprecatedRobotApiAction
  | RobotApiAction
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
  | NetworkingAction
  | SystemInfoAction
  | AlertsAction
  | SessionsAction
  | CalibrationAction

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

export type Epic = (
  action$: Observable<Action>,
  state$: Observable<State>
) => Observable<Action>

export type Error = { name?: string, message?: string, ... }
