import { useProtocolDetails } from '../../../RunDetails/hooks'
import { getPipetteMount } from '../../utils/getPipetteMount'
import { getLabwareLocation } from '../../utils/getLabwareLocation'
import { useSteps } from './useSteps'
import { useSections } from './useSections'
import type { PickUpTipCreateCommand } from '@opentrons/shared-data/protocol/types/schemaV6/command/pipetting'
import type { Section } from '../types'
import { useProtocolDetailsForRun } from '../../../Devices/hooks'

interface IntroInfo {
  primaryPipetteMount: string
  secondaryPipetteMount: string
  firstTiprackSlot: string
  sections: Section[]
}
export function useIntroInfo(runId: string | null): IntroInfo | null {
  const { protocolData } = useProtocolDetailsForRun(runId)
  const steps = useSteps(runId)
  const sections = useSections(runId)
  if (
    protocolData == null ||
    !('pipettes' in protocolData) ||
    !('labware' in protocolData)
  )
    return null // this state should never be reached

  // find which tiprack primary pipette will use for check

  const pickUpTipStep = steps.find(
    step => step.commands[0].commandType === 'pickUpTip'
  )
  if (pickUpTipStep == null) return null // this state should never be reached

  const { pipetteId: primaryPipetteId } = (pickUpTipStep
    .commands[0] as PickUpTipCreateCommand).params
  const primaryPipetteMount = getPipetteMount(
    primaryPipetteId,
    protocolData.commands
  )
  const secondaryPipetteMount =
    primaryPipetteMount === 'right' ? 'left' : 'right'

  // find the slot for the first labware that will be checked for button
  const firstTiprackToCheckId = steps[0].labwareId
  const firstTiprackLocation = getLabwareLocation(
    firstTiprackToCheckId,
    protocolData.commands
  )
  if (!('slotName' in firstTiprackLocation)) {
    throw new Error('expected tiprack location to be a slot')
  }

  return {
    primaryPipetteMount,
    secondaryPipetteMount,
    firstTiprackSlot: firstTiprackLocation.slotName,
    sections,
  }
}
