import type { RunTimeCommand } from '@opentrons/shared-data'

export interface GetCommandsParams {
  cursor: number | null // the index of the command at the center of the window
  pageLength: number // the number of items to include
}

// NOTE: this incantation allows us to omit a key from each item in a union distributively
// this means we can, for example, maintain the associated commandType and params after the Omit is applied
type DistributiveOmit<T, K extends keyof T> = T extends any ? Omit<T, K> : never
export type RunCommandSummary = DistributiveOmit<RunTimeCommand, 'result'>

export interface CommandDetail {
  data: RunTimeCommand
}

export interface CommandsLinks {
  current: {
    // link to the currently executing command
    href: string
    meta: {
      runId: string
      commandId: string
      key: string
      createdAt: string
      index: number
    }
  }
}

export interface CommandsData {
  data: RunCommandSummary[]
  meta: GetCommandsParams & { totalLength: number }
  links: CommandsLinks
}

export interface CreateCommandParams {
  waitUntilComplete?: boolean
  timeout?: number
}

export interface RunCommandError {
  id: string
  errorType: string
  createdAt: string
  detail: string
}
