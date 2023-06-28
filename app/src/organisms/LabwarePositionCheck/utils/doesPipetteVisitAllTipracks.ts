import { getIsTiprack, LabwareDefinition2 } from '@opentrons/shared-data'
import { getPickUpTipCommandsWithPipette } from '../../Devices/ProtocolRun/utils/getPickUpTipCommandsWithPipette'
import { getTipracksVisited } from '../../Devices/ProtocolRun/utils/getTipracksVisited'
import type { RunTimeCommand } from '@opentrons/shared-data/protocol/types/schemaV7'
import type { LoadedLabware } from '@opentrons/shared-data'

export const doesPipetteVisitAllTipracks = (
  pipetteId: string,
  labware: LoadedLabware[],
  labwareDefinitions: Record<string, LabwareDefinition2>,
  commands: RunTimeCommand[]
): boolean => {
  const numberOfTipracks = labware.reduce(
    (numberOfTipracks, currentLabware) => {
      const labwareDef = labwareDefinitions[currentLabware.definitionUri]
      return getIsTiprack(labwareDef) ? numberOfTipracks + 1 : numberOfTipracks
    },
    0
  )
  const pickUpTipCommandsWithPipette = getPickUpTipCommandsWithPipette(
    commands,
    pipetteId
  )

  const tipracksVisited = getTipracksVisited(pickUpTipCommandsWithPipette)

  pickUpTipCommandsWithPipette.reduce<string[]>((visited, command) => {
    const tiprack = command.params.labwareId
    return visited.includes(tiprack) ? visited : [...visited, tiprack]
  }, [])

  return numberOfTipracks === tipracksVisited.length
}
