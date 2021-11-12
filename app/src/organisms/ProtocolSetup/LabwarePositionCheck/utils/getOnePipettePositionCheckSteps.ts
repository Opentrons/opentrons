import { SECTIONS } from '../constants'
import { getLabwareIdsInOrder, getTiprackIdsInOrder } from './labware'
import {
  getMoveToTiprackSteps,
  getPickupTipStep,
  getMoveToLabwareSteps,
  getDropTipStep,
} from './stepCreators'
import type {
  ProtocolFile,
  LabwareDefinition2,
  Command,
} from '@opentrons/shared-data'
import type { LabwarePositionCheckStep } from '../types'

export const getOnePipettePositionCheckSteps = (args: {
  primaryPipetteId: string
  labware: ProtocolFile<{}>['labware']
  labwareDefinitions: Record<string, LabwareDefinition2>
  modules: ProtocolFile<{}>['modules']
  commands: Command[]
}): LabwarePositionCheckStep[] => {
  const {
    commands,
    primaryPipetteId,
    labware,
    labwareDefinitions,
    modules,
  } = args

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
    SECTIONS.PRIMARY_PIPETTE_TIPRACKS
  )

  const lastTiprackId = orderedTiprackIds[orderedTiprackIds.length - 1]
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
    ...moveToTiprackSteps,
    pickupTipFromLastTiprackStep,
    ...moveToRemainingLabwareSteps,
    dropTipInLastTiprackStep,
  ]
}
