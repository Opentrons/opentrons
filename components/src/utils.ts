export const humanizeLabwareType = (labwareType: string): string => {
  return labwareType.replace(/-|_/g, ' ')
}

export const wellNameSplit = (wellName: string): [string, string] => {
  // Eg B9 => ['B', '9']
  const raw = wellName.split(/(\D+)(\d+)/)

  if (raw.length !== 4) {
    throw Error('expected /\\D+\\d+/ regexp to split wellName, got ' + wellName)
  }

  const letters = raw[1]

  if (letters.length !== 1) {
    throw Error(
      'expected 1 letter in wellName, got ' +
        letters +
        ' in wellName: ' +
        wellName
    )
  }

  const numbers = raw[2]

  return [letters, numbers]
}

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
  if (text.length > maxLength)
    if (breakPoint != null) {
      return `${text.substring(0, breakPoint)}${dots}${text.slice(
        breakPoint - maxLength + dots.length
      )}`
    } else {
      return `${text.slice(0, maxLength - dots.length)}${dots}`
    }
  else return text
}
