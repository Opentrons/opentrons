import { getIsTiprack, LabwareDefinition2 } from '@opentrons/shared-data'
import { getPickUpTipCommandsWithPipette } from '../../Devices/ProtocolRun/utils/getPickUpTipCommandsWithPipette'
import { getTipracksVisited } from '../../Devices/ProtocolRun/utils/getTipracksVisited'
import type { RunTimeCommand } from '@opentrons/shared-data/protocol/types/schemaV6'
import type { LoadedLabware } from '@opentrons/shared-data'

/**
 * Determines if a given pipette visits all available tipracks based on a list of labware, labware definitions, and runtime commands.
 *
 * @param {string} pipetteId - The ID of the pipette being used.
 * @param {LoadedLabware[]} labware - An array of loaded labware objects.
 * @param {Record<string, LabwareDefinition2>} labwareDefinitions - An object containing labware definition URIs and their corresponding LabwareDefinition2 objects.
 * @param {RunTimeCommand[]} commands - An array of runtime commands being executed.
 * @returns {boolean} - True if the pipette visits all available tipracks; false otherwise.
 */
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
