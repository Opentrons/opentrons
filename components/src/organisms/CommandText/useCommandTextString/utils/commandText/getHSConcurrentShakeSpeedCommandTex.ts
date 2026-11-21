import type { HeaterShakerSetShakeSpeedRunTimeCommand } from '@opentrons/shared-data'
import type { HandlesCommands } from '../types'

export function getHSConcurrentShakeSpeedCommandText({
  command,
  t,
}: HandlesCommands<HeaterShakerSetShakeSpeedRunTimeCommand>): string {
  const { rpm } = command.params

  return t('set_hs_shake', { rpm })
}
