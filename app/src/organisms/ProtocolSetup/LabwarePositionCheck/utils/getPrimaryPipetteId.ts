import { getPipetteNameSpecs } from '@opentrons/shared-data'
import type { Command, ProtocolFile } from '@opentrons/shared-data/protocol'
import { LoadPipetteCommand } from '@opentrons/shared-data/protocol/types/schemaV6/command/setup'

export const getPrimaryPipetteId = (
  pipettesById: ProtocolFile<{}>['pipettes'],
  commands: Command[]
): string => {
  if (Object.keys(pipettesById).length === 1) {
    return Object.keys(pipettesById)[0]
  }

  const leftPipetteId = commands.find(
    (command: Command): command is LoadPipetteCommand =>
      command.commandType === 'loadPipette' && command.params.mount === 'left'
  )?.id
  const rightPipetteId = commands.find(
    (command: Command): command is LoadPipetteCommand =>
      command.commandType === 'loadPipette' && command.params.mount === 'right'
  )?.id

  if (leftPipetteId == null || rightPipetteId == null) {
    throw new Error(
      'expected to find both left pipette and right pipette but could not'
    )
  }

  const leftPipette = pipettesById[leftPipetteId]
  const rightPipette = pipettesById[rightPipetteId]

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
