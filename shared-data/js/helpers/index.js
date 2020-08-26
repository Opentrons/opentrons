// @flow
import assert from 'assert'
import uniq from 'lodash/uniq'
import { OPENTRONS_LABWARE_NAMESPACE } from '../constants'
import type { LabwareDefinition2 } from '../types'

export { getWellNamePerMultiTip } from './getWellNamePerMultiTip'
export { getWellTotalVolume } from './getWellTotalVolume'
export { wellIsRect } from './wellIsRect'
export * from './volume'
export * from './wellSets'

export const getLabwareDefIsStandard = (def: LabwareDefinition2): boolean =>
  def?.namespace === OPENTRONS_LABWARE_NAMESPACE

export const getLabwareDefURI = (def: LabwareDefinition2): string =>
  `${def.namespace}/${def.parameters.loadName}/${def.version}`

// Load names of "retired" labware
// TODO(mc, 2019-12-3): how should this correspond to LABWAREV2_DO_NOT_LIST?
// see shared-data/js/getLabware.js
const RETIRED_LABWARE = [
  'geb_96_tiprack_10ul',
  'geb_96_tiprack_1000ul',
  'opentrons_1_trash_850ml_fixed',
  'opentrons_10_tuberack_falcon_4x50ml_6x15ml_conical_acrylic',
  'opentrons_24_tuberack_eppendorf_2ml_safelock_snapcap_acrylic',
  'opentrons_24_tuberack_generic_0.75ml_snapcap_acrylic',
  'opentrons_40_aluminumblock_eppendorf_24x2ml_safelock_snapcap_generic_16x0.2ml_pcr_strip',
  'opentrons_96_aluminumblock_biorad_wellplate_200ul',
  'tipone_96_tiprack_200ul',
  'eppendorf_96_tiprack_1000ul_eptips',
  'eppendorf_96_tiprack_10ul_eptips',
]

export const getLabwareDisplayName = (
  labwareDef: LabwareDefinition2
): string => {
  const { displayName } = labwareDef.metadata

  if (
    getLabwareDefIsStandard(labwareDef) &&
    RETIRED_LABWARE.includes(labwareDef.parameters.loadName)
  ) {
    return `(Retired) ${displayName}`
  }
  return displayName
}

export const getTiprackVolume = (labwareDef: LabwareDefinition2): number => {
  assert(
    labwareDef.parameters.isTiprack,
    `getTiprackVolume expected a tiprack labware ${getLabwareDefURI(
      labwareDef
    )}, but 'isTiprack' isn't true`
  )
  // NOTE: Ian 2019-04-16 assuming all tips are the same volume across the rack
  const volume = labwareDef.wells['A1'].totalLiquidVolume
  assert(
    volume >= 0,
    `getTiprackVolume expected tip volume to be at least 0, got ${volume}`
  )
  return volume
}

export function getLabwareHasQuirk(
  labwareDef: LabwareDefinition2,
  quirk: string
): boolean {
  const quirks = labwareDef.parameters.quirks
  return quirks ? quirks.includes(quirk) : false
}

export const intToAlphabetLetter = (
  i: number,
  lowerCase: boolean = false
): string => String.fromCharCode((lowerCase ? 96 : 65) + i)

// These utils are great candidates for unit tests
export const toWellName = ({
  rowNum,
  colNum,
}: {|
  rowNum: number,
  colNum: number,
|}): string => String.fromCharCode(rowNum + 65) + (colNum + 1)

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

export const getWellDepth = (
  labwareDef: LabwareDefinition2,
  well: string
): number => labwareDef.wells[well].depth

// NOTE: this is used in PD for converting "offset from top" to "mm from bottom".
// Assumes all wells have same offset because multi-offset not yet supported.
// TODO: Ian 2019-07-13 return {[string: well]: offset} to support multi-offset
export const getWellsDepth = (
  labwareDef: LabwareDefinition2,
  wells: Array<string>
): number => {
  const offsets = wells.map(well => getWellDepth(labwareDef, well))
  if (uniq(offsets).length !== 1) {
    console.warn(
      `expected wells ${JSON.stringify(
        wells
      )} to all have same offset, but they were different. Labware def is ${getLabwareDefURI(
        labwareDef
      )}`
    )
  }

  return offsets[0]
}
