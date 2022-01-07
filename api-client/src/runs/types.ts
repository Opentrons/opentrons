import type {
  Command as FullCommand,
  ModuleModel,
} from '@opentrons/shared-data'

export const RUN_STATUS_IDLE: 'idle' = 'idle'
export const RUN_STATUS_RUNNING: 'running' = 'running'
export const RUN_STATUS_PAUSE_REQUESTED: 'pause-requested' = 'pause-requested'
export const RUN_STATUS_PAUSED: 'paused' = 'paused'
export const RUN_STATUS_STOP_REQUESTED: 'stop-requested' = 'stop-requested'
export const RUN_STATUS_STOPPED: 'stopped' = 'stopped'
export const RUN_STATUS_FAILED: 'failed' = 'failed'
export const RUN_STATUS_FINISHING: 'finishing' = 'finishing'
export const RUN_STATUS_SUCCEEDED: 'succeeded' = 'succeeded'

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

export interface RunData {
  id: string
  createdAt: string
  status: RunStatus
  actions: RunAction[]
  commands: RunCommandSummary[]
  errors: Error[]
  pipettes: unknown[]
  labware: unknown[]
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

interface ResourceLink {
  href: string
  meta?: Partial<{ [key: string]: string | null | undefined }> | null
}

type ResourceLinks = Record<string, ResourceLink | string | null | undefined>

export interface Run {
  data: RunData
  links?: ResourceLinks
}

export interface Runs {
  data: RunData[]
  links?: ResourceLinks
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
  commandType: FullCommand['commandType']
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
  links?: ResourceLinks
}

export interface CommandsData {
  data: RunCommandSummary[]
  links?: ResourceLinks
}

export interface CommandDetail {
  data: FullCommand
  links: ResourceLinks | null
}

export interface Error {
  id: string
  errorType: string
  createdAt: string
  detail: string
}
