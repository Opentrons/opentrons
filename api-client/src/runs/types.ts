export const RUN_STATUS_READY_TO_RUN: 'ready-to-run' = 'ready-to-run'
export const RUN_STATUS_RUNNING: 'running' = 'running'
export const RUN_STATUS_PAUSE_REQUESTED: 'pause-requested' = 'pause-requested'
export const RUN_STATUS_PAUSED: 'paused' = 'paused'
export const RUN_STATUS_STOP_REQUESTED: 'stop-requested' = 'stop-requested'
export const RUN_STATUS_STOPPED: 'stopped' = 'stopped'
export const RUN_STATUS_FAILED: 'failed' = 'failed'
export const RUN_STATUS_SUCCEEDED: 'succeeded' = 'succeeded'

export type RunStatus =
  | typeof RUN_STATUS_READY_TO_RUN
  | typeof RUN_STATUS_RUNNING
  | typeof RUN_STATUS_PAUSE_REQUESTED
  | typeof RUN_STATUS_PAUSED
  | typeof RUN_STATUS_STOP_REQUESTED
  | typeof RUN_STATUS_STOPPED
  | typeof RUN_STATUS_FAILED
  | typeof RUN_STATUS_SUCCEEDED

export interface RunData {
  id: string
  createdAt: string
  status: RunStatus
  actions: RunAction[]
  // TODO(bh, 10-29-2021): types for commands, pipettes, labware
  commands: unknown[]
  pipettes: unknown[]
  labware: unknown[]
  protocolId?: string
}

interface ResourceLink {
  href: string
  meta?: Partial<{ [key: string]: string | null | undefined }>
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
  commandType: string
  status: 'queued' | 'running' | 'succeeded' | 'failed'
}

export interface Command {
  data: RunCommandSummary
  links?: ResourceLinks
}

export interface Commands {
  data: RunCommandSummary[]
  links?: ResourceLinks
}
