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
 * examples
 * [
      { displayName: '20', value: 20 },
      { displayName: '16', value: 16 },
    ]
    return 16, 20

    [
      { displayName: 'Single channel 50µL', value: 'flex_1channel_50' },
      { displayName: 'Eight Channel 50µL', value: 'flex_8channel_50' },
    ]
    return Eight Channel 50µL, Single channel 50µL
 */
export const orderRuntimeParameterRangeOptions = (
  choices: Choice[]
): string => {
  // when this function is called, the array length is always 2
  const displayNames = [choices[0].displayName, choices[1].displayName]
  if (isNumeric(displayNames[0])) {
    return displayNames
      .sort((a, b) => {
        const numA = Number(a)
        const numB = Number(b)
        return numA - numB
      })
      .join(', ')
  } else {
    return displayNames.sort().join(', ')
  }
}
