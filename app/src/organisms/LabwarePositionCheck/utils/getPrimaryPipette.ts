import type { FilePipette } from '@opentrons/shared-data/protocol/types/schemaV4'
import { getPipetteNameSpecs, PipetteName } from '@opentrons/shared-data'

export const getPrimaryPipette = (pipettes: FilePipette[]): PipetteName => {
  if (pipettes.length === 1) {
    return pipettes[0].name
  }
  const leftPipette = pipettes.find(pipette => pipette.mount === 'left')
  const rightPipette = pipettes.find(pipette => pipette.mount === 'right')

  if (leftPipette == null || rightPipette == null) {
    throw new Error(
      'expected to find both left pipette and right pipette but could not'
    )
  }

  const leftPipetteSpecs = getPipetteNameSpecs(leftPipette.name)
  const rightPipetteSpecs = getPipetteNameSpecs(rightPipette.name)

  if (leftPipetteSpecs == null) {
    throw Error(`could not find pipette specs for ${leftPipette.name}`)
  }
  if (rightPipetteSpecs == null) {
    throw Error(`could not find pipette specs for ${rightPipette.name}`)
  }

  if (leftPipetteSpecs.channels < rightPipetteSpecs.channels) {
    return leftPipette.name
  }
}
