import type { ProtocolFile, LabwareDefinition2 } from '@opentrons/shared-data'
import { SECTIONS } from '../constants'
import {
  getLabwareIdsInOrder,
  getAllTipracksIdsThatPipetteUsesInOrder,
} from './labware'
import {
  getMoveToTiprackSteps,
  getPickupTipStep,
  getMoveToLabwareSteps,
  getDropTipStep,
} from './stepCreators'
import type { Command } from '@opentrons/shared-data/protocol/types/schemaV6'
import type { LabwarePositionCheckStep } from '../types'

export const getTwoPipettePositionCheckSteps = (args: {
  primaryPipetteId: string
  secondaryPipetteId: string
  labware: ProtocolFile<{}>['labware']
  labwareDefinitions: Record<string, LabwareDefinition2>
  modules: ProtocolFile<{}>['modules']
  commands: Command[]
}): LabwarePositionCheckStep[] => {
  const {
    primaryPipetteId,
    secondaryPipetteId,
    labware,
    labwareDefinitions,
    modules,
    commands,
  } = args
  const orderedTiprackIdsThatSecondaryPipetteUses = getAllTipracksIdsThatPipetteUsesInOrder(
    secondaryPipetteId,
    commands,
    labware,
    labwareDefinitions
  )

  const orderedTiprackIdsThatPrimaryPipetteUses = getAllTipracksIdsThatPipetteUsesInOrder(
    primaryPipetteId,
    commands,
    labware,
    labwareDefinitions
  )

  const orderedTiprackIdsThatOnlySecondaryPipetteUses = orderedTiprackIdsThatSecondaryPipetteUses.filter(
    tiprackId => !orderedTiprackIdsThatPrimaryPipetteUses.includes(tiprackId)
  )

  const remainingTiprackIdsThatPrimaryPipetteUses = orderedTiprackIdsThatPrimaryPipetteUses.filter(
    tiprackId =>
      !orderedTiprackIdsThatOnlySecondaryPipetteUses.includes(tiprackId)
  )

  const orderedLabwareIds = getLabwareIdsInOrder(
    labware,
    labwareDefinitions,
    modules,
    commands
  )

  const moveSecondaryPipetteToTiprackSteps = getMoveToTiprackSteps(
    orderedTiprackIdsThatOnlySecondaryPipetteUses,
    secondaryPipetteId,
    SECTIONS.SECONDARY_PIPETTE_TIPRACKS
  )

  const movePrimaryPipetteToTiprackSteps = getMoveToTiprackSteps(
    remainingTiprackIdsThatPrimaryPipetteUses,
    primaryPipetteId,
    SECTIONS.PRIMARY_PIPETTE_TIPRACKS
  )

  const lastTiprackId =
    remainingTiprackIdsThatPrimaryPipetteUses[
      remainingTiprackIdsThatPrimaryPipetteUses.length - 1
    ]

  const pickupTipFromLastTiprackStep = getPickupTipStep(
    lastTiprackId,
    primaryPipetteId,
    SECTIONS.PRIMARY_PIPETTE_TIPRACKS
  )

  const moveToRemainingLabwareSteps = getMoveToLabwareSteps(
    labware,
    modules,
    orderedLabwareIds,
    primaryPipetteId,
    SECTIONS.CHECK_REMAINING_LABWARE_WITH_PRIMARY_PIPETTE,
    commands
  )

  const dropTipInLastTiprackStep = getDropTipStep(
    lastTiprackId,
    primaryPipetteId,
    SECTIONS.RETURN_TIP
  )

  return [
    ...moveSecondaryPipetteToTiprackSteps,
    ...movePrimaryPipetteToTiprackSteps,
    pickupTipFromLastTiprackStep,
    ...moveToRemainingLabwareSteps,
    dropTipInLastTiprackStep,
  ]
}
