import type { Choice } from '../types'

export const isNumeric = (str: string): boolean => {
  return !isNaN(Number(str))
}

/**
 * This function sorts an array of strings in numerical and alphabetical order.
 * @param {Choice[]} - The array of Choice
 * Choice is an object like {displayName: 'Single channel 50µL', value: 'flex_1channel_50' }
 * @returns {string} The ordered string with ","
 *
 * @example
 * const numChoices = [
 *    { displayName: '20', value: 20 },
 *    { displayName: '16', value: 16 },
 * ]
 * console.log(orderRuntimeParameterRangeOptions(numChoices) // 16,20
 *
 */
export const orderRuntimeParameterRangeOptions = (
  choices: Choice[]
): string => {
  // when this function is called, the array length is always in [1,2]
  if (choices.length > 2) {
    console.error(
      `expected to have length [1,2] but has length ${choices.length}`
    )
    return ''
  }
  const displayNames = choices.map(({ displayName }) => displayName)
  if (isNumeric(displayNames[0])) {
    return displayNames
      .sort((a, b) => {
        const numA = Number(a)
        const numB = Number(b)
        return numA - numB
      })
      .join(', ')
  } else {
    return displayNames.join(', ')
  }
}
