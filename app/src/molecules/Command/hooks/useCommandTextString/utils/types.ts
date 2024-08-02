import type { RunTimeCommand } from '@opentrons/shared-data'
import type { GetCommandText } from '..'

export type HandlesCommands<T extends RunTimeCommand> = Omit<
  GetCommandText,
  'command'
> & { command: T }
