import type { SetStatusBarRunTimeCommand } from '@opentrons/shared-data'
import type { HandlesCommands } from '../types'

export function getSetStatusBarCommandText({
  command,
  t,
}: HandlesCommands<SetStatusBarRunTimeCommand>): string {
  const animation = t(command.params.animation)
  return t('set_status_bar', { animation })
}
