/**
 * Truncate a long string to display it
 * @example
 * truncateString('Illumina DNA Prep with Enrichment: Part 1 - Tagmentation, Clean Up, Amplify Tagmlo1234567ted', 88, 66);
 * Illumina DNA Prep with Enrichment: Part 1 - Tagmentation, Clean Up...fy Tagmlo1234567ted
 *
 * @param {string} text - A string param
 * @param {number} maxLength - A maximum length of display
 * @param {number} breakPoint - Optional A point to insert three dots
 *
 * @returns {string} Returns the truncated string
 */
export function truncateString(
  text: string,
  maxLength: number,
  breakPoint?: number
): string {
  const dots = '...'
  if (text.length > maxLength) {
    if (breakPoint != null) {
      return `${text.substring(0, breakPoint)}${dots}${text.slice(
        breakPoint - maxLength + dots.length
      )}`
    } else {
      return `${text.slice(0, maxLength - dots.length)}${dots}`
    }
  } else {
    return text
  }
}
