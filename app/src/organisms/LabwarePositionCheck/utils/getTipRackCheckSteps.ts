import { DEPRECATED_SECTIONS } from '../constants'
import {
  getLabwareIdsInOrder, 
  getAllTipracksIdsThatPipetteUsesInOrder,
  getTiprackIdsInOrder
} from './labware'
import {
  getMoveToTiprackSteps,
  getPickupTipStep,
  getMoveToLabwareSteps,
  getDropTipStep,
} from './stepCreators'
import type {
  LabwareDefinition2,
  RunTimeCommand,
  ProtocolAnalysisOutput,
} from '@opentrons/shared-data'
import type { LabwarePositionCheckStep } from '../types'

export const getOnePipettePositionCheckSteps = (args: {
  primaryPipetteId: string
  secondaryPipetteId: string
  labware: ProtocolAnalysisOutput['labware']
  labwareDefinitions: Record<string, LabwareDefinition2>
  modules: ProtocolAnalysisOutput['modules']
  commands: RunTimeCommand[]
}): LabwarePositionCheckStep[] => {
  const {
    commands,
    secondaryPipetteId,
    primaryPipetteId,
    labware,
    labwareDefinitions,
    modules,
  } = args


  const orderedTiprackIdsThatSecondaryPipetteUses = getAllTipracksIdsThatPipetteUsesInOrder(
    secondaryPipetteId,
    commands,
    labware,
    labwareDefinitions
  )


  const orderedTiprackIds = getTiprackIdsInOrder(
    labware,
    labwareDefinitions,
    commands
  )

  const orderedLabwareIds = getLabwareIdsInOrder(
    labware,
    labwareDefinitions,
    modules,
    commands
  )

  const moveToTiprackSteps = getMoveToTiprackSteps(
    orderedTiprackIds,
    primaryPipetteId,
    DEPRECATED_SECTIONS.PRIMARY_PIPETTE_TIPRACKS
  )

  const lastTiprackId = orderedTiprackIds[orderedTiprackIds.length - 1]
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
    ...moveToTiprackSteps,
    pickupTipFromLastTiprackStep,
    ...moveToRemainingLabwareSteps,
    dropTipInLastTiprackStep,
  ]
}
