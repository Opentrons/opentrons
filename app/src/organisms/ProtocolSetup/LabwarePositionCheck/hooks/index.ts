import * as React from 'react'
import { useSelector } from 'react-redux'
import { getLabwarePositionCheckSteps } from '../getLabwarePositionCheckSteps'
import { getProtocolData } from '../../../../redux/protocol'
import { getPipetteNameSpecs } from '@opentrons/shared-data'

import type { PipetteName } from '@opentrons/shared-data'
import type { State } from '../../../../redux/types'
import type {
  PickUpTipCommand,
  LabwarePositionCheckStep,
  Section,
} from '../types'

type LabwareIdsBySection = {
  [section in Section]?: string[]
}

export function useSteps(): LabwarePositionCheckStep[] {
  const protocolData = useSelector((state: State) => getProtocolData(state))
  if (protocolData == null) return [] // this state should never be reached
  return getLabwarePositionCheckSteps(protocolData)
}

export function useSections(): Section[] {
  const steps = useSteps()
  return steps.reduce<Section[]>(
    (acc, step) => (acc.includes(step.section) ? acc : [...acc, step.section]),
    []
  )
}

export function useLabwareIdsBySection(): LabwareIdsBySection {
  const steps = useSteps()
  const sections = useSections()
  return sections.reduce<LabwareIdsBySection>(
    (labwareIdsBySection, section) => {
      return {
        ...labwareIdsBySection,
        [section]: steps.reduce<string[]>(
          (labwareIds, step) =>
            step.section === section
              ? [...labwareIds, step.labwareId]
              : labwareIds,
          []
        ),
      }
    },
    {}
  )
}

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
  const protocolData = useSelector((state: State) => getProtocolData(state))
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
    step => step.commands[0].command === 'pickUpTip'
  )
  if (pickUpTipStep == null) return null // this state should never be reached

  const {
    pipette: primaryPipetteId,
    labware: pickUpTipLabwareId,
  } = (pickUpTipStep.commands[0] as PickUpTipCommand).params
  const primaryPipetteName = protocolData.pipettes[primaryPipetteId].name
  const primaryPipetteMount = protocolData.pipettes[primaryPipetteId].mount
  const secondaryPipetteMount =
    protocolData.pipettes[primaryPipetteId].mount === 'right' ? 'left' : 'right'
  const primaryPipetteSpecs =
    primaryPipetteName != null
      ? getPipetteNameSpecs(primaryPipetteName as PipetteName)
      : null
  const pickUpTipLabware = protocolData.labware[pickUpTipLabwareId]
  // find name and slot number for tiprack used for check
  const primaryTipRackName =
    'displayName' in pickUpTipLabware ? pickUpTipLabware?.displayName : null
  const primaryTipRackSlot = pickUpTipLabware.slot

  // find how many channels pipette for check has for dynmic text
  const numberOfTips = primaryPipetteSpecs?.channels

  // find the slot for the first labware that will be checked for button
  const firstTiprackToCheckId = steps[0].labwareId
  const firstStepLabwareSlot = protocolData.labware[firstTiprackToCheckId].slot

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

export { useLabwarePositionCheck } from './useLabwarePositionCheck'
