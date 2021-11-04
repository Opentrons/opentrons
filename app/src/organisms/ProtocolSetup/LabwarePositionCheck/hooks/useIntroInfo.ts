import { useSelector } from 'react-redux'
import { getPipetteNameSpecs } from '@opentrons/shared-data'
import { getProtocolData } from '../../../../redux/protocol'
import { getPipetteMount } from '../../utils/getPipetteMount'
import { getLabwareLocation } from '../../utils/getLabwareLocation'
import { useSteps } from './useSteps'
import { useSections } from './useSections'
import type { PipetteName, ProtocolFile } from '@opentrons/shared-data'
import type { PickUpTipCommand } from '@opentrons/shared-data/protocol/types/schemaV6/command/pipetting'
import type { State } from '../../../../redux/types'
import type { Section } from '../types'

interface IntroInfo {
  primaryTipRackSlot: string
  primaryTipRackName: string
  primaryPipetteMount: string
  secondaryPipetteMount: string
  numberOfTips: number
  firstStepLabwareSlot: string
  sections: Section[]
}
export function useIntroInfo(): IntroInfo | null {
  // @ts-expect-error casting to a v6 protocol, switch this to grab from react query once we make the switch
  const protocolData: ProtocolFile<{}> = useSelector((state: State) =>
    getProtocolData(state)
  )
  const steps = useSteps()
  const sections = useSections()
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

  const {
    pipetteId: primaryPipetteId,
    labwareId: pickUpTipLabwareId,
  } = (pickUpTipStep.commands[0] as PickUpTipCommand).params
  const primaryPipetteName = protocolData.pipettes[primaryPipetteId].name
  const primaryPipetteMount = getPipetteMount(
    primaryPipetteId,
    protocolData.commands
  )
  const secondaryPipetteMount =
    primaryPipetteMount === 'right' ? 'left' : 'right'
  const primaryPipetteSpecs =
    primaryPipetteName != null
      ? getPipetteNameSpecs(primaryPipetteName as PipetteName)
      : null
  const pickUpTipLabware = protocolData.labware[pickUpTipLabwareId]
  // find name and slot number for tiprack used for check
  const primaryTipRackName =
    'displayName' in pickUpTipLabware ? pickUpTipLabware?.displayName : null
  const primaryTipRackSlot = getLabwareLocation(
    pickUpTipLabwareId,
    protocolData.commands
  )

  // find how many channels pipette for check has for dynmic text
  const numberOfTips = primaryPipetteSpecs?.channels

  // find the slot for the first labware that will be checked for button
  const firstTiprackToCheckId = steps[0].labwareId
  const firstStepLabwareSlot = getLabwareLocation(
    firstTiprackToCheckId,
    protocolData.commands
  )

  if (
    primaryTipRackSlot == null ||
    primaryTipRackName == null ||
    numberOfTips == null ||
    firstStepLabwareSlot == null
  )
    return null // this state should never be reached

  return {
    primaryTipRackSlot,
    primaryTipRackName,
    primaryPipetteMount,
    secondaryPipetteMount,
    numberOfTips,
    firstStepLabwareSlot,
    sections,
  }
}
