import type { HandlesCommands } from '../types'
import type { WaitForDurationRunTimeCommand } from '@opentrons/shared-data/command'

export function getWaitForDurationCommandText({
  command,
  t,
}: HandlesCommands<WaitForDurationRunTimeCommand>): string {
  const { seconds, message } = command.params

  return t('wait_for_duration', { seconds, message: message ?? '' })
}
