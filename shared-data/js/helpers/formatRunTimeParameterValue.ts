import type { RunTimeParameter } from '../types'

/**
 * Formats the runtime parameter value.
 *
 * @param {RunTimeParameter} runTimeParameter - The runtime parameter to be formatted.
 * @param {Function} t - A function for localization.
 *
 * @returns {string} The formatted runtime parameter value.
 *
 */

export const formatRunTimeParameterValue = (
  runTimeParameter: RunTimeParameter,
  t: any
): string => {
  const { type, value } = runTimeParameter
  const suffix =
    'suffix' in runTimeParameter && runTimeParameter.suffix != null
      ? runTimeParameter.suffix
      : null

  if ('choices' in runTimeParameter && runTimeParameter.choices != null) {
    const choice = runTimeParameter.choices.find(
      choice => choice.value === value
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
        ? `${value.toString()} ${suffix}`
        : value.toString()
    case 'bool': {
      return Boolean(value) ? t('on') : t('off')
    }
    default:
      break
  }
  return ''
}
