import type {
  Failed,
  RunCommandError,
  RunTimeCommand,
} from '@opentrons/shared-data'

export interface GetCommandsParams {
  pageLength: number // the number of items to include
  cursor?: number
}

export interface GetRunCommandsParams extends GetCommandsParams {
  includeFixitCommands?: boolean
}

export interface GetRunCommandsParamsRequest extends GetCommandsParams {
  includeFixitCommands?: boolean
}

export interface RunCommandErrors {
  data: RunCommandError[]
  meta: GetCommandsParams & { totalLength: number }
}

// NOTE: this incantation allows us to omit a key from each item in a union distributively
// this means we can, for example, maintain the associated commandType and params after the Omit is applied
type DistributiveFailed<CommandT> = CommandT extends RunTimeCommand
  ? Failed<CommandT>
  : never
export type RunCommandSummary = DistributiveFailed<RunTimeCommand>

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
