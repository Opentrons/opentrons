// @flow
import mapValues from 'lodash/mapValues'
import definitions from '../build/labware.json'
import { SLOT_RENDER_HEIGHT, FIXED_TRASH_RENDER_HEIGHT } from './constants'
import type {
  LabwareDefinition,
  LabwareDefinition2,
  WellDefinition,
} from './types'

export function getLabware(labwareName: string): ?LabwareDefinition {
  const labware: ?LabwareDefinition = definitions[labwareName]
  return labware
}

// TODO: Ian 2019-04-11 DEPRECATED REMOVE
export function getIsTiprackDeprecated(labwareName: string): boolean {
  const labware = getLabware(labwareName)
  return Boolean(labware && labware.metadata && labware.metadata.isTiprack)
}

export function getIsTiprack(labwareDef: LabwareDefinition2): boolean {
  return labwareDef.parameters.isTiprack
}

/* Render Helpers */

// NOTE: this doesn't account for the differing footprints of labware
// the fixed trash render height is the first bandaid to partially
// mend this, but overall the labware definitions in shared-data are
// insufficient to render labware at the resolution we'd like to
// achieve going forward.

// TODO: BC 2019-02-28 The height constants used here should be replaced with the heights
// in the dimensions field of the corresponding labware in definitions
const _getSvgYValueForWell = (labwareName: string, wellDef: WellDefinition) => {
  const renderHeight =
    labwareName === 'fixed-trash'
      ? FIXED_TRASH_RENDER_HEIGHT
      : SLOT_RENDER_HEIGHT
  return renderHeight - wellDef.y
}

// TODO IMMEDIATELY: DEPRECATED, remove
/** For display. Flips Y axis to match SVG, applies offset to wells */
export function getWellDefsForSVG(labwareName: string) {
  const labware = getLabware(labwareName)
  const wellDefs = labware && labware.wells

  // Most labware defs have a weird offset,
  // but tips are mostly OK.
  // This is a HACK to make the offset less "off"
  const isTiprack = getIsTiprackDeprecated(labwareName)
  let xCorrection = 0
  let yCorrection = 0
  if (!isTiprack) {
    xCorrection = 1
    yCorrection = -3
  }

  return mapValues(wellDefs, (wellDef: WellDefinition) => ({
    ...wellDef,
    x: wellDef.x + xCorrection,
    y: _getSvgYValueForWell(labwareName, wellDef) + yCorrection,
  }))
}
