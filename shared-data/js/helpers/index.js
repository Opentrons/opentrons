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

export {
  canPipetteUseLabware,
  computeWellAccess,
  getWellTotalVolume,
  wellIsRect,
}
