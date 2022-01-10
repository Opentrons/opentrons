import reduce from 'lodash/reduce'
import {
  getIsTiprack,
  ProtocolFile,
  LabwareDefinition2,
} from '@opentrons/shared-data'
import { getPickUpTipCommandsWithPipette } from '../../utils/getPickUpTipCommandsWithPipette'
import { getTipracksVisited } from '../../utils/getTipracksVisited'
import type { CreateCommand } from '@opentrons/shared-data/protocol/types/schemaV6'

export const doesPipetteVisitAllTipracks = (
  pipetteId: string,
  labware: ProtocolFile<{}>['labware'],
  labwareDefinitions: Record<string, LabwareDefinition2>,
  commands: CreateCommand[]
): boolean => {
  const numberOfTipracks = reduce(
    labware,
    (numberOfTipracks, currentLabware) => {
      const labwareDef = labwareDefinitions[currentLabware.definitionId]
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
