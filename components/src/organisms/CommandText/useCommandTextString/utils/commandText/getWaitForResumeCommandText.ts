import type { WaitForResumeRunTimeCommand } from '@opentrons/shared-data'
import type { HandlesCommands } from '../types'

export function getWaitForResumeCommandText({
  command,
  t,
}: HandlesCommands<WaitForResumeRunTimeCommand>): string {
  return command.params?.message != null && command.params.message !== ''
    ? command.params.message
    : t('wait_for_resume')
}
