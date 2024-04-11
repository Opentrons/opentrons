import type { RunTimeParameter } from '../types'
/**
 * Formats the runtime parameter's minimum and maximum values.
 *
 * @param {RunTimeParameter} runTimeParameter - The runtime parameter whose min and max values are to be formatted.
 *
 * @returns {string} The formatted min-max value of the runtime parameter.
 *
 * @example
 * const runTimeParameter = {
 *    value: 6.5,
 *   displayName: 'EtoH Volume',
 *     variableName: 'ETOH_VOLUME',
 *     description: '70% ethanol volume',
 *     type: 'float',
 *     suffix: 'mL',
 *     min: 1.5,
 *     max: 10.0,
 *     default: 6.5,
 * }
 * console.log(formatRunTimeParameterMinMax(runTimeParameter)); // "1.5-10.0"
 */

export const formatRunTimeParameterMinMax = (
  runTimeParameter: RunTimeParameter
): string => {
  const min = 'min' in runTimeParameter ? runTimeParameter.min : 0
  const max = 'max' in runTimeParameter ? runTimeParameter.max : 0
  return runTimeParameter.type === 'int'
    ? `${min}-${max}`
    : `${min.toFixed(1)}-${max.toFixed(1)}`
}
