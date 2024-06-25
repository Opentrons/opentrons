import type { ValueRunTimeParameter } from '../types'

/**
 * Formats the runtime parameter's default value.
 *
 * @param {RunTimeParameter} runTimeParameter - The runtime parameter whose default value is to be formatted.
 * @param {Function} [t] - An optional function for localization.
 *
 * @returns {string} The formatted default value of the runtime parameter.
 *
 */

export const formatRunTimeParameterDefaultValue = (
  runTimeParameter: ValueRunTimeParameter,
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
