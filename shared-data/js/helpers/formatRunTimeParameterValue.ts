import type { RunTimeParameter } from '../types'

export const formatRunTimeParameterValue = (
  runTimeParameter: RunTimeParameter,
  t: any
): string => {
  const { type, value } = runTimeParameter
  const suffix =
    'suffix' in runTimeParameter && runTimeParameter.suffix != null
      ? runTimeParameter.suffix
      : null
  switch (type) {
    case 'int':
    case 'float':
      return suffix !== null
        ? `${value.toString()} ${suffix}`
        : value.toString()
    case 'bool': {
      return Boolean(value) ? t('on') : t('off')
    }
    case 'str':
      if ('choices' in runTimeParameter && runTimeParameter.choices != null) {
        const choice = runTimeParameter.choices.find(
          choice => choice.value === value
        )
        if (choice != null) {
          return choice.displayName
        }
      }
      break
  }
  return ''
}
