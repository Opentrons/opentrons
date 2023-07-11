import type {
  LoadedLabware,
  LoadedModule,
  LoadedPipette,
  ModuleModel,
} from '@opentrons/shared-data'
import type { ResourceLink } from '../types'
import type { RunCommandSummary } from './commands/types'
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

export interface RunData {
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
  modules: LoadedModule[]
  protocolId?: string
  labwareOffsets?: LabwareOffset[]
}

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

export type RunActionType =
  | typeof RUN_ACTION_TYPE_PLAY
  | typeof RUN_ACTION_TYPE_PAUSE
  | typeof RUN_ACTION_TYPE_STOP

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
}
export interface LabwareOffsetCreateData {
  definitionUri: string
  location: LabwareOffsetLocation
  vector: VectorOffset
}

export interface CommandData {
  data: RunCommandSummary
}

export interface RunError {
  id: string
  errorType: string
  createdAt: string
  detail: string
}
