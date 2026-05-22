import {
  ALL,
  getLabwareDefURI,
  makeWellSetHelpers,
} from '@opentrons/shared-data'

import { getAllLatestDefs } from '/app/local-resources/labware'

import {
  EIGHT_CHANNEL_COMPATIBLE_LABWARE,
  NINETY_SIX_CHANNEL_COMPATIBLE_LABWARE,
  QUICK_TRANSFER_INCOMPATIBLE_LABWARE,
  SINGLE_CHANNEL_COMPATIBLE_LABWARE,
} from '../constants'

import type { PipetteV2Specs } from '@opentrons/shared-data'

export function generateCompatibleLabwareForPipette(
  pipetteSpecs: PipetteV2Specs
): string[] {
  if (pipetteSpecs.channels === 1) {
    return SINGLE_CHANNEL_COMPATIBLE_LABWARE
  }

  if (pipetteSpecs.channels === 8) {
    return EIGHT_CHANNEL_COMPATIBLE_LABWARE
  }

  if (pipetteSpecs.channels === 96) {
    return NINETY_SIX_CHANNEL_COMPATIBLE_LABWARE
  }

  const allLabwareDefinitions = getAllLatestDefs()
  const compatibleDefUriList: string[] = []
  const { canPipetteUseLabware } = makeWellSetHelpers()

  for (const definition of allLabwareDefinitions) {
    if (
      definition.allowedRoles != null &&
      (definition.allowedRoles.includes('adapter') ||
        definition.allowedRoles.includes('lid') ||
        definition.allowedRoles.includes('system'))
    ) {
      continue
    }

    const definitionUri = getLabwareDefURI(definition)

    if (QUICK_TRANSFER_INCOMPATIBLE_LABWARE.includes(definitionUri)) {
      continue
    }

    if (pipetteSpecs.channels === 1) {
      compatibleDefUriList.push(definitionUri)
      continue
    }

    if (canPipetteUseLabware(pipetteSpecs, ALL, definition)) {
      compatibleDefUriList.push(definitionUri)
    }
  }

  // console.log(JSON.stringify(compatibleDefUriList))
  // to update this list, uncomment the above log statement and
  // paste the result into the const in ./constants.ts
  return compatibleDefUriList
}
