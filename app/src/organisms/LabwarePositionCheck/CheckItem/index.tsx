import * as React from 'react'
import {
  DIRECTION_COLUMN,
  Flex,
  JUSTIFY_CENTER,
  SPACING,
  TYPOGRAPHY,
} from '@opentrons/components'
import { StyledText } from '../../../atoms/text'
import { PrimaryButton } from '../../../atoms/buttons'
import { PrepareSpace } from './PrepareSpace'
import type { CompletedProtocolAnalysis } from '@opentrons/shared-data'
import type { CheckTipRacksStep } from '../types'

interface CheckItemProps extends Omit<CheckTipRacksStep, 'section'>{
  runId: string
  protocolData: CompletedProtocolAnalysis
  proceed: () => void
}
export const CheckItem = (
  props: CheckItemProps
): JSX.Element | null => {
  return (
    <Flex flexDirection={DIRECTION_COLUMN}>
      <StyledText
        as="h3"
        textTransform={TYPOGRAPHY.textTransformUppercase}
        fontWeight={TYPOGRAPHY.fontWeightSemiBold}
      >
        CHECK ITEM
      </StyledText>
      <PrepareSpace {...props} />
      <Flex justifyContent={JUSTIFY_CENTER} marginTop={SPACING.spacing4}>
        <PrimaryButton onClick={props.proceed}>CONFIRM POSITION</PrimaryButton>
      </Flex>
    </Flex>
  )
}
