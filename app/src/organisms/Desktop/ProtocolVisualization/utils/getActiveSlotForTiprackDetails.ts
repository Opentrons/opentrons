import { getSlotInLocationStack } from '@opentrons/step-generation'

import type { RunTimeCommand } from '@opentrons/shared-data'
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
  } else
    console.warn(
      `expected to find slot assosciated with piette location ${entityUnderPipette} but could not`
    )
  return null
}

export const getActiveSlotForTiprackDetails = (
  pipettes: PipetteTemporalProperties[],
  robotState: RobotState,
  invariantContext: InvariantContext,
  currentCommand: RunTimeCommand
): DeckSlot | null => {
  const { labware } = robotState
  const { trashBinEntities, wasteChuteEntities, labwareEntities } =
    invariantContext
  const tiprackUnderPipette =
    pipettes.find(
      (pipette): pipette is PipetteTemporalProperties & { tiprackId: string } =>
        typeof pipette.tiprackId === 'string'
    )?.tiprackId ?? null
  const currentCommandLabwareId =
    'labwareId' in currentCommand.params &&
    typeof currentCommand.params.labwareId === 'string'
      ? currentCommand.params.labwareId
      : null
  const tiprackFromCurrentCommand =
    currentCommandLabwareId != null &&
    labwareEntities[currentCommandLabwareId]?.def.parameters.isTiprack === true
      ? currentCommandLabwareId
      : null
  const tiprackToShow: string | null =
    tiprackUnderPipette ?? tiprackFromCurrentCommand
  let slot = null

  if (tiprackToShow != null) {
    slot = getSlotFromPipetteLocation(
      tiprackToShow,
      labware,
      trashBinEntities,
      wasteChuteEntities
    )
  }

  return slot
}
