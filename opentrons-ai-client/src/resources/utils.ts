/**
 * This function checks if the input string contains the word 'simulate'.
 * It uses a global, case-insensitive, multiline regular expression to search for the word.
 *
 * @param {string} input - The string to be tested.
 * @returns {boolean} - Returns true if 'simulate' is found in the input string, false otherwise.
 */

export const detectSimulate = (input: string): boolean => {
  const regex = /simulate/gim
  return regex.test(input)
}
