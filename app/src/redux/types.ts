// application types
import type { RouterAction } from 'connected-react-router'
import type { Dispatch as ReduxDispatch, Store as ReduxStore } from 'redux'
import type { Observable } from 'rxjs'
import type { AlertsAction, AlertsState } from './alerts/types'
import type { AnalyticsTriggerAction } from './analytics/types'
import type { AuditAction, AuditState } from './audit'
import type { CalibrationAction, CalibrationState } from './calibration/types'
import type { ConfigAction, ConfigState } from './config/types'
import type {
  AddCustomLabwareFromCreatorAction,
  CustomLabwareAction,
  CustomLabwareState,
} from './custom-labware/types'
import type { DiscoveryAction, DiscoveryState } from './discovery/types'
import type { ProtocolAnalysisAction } from './protocol-analysis'
import type { ProtocolRunAction, ProtocolRunState } from './protocol-runs/types'
import type {
  ProtocolStorageAction,
  ProtocolStorageState,
} from './protocol-storage/types'
import type { RobotAdminAction, RobotAdminState } from './robot-admin/types'
import type { RobotApiAction, RobotApiState } from './robot-api/types'
import type { RobotAuthAction, RobotAuthState } from './robot-auth'
import type { RobotUpdateAction, RobotUpdateState } from './robot-update/types'
import type { SessionsAction, SessionState } from './sessions/types'
import type {
  ShellAction,
  ShellState,
  StepDetailViewerUpdateAction,
} from './shell/types'
import type { SystemInfoAction, SystemInfoState } from './system-info/types'

export interface State {
  readonly audit: AuditState
  readonly robotApi: RobotApiState
  readonly robotAuth: RobotAuthState
  readonly robotAdmin: RobotAdminState
  readonly robotUpdate: RobotUpdateState
  readonly config: ConfigState
  readonly discovery: DiscoveryState
  readonly labware: CustomLabwareState
  readonly shell: ShellState
  readonly systemInfo: SystemInfoState
  readonly alerts: AlertsState
  readonly sessions: SessionState
  readonly calibration: CalibrationState
  readonly protocolStorage: ProtocolStorageState
  readonly protocolRuns: ProtocolRunState
}

export type Action =
  | AuditAction
  | RobotApiAction
  | RobotAdminAction
  | RobotAuthAction
  | RobotUpdateAction
  | ShellAction
  | ConfigAction
  | RouterAction
  | DiscoveryAction
  | ProtocolAnalysisAction
  | ProtocolStorageAction
  | CustomLabwareAction
  | SystemInfoAction
  | AlertsAction
  | SessionsAction
  | CalibrationAction
  | AnalyticsTriggerAction
  | AddCustomLabwareFromCreatorAction
  | ProtocolRunAction
  | StepDetailViewerUpdateAction

export type GetState = () => State

export type ThunkAction =
  | ((dispatch: Dispatch, getState: GetState) => Action)
  | ((dispatch: Dispatch, getState: GetState) => void)

export type ThunkPromiseAction = (
  dispatch: Dispatch,
  getState: GetState
) => Promise<Action | null | undefined>

export type Store = ReduxStore<State, Action>

export type Dispatch = PlainDispatch & ThunkDispatch & ThunkPromiseDispatch

export type Middleware = (s: MwStore) => (n: PlainDispatch) => PlainDispatch

interface MwStore {
  getState: GetState
  dispatch: Dispatch
}

type PlainDispatch = ReduxDispatch<Action>

type ThunkDispatch = (thunk: ThunkAction) => Action | null | undefined

type ThunkPromiseDispatch = (
  thunk: ThunkPromiseAction
) => Promise<Action | null | undefined>

export type Epic = (
  action$: Observable<Action>,
  state$: Observable<State>
) => Observable<Action>

export type Error = Partial<{ name: string; message: string }>

export * from './shell/types'
