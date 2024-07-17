import type { CustomRunTimeCommand } from '@opentrons/shared-data/command'
import type { GetCommandText } from '..'

type GetCustomCommandText = Omit<GetCommandText, 'command'> & {
  command: CustomRunTimeCommand
}

export function getCustomCommandText({
  command,
}: GetCustomCommandText): string {
  const { legacyCommandText } = command.params ?? {}
  const sanitizedCommandText =
    typeof legacyCommandText === 'object'
      ? JSON.stringify(legacyCommandText)
      : String(legacyCommandText)

  return legacyCommandText != null
    ? sanitizedCommandText
    : `${command.commandType}: ${JSON.stringify(command.params)}`
}
