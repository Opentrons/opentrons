// @flow
import mapValues from 'lodash/mapValues'
import definitions from '../build/labware.json'
import {SLOT_HEIGHT} from './constants'
import type {LabwareDefinition, WellDefinition} from './types'

export default function getLabware (labwareName: string): ?LabwareDefinition {
  const labware: ?LabwareDefinition = definitions[labwareName]
  return labware
}

export function getIsTiprack (labwareName: string): boolean {
  const labware = getLabware(labwareName)
  return Boolean(labware && labware.metadata && labware.metadata.isTiprack)
}

/** For display. Flips Y axis to match SVG, applies offset to wells */
export function getWellDefsForSVG (labwareName: string) {
  const labware = getLabware(labwareName)
  const wellDefs = labware && labware.wells

  // Most labware defs have a weird offset,
  // but tips are mostly OK.
  // This is a HACK to make the offset less "off"
  const isTiprack = getIsTiprack(labwareName)
  let xCorrection = 0
  let yCorrection = 0
  if (!isTiprack) {
    xCorrection = 1
    yCorrection = -3
  }

  return mapValues(wellDefs, (wellDef: WellDefinition) => ({
    ...wellDef,
    x: wellDef.x + xCorrection,
    // flip y axis to match SVG y axis direction
    y: SLOT_HEIGHT - wellDef.y + yCorrection
  }))
}
