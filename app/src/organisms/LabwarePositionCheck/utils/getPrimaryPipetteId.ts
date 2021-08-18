import findKey from 'lodash/findKey'
import { getPipetteNameSpecs } from '@opentrons/shared-data'
import type { FilePipette } from '@opentrons/shared-data/protocol/types/schemaV4'

export const getPrimaryPipetteId = (pipettes: {
  [id: string]: FilePipette
}): string => {
  if (Object.keys(pipettes).length === 1) {
    return Object.keys(pipettes)[0]
  }
  const leftPipetteId = findKey(
    pipettes,
    pipettes => pipettes.mount === 'left'
  ) as string
  const rightPipetteId = findKey(
    pipettes,
    pipettes => pipettes.mount === 'right'
  ) as string
  const leftPipette = pipettes[leftPipetteId as string]
  const rightPipette = pipettes[rightPipetteId as string]

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

  if (leftPipetteSpecs.channels !== rightPipetteSpecs.channels) {
    return leftPipetteSpecs.channels < rightPipetteSpecs.channels
      ? leftPipetteId
      : rightPipetteId
  }

  if (leftPipetteSpecs.maxVolume !== rightPipetteSpecs.maxVolume) {
    return leftPipetteSpecs.maxVolume < rightPipetteSpecs.maxVolume
      ? leftPipetteId
      : rightPipetteId
  }

  const leftPipetteGenerationCompare = leftPipetteSpecs.displayCategory.localeCompare(
    rightPipetteSpecs.displayCategory
  )

  if (leftPipetteGenerationCompare !== 0) {
    return leftPipetteGenerationCompare > 0 ? leftPipetteId : rightPipetteId
  }

  return leftPipetteId
}
