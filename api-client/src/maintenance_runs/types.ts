import type {
  Liquid,
  LoadedLabware,
  LoadedModule,
  LoadedPipette,
} from '@opentrons/shared-data'
import type {
  RunCommandSummary,
  LabwareOffsetCreateData,
  RunStatus,
} from '../runs'

export interface MaintenanceRunData {
  id: string
  createdAt: string
  status: RunStatus
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
