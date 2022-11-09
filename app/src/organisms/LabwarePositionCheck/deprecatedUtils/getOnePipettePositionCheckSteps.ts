import { DEPRECATED_SECTIONS } from '../constants'
import { getLabwareIdsInOrder, getTiprackIdsInOrder } from './deprecatedLabware'
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
  RunTimeCommand,
} from '@opentrons/shared-data'
import type { DeprecatedLabwarePositionCheckStep } from '../types'

export const getOnePipettePositionCheckSteps = (args: {
  primaryPipetteId: string
  labware: LoadedLabware[]
  labwareDefinitions: Record<string, LabwareDefinition2>
  modules: ProtocolFile<{}>['modules']
  commands: RunTimeCommand[]
}): DeprecatedLabwarePositionCheckStep[] => {
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
