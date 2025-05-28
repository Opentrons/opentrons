import { getIsTiprack } from '@opentrons/shared-data'

import {
  getPickUpTipCommandsWithPipette,
  getTipracksVisited,
} from '/app/transformations/commands'

import type {
  LabwareDefinition,
  LoadedLabware,
  RunTimeCommand,
} from '@opentrons/shared-data'

export const doesPipetteVisitAllTipracks = (
  pipetteId: string,
  labware: LoadedLabware[],
  labwareDefinitions: Record<string, LabwareDefinition>,
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
