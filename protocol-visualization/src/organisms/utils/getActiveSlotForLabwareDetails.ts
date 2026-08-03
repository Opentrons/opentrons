import { getSlotInLocationStack } from '@opentrons/step-generation'

import type { RunTimeCommand } from '@opentrons/shared-data'
import type {
  DeckSlot,
  InvariantContext,
  RobotState,
  TrashBinEntities,
  WasteChuteEntities,
} from '@opentrons/step-generation'

const getSlotFromPipetteLocation = (
  entityUnderPipette: string,
  labware: RobotState['labware'],
  trashBinEntities: TrashBinEntities,
  wasteChuteEntities: WasteChuteEntities
): string | null => {
  if (labware[entityUnderPipette] != null) {
    return getSlotInLocationStack(labware[entityUnderPipette].stack)
  } else if (trashBinEntities[entityUnderPipette] != null) {
    return trashBinEntities[entityUnderPipette].location.split('cutout')[1]
  } else if (wasteChuteEntities[entityUnderPipette] != null) {
    return wasteChuteEntities[entityUnderPipette].location.split('cutout')[1]
  } else {
    console.warn(
      `expected to find slot assosciated with piette location ${entityUnderPipette} but could not`
    )
  }
  return null
}

export const getActiveSlotForLabwareDetails = (
  robotState: RobotState,
  invariantContext: InvariantContext,
  currentCommand: RunTimeCommand
): DeckSlot | null => {
  const { labware, pipettes } = robotState
  const { trashBinEntities, wasteChuteEntities, labwareEntities } =
    invariantContext
  const entityUnderPipette = Object.values(pipettes).find(
    pipette => pipette.entityId != null
  )?.entityId
  let slot = null

  if (
    'labwareId' in currentCommand.params &&
    currentCommand.params.labwareId !== 'fixedTrash'
  ) {
    const isTiprack =
      labwareEntities[currentCommand.params.labwareId].def.parameters.isTiprack
    if (!isTiprack) {
      slot = currentCommand.params.labwareId
    }
  } else if (entityUnderPipette != null) {
    slot = getSlotFromPipetteLocation(
      entityUnderPipette,
      labware,
      trashBinEntities,
      wasteChuteEntities
    )
  }

  return slot
}
