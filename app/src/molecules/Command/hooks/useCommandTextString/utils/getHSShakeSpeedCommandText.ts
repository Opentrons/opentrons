import type { HeaterShakerSetAndWaitForShakeSpeedRunTimeCommand } from '@opentrons/shared-data/command'
import type { GetCommandText } from '..'

type GetHSShakeSpeedCommandText = Omit<GetCommandText, 'command'> & {
  command: HeaterShakerSetAndWaitForShakeSpeedRunTimeCommand
}

export function getHSShakeSpeedCommandText({
  command,
  t,
}: GetHSShakeSpeedCommandText): string {
  const { rpm } = command.params

  return t('set_and_await_hs_shake', { rpm })
}
