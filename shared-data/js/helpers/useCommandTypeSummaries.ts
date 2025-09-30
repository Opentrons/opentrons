import { useTranslation } from 'react-i18next'

import type { RunTimeCommand } from '../../command/types'

//  returns a command type summary given a specifi commandType
export function useCommandTypeSummaries(
  commandType?: RunTimeCommand['commandType']
): string {
  const { t } = useTranslation('command_type_summary')
  const fallback = 'Unknown'
  if (commandType == null) {
    return fallback
  }

  const translated = t(commandType, { defaultValue: fallback })
  if (translated === fallback) {
    console.error(
      `i18n missing - Missing translation for commandType: ${commandType}`
    )
  }

  return translated
}
