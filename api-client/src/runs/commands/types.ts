import type { RunTimeCommand, RunCommandError } from '@opentrons/shared-data'

export interface GetCommandsParams {
  cursor: number | null // the index of the command at the center of the window
  pageLength: number // the number of items to include
}

export interface GetRunCommandsParams extends GetCommandsParams {
  includeFixitCommands?: boolean
}

export interface GetRunCommandsParamsRequest extends GetCommandsParams {
  includeFixitCommands: boolean | null
}

export interface RunCommandErrors {
  data: RunCommandError[]
  meta: GetCommandsParams & { totalLength: number }
}

// NOTE: this incantation allows us to omit a key from each item in a union distributively
// this means we can, for example, maintain the associated commandType and params after the Omit is applied
type DistributiveOmit<T, K extends keyof T> = T extends any ? Omit<T, K> : never
export type RunCommandSummary = DistributiveOmit<RunTimeCommand, 'result'>

export interface CommandDetail {
  data: RunTimeCommand
}

export interface CommandsLinks {
  current?: CommandsLink | null
  currentlyRecoveringFrom?: CommandsLink | null
}

interface CommandsLink {
  href: string
  meta: {
    runId: string
    commandId: string
    key: string
    createdAt: string
    index: number
  }
}

export interface CommandsData {
  data: RunCommandSummary[]
  meta: GetCommandsParams & { totalLength: number }
  links: CommandsLinks
}

export interface CommandsAsPreSerializedListData {
  data: string[]
  meta: GetCommandsParams & { totalLength: number }
  links: CommandsLinks
}

export interface CreateCommandParams {
  waitUntilComplete?: boolean
  timeout?: number
  failedCommandId?: string
}
