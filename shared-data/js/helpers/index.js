// @flow

import canPipetteUseLabware from './canPipetteUseLabware'
import computeWellAccess from './computeWellAccess'
import getWellTotalVolume from './getWellTotalVolume'
import wellIsRect from './wellIsRect'

export const intToAlphabetLetter = (i: number, lowerCase: boolean = false) =>
  String.fromCharCode((lowerCase ? 96 : 65) + i)

// These utils are great candidates for unit tests
export const toWellName = ({rowNum, colNum}: {rowNum: number, colNum: number}) => (
  String.fromCharCode(rowNum + 65) + (colNum + 1)
)

function _parseWell (well: string): ([string, number]) {
  const res = well.match(/([A-Z]+)(\d+)/)
  const letters = res && res[1]
  const number = res && parseInt(res[2])

  if (!letters || number == null || Number.isNaN(number)) {
    console.warn(`Could not parse well ${well}. Got letters: "${letters || 'void'}", number: "${number || 'void'}"`)
    return ['', NaN]
  }

  return [letters, number]
}

/** A compareFunction for sorting an array of well names
  * Goes down the columns (A1 to H1 on 96 plate)
  * Then L to R across rows (1 to 12 on 96 plate)
  */
export function sortWells (a: string, b: string): number {
  const [letterA, numberA] = _parseWell(a)
  const [letterB, numberB] = _parseWell(b)

  if (numberA !== numberB) {
    return (numberA > numberB) ? 1 : -1
  }

  if (letterA.length !== letterB.length) {
    // Eg 'B' vs 'AA'
    return (letterA.length > letterB.length) ? 1 : -1
  }

  return (letterA > letterB) ? 1 : -1
}

export function splitWellsOnColumn (sortedArray: Array<string>): Array<Array<string>> {
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

export {
  canPipetteUseLabware,
  computeWellAccess,
  getWellTotalVolume,
  wellIsRect,
}
