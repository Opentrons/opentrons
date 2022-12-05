import { DEPRECATED_SECTIONS } from '../constants'
import {
  getLabwareIdsInOrder,
  getAllTipracksIdsThatPipetteUsesInOrder,
} from './deprecatedLabware'
import {
  getMoveToTiprackSteps,
  getPickupTipStep,
  getMoveToLabwareSteps,
  getDropTipStep,
} from './deprecatedStepCreators'
import type {
  ProtocolFile,
  LabwareDefinition2,
  LoadedLabware,
} from '@opentrons/shared-data'
import type { RunTimeCommand } from '@opentrons/shared-data/protocol/types/schemaV6'
import type { DeprecatedLabwarePositionCheckStep } from '../types'

export const getTwoPipettePositionCheckSteps = (args: {
  primaryPipetteId: string
  secondaryPipetteId: string
  labware: LoadedLabware[]
  labwareDefinitions: Record<string, LabwareDefinition2>
  modules: ProtocolFile<{}>['modules']
  commands: RunTimeCommand[]
}): DeprecatedLabwarePositionCheckStep[] => {
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
    DEPRECATED_SECTIONS.SECONDARY_PIPETTE_TIPRACKS
  )

  const movePrimaryPipetteToTiprackSteps = getMoveToTiprackSteps(
    remainingTiprackIdsThatPrimaryPipetteUses,
    primaryPipetteId,
    DEPRECATED_SECTIONS.PRIMARY_PIPETTE_TIPRACKS
  )

  const lastTiprackId =
    remainingTiprackIdsThatPrimaryPipetteUses[
      remainingTiprackIdsThatPrimaryPipetteUses.length - 1
    ]

  const pickupTipFromLastTiprackStep = getPickupTipStep(
    lastTiprackId,
    primaryPipetteId,
    DEPRECATED_SECTIONS.PRIMARY_PIPETTE_TIPRACKS
  )

  const moveToRemainingLabwareSteps = getMoveToLabwareSteps(
    labware,
    modules,
    orderedLabwareIds,
    primaryPipetteId,
    DEPRECATED_SECTIONS.CHECK_REMAINING_LABWARE_WITH_PRIMARY_PIPETTE,
    commands
  )

  const dropTipInLastTiprackStep = getDropTipStep(
    lastTiprackId,
    primaryPipetteId,
    DEPRECATED_SECTIONS.RETURN_TIP
  )

  return [
    ...moveSecondaryPipetteToTiprackSteps,
    ...movePrimaryPipetteToTiprackSteps,
    pickupTipFromLastTiprackStep,
    ...moveToRemainingLabwareSteps,
    dropTipInLastTiprackStep,
  ]
}
