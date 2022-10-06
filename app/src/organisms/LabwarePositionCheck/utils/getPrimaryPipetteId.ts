import { getPipetteNameSpecs } from '@opentrons/shared-data'
import type {
  RunTimeCommand,
  ProtocolFile,
} from '@opentrons/shared-data/protocol'
import { LoadPipetteRunTimeCommand } from '@opentrons/shared-data/protocol/types/schemaV6/command/setup'

export const getPrimaryPipetteId = (
  pipettesById: ProtocolFile<{}>['pipettes'],
  commands: RunTimeCommand[]
): string => {
  if (pipettesById[1] == null) {
    //  @ts-expect-error: id will exist when we remove the schemaV6Adapter
    return pipettesById[0].id
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
  console.log(pipettesById[0])

  const leftPipette = pipettesById[0]
  const rightPipette = pipettesById[1]

  //  @ts-expect-error: pipetteName should be name until we remove the schemaV6Adapter
  const leftPipetteSpecs = getPipetteNameSpecs(leftPipette.pipetteName)
  //  @ts-expect-error: pipetteName should be name until we remove the schemaV6Adapter
  const rightPipetteSpecs = getPipetteNameSpecs(rightPipette.pipetteName)

  if (leftPipetteSpecs == null) {
    throw new Error(
      //  @ts-expect-error: pipetteName should be name until we remove the schemaV6Adapter
      `could not find pipette specs for ${leftPipette.pipetteName}`
    )
  }
  if (rightPipetteSpecs == null) {
    throw new Error(
      //  @ts-expect-error: pipetteName should be name until we remove the schemaV6Adapter
      `could not find pipette specs for ${rightPipette.pipetteName}`
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
