// @flow
import assert from 'assert'
import mapValues from 'lodash/mapValues'
// TODO: Ian 2019-06-04 remove the shared-data build process for labware v1
import definitions from '../build/labware.json'
import { SLOT_RENDER_HEIGHT, FIXED_TRASH_RENDER_HEIGHT } from './constants'
import type {
  LabwareDefinition1,
  LabwareDefinition2,
  WellDefinition,
} from './types'

assert(
  definitions && Object.keys(definitions).length > 0,
  'Expected v1 labware defs. Something went wrong with shared-data/build/labware.json'
)

export function getLabwareV1Def(labwareName: string): ?LabwareDefinition1 {
  const labware: ?LabwareDefinition1 = definitions[labwareName]
  return labware
}

export function getIsV1LabwareTiprack(def: LabwareDefinition1): boolean {
  return Boolean(def?.metadata?.isTiprack)
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
const _getSvgYValueForWell = (
  def: LabwareDefinition1,
  wellDef: WellDefinition
) => {
  const labwareName = def.metadata.name
  const renderHeight =
    labwareName === 'fixed-trash'
      ? FIXED_TRASH_RENDER_HEIGHT
      : SLOT_RENDER_HEIGHT
  return renderHeight - wellDef.y
}

/** For display. Flips Y axis to match SVG, applies offset to wells */
export function getWellPropsForSVGLabwareV1(def: LabwareDefinition1) {
  const wellDefs = def && def.wells

  // Most labware defs have a weird offset,
  // but tips are mostly OK.
  // This is a HACK to make the offset less "off"
  const isTiprack = getIsV1LabwareTiprack(def)
  let xCorrection = 0
  let yCorrection = 0
  if (!isTiprack) {
    xCorrection = 1
    yCorrection = -3
  }

  return mapValues(wellDefs, (wellDef: WellDefinition) => ({
    ...wellDef,
    x: wellDef.x + xCorrection,
    y: _getSvgYValueForWell(def, wellDef) + yCorrection,
  }))
}

export const getLabwareDefURI = (def: LabwareDefinition2): string =>
  `${def.namespace}/${def.parameters.loadName}/${def.version}`
