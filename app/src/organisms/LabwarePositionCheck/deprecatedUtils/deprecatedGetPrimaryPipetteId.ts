import { getPipetteNameSpecs } from '@opentrons/shared-data'
import type { RunTimeCommand } from '@opentrons/shared-data/protocol'
import type { LoadedPipette } from '@opentrons/shared-data'
import { LoadPipetteRunTimeCommand } from '@opentrons/shared-data/protocol/types/schemaV6/command/setup'

export const deprecatedGetPrimaryPipetteId = (
  pipettes: LoadedPipette[],
  commands: RunTimeCommand[]
): string => {
  if (pipettes.length === 1) {
    return pipettes[0].id
  }

  const leftPipetteId = commands.find(
    (command: RunTimeCommand): command is LoadPipetteRunTimeCommand =>
      command.commandType === 'loadPipette' && command.params.mount === 'left'
  )?.result?.pipetteId
  const rightPipetteId = commands.find(
    (command: RunTimeCommand): command is LoadPipetteRunTimeCommand =>
      command.commandType === 'loadPipette' && command.params.mount === 'right'
  )?.result?.pipetteId

  if (leftPipetteId == null || rightPipetteId == null) {
    throw new Error(
      'expected to find both left pipette and right pipette but could not'
    )
  }

  const leftPipette = pipettes.find(pipette => pipette.id === leftPipetteId)
  const rightPipette = pipettes.find(pipette => pipette.id === rightPipetteId)

  const leftPipetteSpecs =
    leftPipette != null ? getPipetteNameSpecs(leftPipette.pipetteName) : null
  const rightPipetteSpecs =
    rightPipette != null ? getPipetteNameSpecs(rightPipette.pipetteName) : null

  if (leftPipetteSpecs == null) {
    throw new Error(
      `could not find pipette specs for ${
        leftPipette != null ? leftPipette.pipetteName : 'left pipette'
      }`
    )
  }
  if (rightPipetteSpecs == null) {
    throw new Error(
      `could not find pipette specs for ${
        rightPipette != null ? rightPipette.pipetteName : 'right pipette'
      }`
    )
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
