/**
 * Calculates the number of lines in a given string.
 * @param input - The string to calculate the number of lines for.
 * @returns The number of lines in the input string.
 */

export const calcTextAreaHeight = (input: string): number => {
  const rowsNum = input.split('\n').length
  return rowsNum
}
