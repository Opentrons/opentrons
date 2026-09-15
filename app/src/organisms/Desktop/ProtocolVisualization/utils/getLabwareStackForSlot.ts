import { getFullStackFromLabwares } from '@opentrons/step-generation'

import type { RunTimeCommand } from '@opentrons/shared-data'
import type {
  InvariantContext,
  PipetteTemporalProperties,
  RobotState,
} from '@opentrons/step-generation'

export function getTiprackIdUnderPipette(
  pipettes: PipetteTemporalProperties[]
): string | null {
  return pipettes.find(pipette => pipette.tiprackId != null)?.tiprackId ?? null
}

export function getLabwareIdForStackLookup(
  robotState: RobotState,
  invariantContext: InvariantContext,
  currentCommand: RunTimeCommand
): string | null {
  const { pipettes } = robotState
  const { labwareEntities } = invariantContext

  if (
    'labwareId' in currentCommand.params &&
    currentCommand.params.labwareId !== 'fixedTrash'
  ) {
    const { labwareId } = currentCommand.params
    const isTiprack =
      labwareEntities[labwareId]?.def.parameters.isTiprack === true
    if (!isTiprack) {
      return labwareId
    }
  }

  const entityUnderPipette = Object.values(pipettes).find(
    pipette => pipette.entityId != null
  )?.entityId

  return entityUnderPipette ?? null
}

export function getLabwareStackForSlot(
  labware: RobotState['labware'],
  slot: string,
  labwareId?: string | null
): string[] {
  return getFullStackFromLabwares(labware, slot, labwareId ?? undefined)
}
