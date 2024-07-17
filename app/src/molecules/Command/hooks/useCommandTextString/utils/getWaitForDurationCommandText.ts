import type { WaitForDurationRunTimeCommand } from '@opentrons/shared-data/command'
import type { GetCommandText } from '..'

type GetWaitForDurationCommandText = Omit<GetCommandText, 'command'> & {
  command: WaitForDurationRunTimeCommand
}

export function getWaitForDurationCommandText({
  command,
  t,
}: GetWaitForDurationCommandText): string {
  const { seconds, message } = command.params

  return t('wait_for_duration', { seconds, message: message ?? '' })
}
