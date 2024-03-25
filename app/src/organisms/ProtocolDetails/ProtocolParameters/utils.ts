import { useTranslation } from 'react-i18next'
import type { RunTimeParameter } from '@opentrons/shared-data'

export const formatRunTimeParameterValue = (
  runTimeParameter: RunTimeParameter,
  t: ReturnType<typeof useTranslation>['t']
): string => {
  const { type, default: defaultValue } = runTimeParameter
  const suffix =
    'suffix' in runTimeParameter && runTimeParameter.suffix != null
      ? runTimeParameter.suffix
      : null
  switch (type) {
    case 'int':
    case 'float':
      return suffix !== null
        ? `${defaultValue.toString()} ${suffix}`
        : defaultValue.toString()
    case 'boolean':
      return Boolean(defaultValue) ? t('on') : t('off')
    case 'str':
      if ('choices' in runTimeParameter && runTimeParameter.choices != null) {
        const choice = runTimeParameter.choices.find(
          choice => choice.value === defaultValue
        )
        if (choice != null) {
          return choice.displayName
        }
      }
      break
  }
  return ''
}
