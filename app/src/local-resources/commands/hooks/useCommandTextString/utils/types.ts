import type { RunTimeCommand } from '@opentrons/shared-data'
import type { GetCommandText, UseCommandTextStringParams } from '..'

export type HandlesCommands<T extends RunTimeCommand> = Omit<
  GetCommandText,
  'command'
> &
  UseCommandTextStringParams & { command: T }
