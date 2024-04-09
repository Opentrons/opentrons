import type { RunTimeParameter } from '../types'

export const formatRunTimeParameterDefaultValue = (
  runTimeParameter: RunTimeParameter,
  t?: any
): string => {
  const { type, default: defaultValue } = runTimeParameter
  const suffix =
    'suffix' in runTimeParameter && runTimeParameter.suffix != null
      ? runTimeParameter.suffix
      : null

  if ('choices' in runTimeParameter && runTimeParameter.choices != null) {
    const choice = runTimeParameter.choices.find(
      choice => choice.value === defaultValue
    )
    if (choice != null) {
      return suffix != null
        ? `${choice.displayName} ${suffix}`
        : choice.displayName
    }
  }

  switch (type) {
    case 'int':
    case 'float':
      return suffix !== null
        ? `${defaultValue.toString()} ${suffix}`
        : defaultValue.toString()
    case 'bool':
      if (t != null) {
        return Boolean(defaultValue) ? t('on') : t('off')
      } else {
        return Boolean(defaultValue) ? 'On' : 'Off'
      }
    default:
      break
  }
  return ''
}
