import last from 'lodash/last'
import { SECTIONS } from '../constants'
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
} from './deprecatedStepCreators'
import type {
  LabwareDefinition2,
  RunTimeCommand,
  ProtocolAnalysisOutput,
} from '@opentrons/shared-data'

import type {
  LabwarePositionCheckStep,
  CheckTipRacksStep,
  PickUpTipStep,
  CheckLabwareStep,
  ReturnTipStep,
} from '../types'
interface LPCArgs {
  primaryPipetteId: string
  secondaryPipetteId: string
  labware: ProtocolAnalysisOutput['labware']
  modules: ProtocolAnalysisOutput['modules']
  commands: RunTimeCommand[]
}

export const getLabwarePositionCheckSteps = (args: LPCArgs): LabwarePositionCheckStep[] => {
  const checkTipRacksSectionSteps = getCheckTipRackSectionSteps(args)
  if (checkTipRacksSectionSteps.length < 1) return []

  const lastTiprackCheckStep = checkTipRacksSectionSteps[checkTipRacksSectionSteps.length - 1]
  const pickUpTipSectionStep: PickUpTipStep = {
    section: SECTIONS.PICK_UP_TIP,
    labwareId: lastTiprackCheckStep.labwareId,
    pipetteId: lastTiprackCheckStep.pipetteId,
  }

  const checkLabwareSteps = getCheckLabwareSectionSteps(args)

  const returnTipSectionStep: ReturnTipStep = {
    section: SECTIONS.RETURN_TIP,
    labwareId: lastTiprackCheckStep.labwareId,
    pipetteId: lastTiprackCheckStep.pipetteId,
  }

  return [
    { section: SECTIONS.BEFORE_BEGINNING },
    ...checkTipRacksSectionSteps,
    pickUpTipSectionStep,
    ...checkLabwareSteps,
    returnTipSectionStep,
    { section: SECTIONS.RESULTS_SUMMARY},
  ]
}



function getCheckTipRackSectionSteps(args: LPCArgs): CheckTipRacksStep[] {
  const { secondaryPipetteId, primaryPipetteId, commands, labware } = args
  const orderedTiprackIdsThatSecondaryPipetteUses = getAllTipracksIdsThatPipetteUsesInOrder(
    secondaryPipetteId,
    commands,
    labware,
  )

  const orderedTiprackIdsThatPrimaryPipetteUses = getAllTipracksIdsThatPipetteUsesInOrder(
    primaryPipetteId,
    commands,
    labware,
  )

  const orderedTiprackIdsThatOnlySecondaryPipetteUses = orderedTiprackIdsThatSecondaryPipetteUses.filter(
    tiprackId => !orderedTiprackIdsThatPrimaryPipetteUses.includes(tiprackId)
  )

  const remainingTiprackIdsThatPrimaryPipetteUses = orderedTiprackIdsThatPrimaryPipetteUses.filter(
    tiprackId =>
      !orderedTiprackIdsThatOnlySecondaryPipetteUses.includes(tiprackId)
  )

  return [
    ...orderedTiprackIdsThatOnlySecondaryPipetteUses.map(labwareId => ({
      labwareId,
      pipetteId: secondaryPipetteId,
      section: SECTIONS.CHECK_TIP_RACKS
    })),
    ...remainingTiprackIdsThatPrimaryPipetteUses.map(labwareId => ({
      labwareId,
      pipetteId: primaryPipetteId,
      section: SECTIONS.CHECK_TIP_RACKS
    }))
  ]
}

function getCheckLabwareSectionSteps(args: LPCArgs): CheckLabwareStep[] {
  const {labware, commands, primaryPipetteId} = args
  const orderedLabwareIds = getLabwareIdsInOrder(labware, commands)

  return orderedLabwareIds.map(labwareId => ({
    section: SECTIONS.CHECK_LABWARE,
    labwareId,
    pipetteId: primaryPipetteId
  }))
}