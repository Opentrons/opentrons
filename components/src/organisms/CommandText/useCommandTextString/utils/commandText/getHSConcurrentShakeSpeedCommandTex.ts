import type { HeaterShakerSetShakeSpeedRunTimeCommand } from '@opentrons/shared-data/command'
import type { HandlesCommands } from '../types'

export function getHSConcurrentShakeSpeedCommandText({
  command,
  t,
}: HandlesCommands<HeaterShakerSetShakeSpeedRunTimeCommand>): string {
  const { rpm } = command.params

  return t('set_hs_shake', { rpm })
}
