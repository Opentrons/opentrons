import type {
  Liquid,
  LoadedLabware,
  LoadedModule,
  LoadedPipette,
} from '@opentrons/shared-data'
import type { RunCommandSummary, LabwareOffsetCreateData } from '../runs'

export const ENGINE_STATUS_IDLE = 'idle' as const
export const ENGINE_STATUS_RUNNING = 'running' as const
export const ENGINE_STATUS_PAUSE_REQUESTED = 'pause-requested' as const
export const ENGINE_STATUS_PAUSED = 'paused'
export const ENGINE_STATUS_STOP_REQUESTED = 'stop-requested' as const
export const ENGINE_STATUS_STOPPED = 'stopped' as const
export const ENGINE_STATUS_FAILED = 'failed' as const
export const ENGINE_STATUS_FINISHING = 'finishing' as const
export const ENGINE_STATUS_SUCCEEDED = 'succeeded' as const
export const ENGINE_STATUS_BLOCKED_BY_OPEN_DOOR = 'blocked-by-open-door' as const

export type EngineStatus =
  | typeof ENGINE_STATUS_IDLE
  | typeof ENGINE_STATUS_RUNNING
  | typeof ENGINE_STATUS_PAUSE_REQUESTED
  | typeof ENGINE_STATUS_PAUSED
  | typeof ENGINE_STATUS_STOP_REQUESTED
  | typeof ENGINE_STATUS_STOPPED
  | typeof ENGINE_STATUS_FAILED
  | typeof ENGINE_STATUS_FINISHING
  | typeof ENGINE_STATUS_SUCCEEDED
  | typeof ENGINE_STATUS_BLOCKED_BY_OPEN_DOOR

export interface MaintenanceRunData {
  id: string
  createdAt: string
  status: EngineStatus
  current: boolean
  actions: MaintenanceRunAction[]
  errors: MaintenanceRunError[]
  pipettes: LoadedPipette[]
  modules: LoadedModule[]
  labware: LoadedLabware[]
  liquids: Liquid[]
  completedAt?: string
  startedAt?: string
}

export interface MaintenanceRun {
  data: MaintenanceRunData
}

export const MAINTENANCE_RUN_ACTION_TYPE_PLAY: 'play' = 'play'
export const MAINTENANCE_RUN_ACTION_TYPE_PAUSE: 'pause' = 'pause'
export const MAINTENANCE_RUN_ACTION_TYPE_STOP: 'stop' = 'stop'

export type MaintenanceRunActionType =
  | typeof MAINTENANCE_RUN_ACTION_TYPE_PLAY
  | typeof MAINTENANCE_RUN_ACTION_TYPE_PAUSE
  | typeof MAINTENANCE_RUN_ACTION_TYPE_STOP

export interface MaintenanceRunAction {
  id: string
  createdAt: string
  actionType: MaintenanceRunActionType
}

export interface MaintenanceCreateRunActionData {
  actionType: MaintenanceRunActionType
}

export interface MaintenanceCommandData {
  data: RunCommandSummary
}

export interface MaintenanceRunError {
  id: string
  errorType: string
  createdAt: string
  detail: string
}

export interface CreateMaintenanceRunData {
  labwareOffsets?: LabwareOffsetCreateData[]
}

export interface LabwareDefinitionSummary {
  definitionUri: string
}
