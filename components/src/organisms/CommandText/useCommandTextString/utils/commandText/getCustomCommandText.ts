import type { HandlesCommands } from '../types'
import type { CustomRunTimeCommand } from '@opentrons/shared-data/command'

export function getCustomCommandText({
  command,
}: HandlesCommands<CustomRunTimeCommand>): string {
  const { legacyCommandText } = command.params ?? {}
  const sanitizedCommandText =
    typeof legacyCommandText === 'object'
      ? JSON.stringify(legacyCommandText)
      : String(legacyCommandText)

  return legacyCommandText != null
    ? sanitizedCommandText
    : `${command.commandType}: ${JSON.stringify(command.params)}`
}
