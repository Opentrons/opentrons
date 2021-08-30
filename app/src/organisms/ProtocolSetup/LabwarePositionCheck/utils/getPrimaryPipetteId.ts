import findKey from 'lodash/findKey'
import { getPipetteNameSpecs } from '@opentrons/shared-data'
import type { FilePipette } from '@opentrons/shared-data/protocol/types/schemaV4'

export const getPrimaryPipetteId = (pipettesById: {
  [id: string]: FilePipette
}): string => {
  if (Object.keys(pipettesById).length === 1) {
    return Object.keys(pipettesById)[0]
  }
  const leftPipetteId = findKey(
    pipettesById,
    pipette => pipette.mount === 'left'
  ) as string
  const rightPipetteId = findKey(
    pipettesById,
    pipette => pipette.mount === 'right'
  ) as string
  const leftPipette = pipettesById[leftPipetteId]
  const rightPipette = pipettesById[rightPipetteId]

  if (leftPipette == null || rightPipette == null) {
    throw new Error(
      'expected to find both left pipette and right pipette but could not'
    )
  }

  const leftPipetteSpecs = getPipetteNameSpecs(leftPipette.name)
  const rightPipetteSpecs = getPipetteNameSpecs(rightPipette.name)

  if (leftPipetteSpecs == null) {
    throw new Error(`could not find pipette specs for ${leftPipette.name}`)
  }
  if (rightPipetteSpecs == null) {
    throw new Error(`could not find pipette specs for ${rightPipette.name}`)
  }

  // prefer pipettes with fewer channels
  if (leftPipetteSpecs.channels !== rightPipetteSpecs.channels) {
    return leftPipetteSpecs.channels < rightPipetteSpecs.channels
      ? leftPipetteId
      : rightPipetteId
  }
  // prefer pipettes with smaller maxVolume
  if (leftPipetteSpecs.maxVolume !== rightPipetteSpecs.maxVolume) {
    return leftPipetteSpecs.maxVolume < rightPipetteSpecs.maxVolume
      ? leftPipetteId
      : rightPipetteId
  }

  const leftPipetteGenerationCompare = leftPipetteSpecs.displayCategory.localeCompare(
    rightPipetteSpecs.displayCategory
  )
  // prefer new pipette models
  if (leftPipetteGenerationCompare !== 0) {
    return leftPipetteGenerationCompare > 0 ? leftPipetteId : rightPipetteId
  }
  // if all else is the same, prefer the left pipette
  return leftPipetteId
}
