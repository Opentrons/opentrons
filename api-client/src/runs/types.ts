export type RunStatus =
  | 'ready-to-run'
  | 'running'
  | 'pause-requested'
  | 'paused'
  | 'stop-requested'
  | 'stopped'
  | 'failed'
  | 'succeeded'

export interface RunData {
  id: string
  createdAt: string
  status: RunStatus
  createParams: { protocolId: string }
  actions: RunAction[]
  // TODO(bh, 10-29-2021): types for commands, pipettes, labware
  commands: unknown[]
  pipettes: unknown[]
  labware: unknown[]
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
