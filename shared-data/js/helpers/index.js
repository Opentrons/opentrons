// @flow
import type { LabwareDefinition2 } from '../types'
export { default as canPipetteUseLabware } from './canPipetteUseLabware'
export {
  computeWellAccessDeprecated,
  computeWellAccess,
} from './computeWellAccess'
export { default as getWellTotalVolume } from './getWellTotalVolume'
export { default as wellIsRect } from './wellIsRect'
export * from './volume'

export const getLabwareDisplayName = (labwareDef: LabwareDefinition2) =>
  labwareDef.metadata.displayName

export const getLabwareFormat = (labwareDef: LabwareDefinition2) =>
  labwareDef.parameters.format

export function getLabwareHasQuirk(
  labwareDef: LabwareDefinition2,
  quirk: string
): boolean {
  const quirks = labwareDef.parameters.quirks
  return quirks ? quirks.includes(quirk) : false
}

export const intToAlphabetLetter = (i: number, lowerCase: boolean = false) =>
  String.fromCharCode((lowerCase ? 96 : 65) + i)

// These utils are great candidates for unit tests
export const toWellName = ({
  rowNum,
  colNum,
}: {
  rowNum: number,
  colNum: number,
}) => String.fromCharCode(rowNum + 65) + (colNum + 1)

function _parseWell(well: string): [string, number] {
  const res = well.match(/([A-Z]+)(\d+)/)
  const letters = res && res[1]
  const number = res && parseInt(res[2])

  if (!letters || number == null || Number.isNaN(number)) {
    console.warn(
      `Could not parse well ${well}. Got letters: "${letters ||
        'void'}", number: "${number || 'void'}"`
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

export function splitWellsOnColumn(
  sortedArray: Array<string>
): Array<Array<string>> {
  return sortedArray.reduce((acc, curr) => {
    const lastColumn = acc.slice(-1)
    if (lastColumn === undefined || lastColumn.length === 0) {
      return [[curr]]
    }
    const lastEle = lastColumn[0].slice(-1)[0].slice(1)
    if (Number(curr.slice(1)) > Number(lastEle)) {
      return [...acc, [curr]]
    } else {
      return [...acc.slice(0, -1), [...lastColumn[0], curr]]
    }
  }, [])
}
