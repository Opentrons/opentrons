export const RUN_TYPE_BASIC: 'basic' = 'basic'
export const RUN_TYPE_PROTOCOL: 'protocol' = 'protocol'

export type RunType = typeof RUN_TYPE_BASIC | typeof RUN_TYPE_PROTOCOL

export const EVENT_SOURCE_SESSION_COMMAND: 'sessionCommand' = 'sessionCommand'
export const EVENT_SOURCE_PROTOCOL: 'protocol' = 'protocol'

type EventSource =
  | typeof EVENT_SOURCE_SESSION_COMMAND
  | typeof EVENT_SOURCE_PROTOCOL

interface Event {
  source: EventSource
  event: string
  timestamp: string
  commandId?: string
  params?: Record<string, unknown>
  result?: string
}

// TODO: IMMEDIATELY replace with real status enum type from server run status
export type RunStatus =
  | 'loaded'
  | 'running'
  | 'paused'
  | 'finished'
  | 'canceled'
  | undefined

export interface BasicRun {
  id: string
  createdAt: string
  details: Record<string, unknown>
  runType: typeof RUN_TYPE_BASIC
  createParams?: Record<string, unknown>
}

export interface ProtocolRun {
  id: string
  createdAt: string
  details: {
    protocolId: string
    currentState?: RunStatus
    events: readonly Event[]
  }
  runType: typeof RUN_TYPE_PROTOCOL
  createParams: { protocolId: string }
}

export type RunData = BasicRun | ProtocolRun

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
