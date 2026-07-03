import { getSlotInLocationStack } from '@opentrons/step-generation'

import type {
  DeckSlot,
  InvariantContext,
  PipetteTemporalProperties,
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

export const getActiveSlotForTiprackDetails = (
  pipettes: PipetteTemporalProperties[],
  robotState: RobotState,
  invariantContext: InvariantContext
): DeckSlot | null => {
  const { labware } = robotState
  const { trashBinEntities, wasteChuteEntities } = invariantContext
  const tiprackUnderPipette = pipettes.find(
    pipette => pipette.tiprackId != null
  )?.tiprackId
  let slot = null

  if (tiprackUnderPipette != null) {
    slot = getSlotFromPipetteLocation(
      tiprackUnderPipette,
      labware,
      trashBinEntities,
      wasteChuteEntities
    )
  }

  return slot
}
