import type { WaitForResumeRunTimeCommand } from '@opentrons/shared-data/command'
import type { GetCommandText } from '..'

type GetWaitForResumeCommandText = Omit<GetCommandText, 'command'> & {
  command: WaitForResumeRunTimeCommand
}

export function getWaitForResumeCommandText({
  command,
  t,
}: GetWaitForResumeCommandText): string {
  return command.params?.message != null && command.params.message !== ''
    ? command.params.message
    : t('wait_for_resume')
}
