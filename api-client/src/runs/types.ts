import type { RunTimeCommand, ModuleModel } from '@opentrons/shared-data'
import type { ResourceLink } from '../types'

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
  current: boolean
  status: RunStatus
  actions: RunAction[]
  errors: Error[]
  pipettes: unknown[]
  labware: unknown[]
  protocolId?: string
  labwareOffsets?: LabwareOffset[]
}

export interface RunSummaryData {
  id: string
  createdAt: string
  current: boolean
  status: RunStatus
  protocolId?: string
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

export interface RunSummariesLinks {
  current?: ResourceLink
}

export interface RunSummaries {
  data: RunSummaryData[]
  links: RunSummariesLinks
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
export interface RunCommandSummary {
  id: string
  key: string
  commandType: RunTimeCommand['commandType']
  status: 'queued' | 'running' | 'succeeded' | 'failed'
  result?: any
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

export interface CommandsData {
  data: RunCommandSummary[]
}

export interface CommandDetail {
  data: RunTimeCommand
}

export interface Error {
  id: string
  errorType: string
  createdAt: string
  detail: string
}
