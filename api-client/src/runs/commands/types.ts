import type { RunTimeCommand } from '@opentrons/shared-data'
import type { RunCommandSummary } from '../types'

export interface GetCommandsParams {
  cursor: number | null // the index of the command at the center of the window
  before: number // the number of items before the cursor to include
  after: number // the number of items after the cursor to include
}

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
      index: number
    }
  }
}

export interface CommandsData {
  data: RunCommandSummary[]
  meta: GetCommandsParams & { total: number }
  links: CommandsLinks
}
