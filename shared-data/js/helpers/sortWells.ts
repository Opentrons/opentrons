function _parseWell(well: string): [string, number] {
  const res = well.match(/([A-Z]+)(\d+)/)
  const letters = res && res[1]
  const number = res && parseInt(res[2])

  if (!letters || number == null || Number.isNaN(number)) {
    console.warn(
      `Could not parse well ${well}. Got letters: "${
        letters || 'void'
      }", number: "${number || 'void'}"`
    )
    return ['', NaN]
  }

  return [letters, number]
}
/** A compareFunction for sorting an array of well names
 * Goes down the columns (A1 to H1 on 96 plate)
 * Then L to R across rows (1 to 12 on 96 plate)
 */
export function sortWells(a: string, b: string): number {
  const [letterA, numberA] = _parseWell(a)

  const [letterB, numberB] = _parseWell(b)

  if (numberA !== numberB) {
    return numberA > numberB ? 1 : -1
  }

  if (letterA.length !== letterB.length) {
    // Eg 'B' vs 'AA'
    return letterA.length > letterB.length ? 1 : -1
  }

  return letterA > letterB ? 1 : -1
}
