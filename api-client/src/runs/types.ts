import type {
  Liquid,
  LoadedLabware,
  LoadedModule,
  LoadedPipette,
  ModuleModel,
  RunCommandError,
  RunTimeCommand,
  RunTimeParameter,
} from '@opentrons/shared-data'
import type { ResourceLink, ErrorDetails } from '../types'
export * from './commands/types'

export const RUN_STATUS_IDLE = 'idle' as const
export const RUN_STATUS_RUNNING = 'running' as const
export const RUN_STATUS_PAUSE_REQUESTED = 'pause-requested' as const
export const RUN_STATUS_PAUSED = 'paused'
export const RUN_STATUS_STOP_REQUESTED = 'stop-requested' as const
export const RUN_STATUS_STOPPED = 'stopped' as const
export const RUN_STATUS_FAILED = 'failed' as const
export const RUN_STATUS_FINISHING = 'finishing' as const
export const RUN_STATUS_SUCCEEDED = 'succeeded' as const
export const RUN_STATUS_BLOCKED_BY_OPEN_DOOR = 'blocked-by-open-door' as const
export const RUN_STATUS_AWAITING_RECOVERY = 'awaiting-recovery' as const

export type RunStatus =
  | typeof RUN_STATUS_IDLE
  | typeof RUN_STATUS_RUNNING
  | typeof RUN_STATUS_PAUSE_REQUESTED
  | typeof RUN_STATUS_PAUSED
  | typeof RUN_STATUS_STOP_REQUESTED
  | typeof RUN_STATUS_STOPPED
  | typeof RUN_STATUS_FAILED
  | typeof RUN_STATUS_FINISHING
  | typeof RUN_STATUS_SUCCEEDED
  | typeof RUN_STATUS_BLOCKED_BY_OPEN_DOOR
  | typeof RUN_STATUS_AWAITING_RECOVERY

export interface LegacyGoodRunData {
  id: string
  createdAt: string
  completedAt?: string
  startedAt?: string
  current: boolean
  status: RunStatus
  actions: RunAction[]
  errors: RunError[]
  pipettes: LoadedPipette[]
  labware: LoadedLabware[]
  liquids: Liquid[]
  modules: LoadedModule[]
  protocolId?: string
  labwareOffsets?: LabwareOffset[]
  runTimeParameters: RunTimeParameter[]
}

export interface KnownGoodRunData extends LegacyGoodRunData {
  ok: true
}

export interface KnownInvalidRunData extends LegacyGoodRunData {
  ok: false
  dataError: ErrorDetails
}

export type GoodRunData = KnownGoodRunData | LegacyGoodRunData

export type RunData = GoodRunData | KnownInvalidRunData

export interface VectorOffset {
  x: number
  y: number
  z: number
}
export interface LabwareOffset {
  id: string
  createdAt: string
  definitionUri: string
  location: LabwareOffsetLocation
  vector: VectorOffset
}

export interface Run {
  data: RunData
}

export interface RunsLinks {
  current?: ResourceLink
}

export interface GetRunsParams {
  pageLength?: number // the number of items to include
}

export interface Runs {
  data: RunData[]
  links: RunsLinks
}

export const RUN_ACTION_TYPE_PLAY: 'play' = 'play'
export const RUN_ACTION_TYPE_PAUSE: 'pause' = 'pause'
export const RUN_ACTION_TYPE_STOP: 'stop' = 'stop'
export const RUN_ACTION_TYPE_RESUME_FROM_RECOVERY: 'resume-from-recovery' =
  'resume-from-recovery'

export type RunActionType =
  | typeof RUN_ACTION_TYPE_PLAY
  | typeof RUN_ACTION_TYPE_PAUSE
  | typeof RUN_ACTION_TYPE_STOP
  | typeof RUN_ACTION_TYPE_RESUME_FROM_RECOVERY

export interface RunAction {
  id: string
  createdAt: string
  actionType: RunActionType
}

export interface CreateRunActionData {
  actionType: RunActionType
}

export interface LabwareOffsetLocation {
  slotName: string
  moduleModel?: ModuleModel
  definitionUri?: string
}
export interface LabwareOffsetCreateData {
  definitionUri: string
  location: LabwareOffsetLocation
  vector: VectorOffset
}

type FileRunTimeParameterCreateData = Record<string, string | number | boolean>

type ValueRunTimeParameterCreateData = Record<string, { id: string }>

export type RunTimeParameterCreateData =
  | FileRunTimeParameterCreateData
  | ValueRunTimeParameterCreateData

export interface CommandData {
  data: RunTimeCommand
}

// Although run errors are semantically different from command errors,
// the server currently happens to use the exact same model for both.
export type RunError = RunCommandError
