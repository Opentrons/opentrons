import { useTranslation } from 'react-i18next'

import type { RunTimeCommand } from '../../command/types'

//  these are the command categories we shouldn't expect to see in the run log
export const COMMANDS_WITHOUT_SUMMARIES = ['calibration', 'robot', 'unsafe']

//  returns a command type summary given a specifi commandType
export function useCommandTypeSummaries(
  commandType: RunTimeCommand['commandType']
): string {
  const { t } = useTranslation('command_type_summary')
  // example: aspirate -> [aspirate, undefined], heaterShaker/open -> [heaterShaker, open]
  const [command, commandSubtype] = commandType.split('/')
  const key = commandSubtype ? `${command}.${commandSubtype}` : command

  const fallback = 'Unknown'
  const translated = t(key, { defaultValue: fallback })
  if (
    translated === fallback &&
    !COMMANDS_WITHOUT_SUMMARIES.includes(command)
  ) {
    console.error(
      `i18n missing - Missing translation for commandType: ${commandType}`
    )
  }

  return translated
}
