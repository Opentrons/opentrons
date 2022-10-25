import { getPipetteMount } from '../../Devices/ProtocolRun/utils/getPipetteMount'
import { getLabwareLocation } from '../../Devices/ProtocolRun/utils/getLabwareLocation'
import { useProtocolDetailsForRun } from '../../Devices/hooks/useProtocolDetailsForRun'
import { useCurrentRunId } from '../../ProtocolUpload/hooks'
import { useDeprecatedSteps } from './useDeprecatedSteps'
import { useSections } from './useSections'
import type { PickUpTipCreateCommand } from '@opentrons/shared-data/protocol/types/schemaV6/command/pipetting'
import type { DeprecatedSection } from '../types'

interface IntroInfo {
  primaryPipetteMount: string
  secondaryPipetteMount: string
  firstTiprackSlot: string
  sections: DeprecatedSection[]
}
export function useIntroInfo(): IntroInfo | null {
  const runId = useCurrentRunId()
  const { protocolData } = useProtocolDetailsForRun(runId)
  const steps = useDeprecatedSteps(runId)
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
