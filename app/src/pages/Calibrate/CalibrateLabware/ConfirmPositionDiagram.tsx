// diagram and instructions for ConfirmPositionContents
import * as React from 'react'
import { ALIGN_STRETCH, Flex } from '@opentrons/components'

import type { Labware, Pipette } from '../../../redux/robot'

import { InstructionStep } from '../../../molecules/InstructionStep'
import { getInstructionsByType, getDiagramSrc } from './instructions-data'

export interface LabwareCalibrationProps {
  labware: Labware
  calibrator: Pipette
  calibrateToBottom: boolean
  buttonText: string
  useCenteredTroughs: boolean
}

export function ConfirmPositionDiagram(
  props: LabwareCalibrationProps
): JSX.Element {
  const instructions = getInstructionsByType(props)
  const diagrams = getDiagramSrc(props)

  return (
    diagrams && (
      <Flex width="100%" alignItems={ALIGN_STRETCH}>
        <InstructionStep step={'one'} diagram={diagrams.one}>
          {instructions.one}
        </InstructionStep>
        <InstructionStep step={'two'} diagram={diagrams.two}>
          {instructions.two}
        </InstructionStep>
      </Flex>
    )
  )
}
