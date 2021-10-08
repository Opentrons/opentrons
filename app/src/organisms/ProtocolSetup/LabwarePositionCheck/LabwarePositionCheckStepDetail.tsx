import * as React from 'react'
import {
  C_NEAR_WHITE,
  FONT_SIZE_CAPTION,
  SPACING_2,
  JUSTIFY_CENTER,
  SPACING_4,
  Flex,
} from '@opentrons/components'
import { StepDetailText } from './StepDetailText'
import { LabwarePositionCheckStep } from './types'
interface LabwarePositionCheckStepDetailProps {
  selectedStep: LabwarePositionCheckStep
}
export const LabwarePositionCheckStepDetail = (
  props: LabwarePositionCheckStepDetailProps
): JSX.Element | null => {
  return (
    <Flex
      fontSize={FONT_SIZE_CAPTION}
      padding={SPACING_2}
      width="30rem"
      justifyContent={JUSTIFY_CENTER}
      marginTop={SPACING_4}
      marginLeft="24rem"
      boxShadow="1px 1px 1px rgba(0, 0, 0, 0.25)"
      borderRadius="4px"
      backgroundColor={C_NEAR_WHITE}
    >
      <StepDetailText selectedStep={props.selectedStep} />
    </Flex>
  )
}
