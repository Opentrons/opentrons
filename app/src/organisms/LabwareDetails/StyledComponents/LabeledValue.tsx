import * as React from 'react'
import {
  ALIGN_CENTER,
  DIRECTION_ROW,
  Flex,
  JUSTIFY_SPACE_BETWEEN,
} from '@opentrons/components'
import { StyledText } from '../../../atoms/text'

export interface LabeledValueProps {
  label: string
  value: number | string
}

export function LabeledValue(props: LabeledValueProps): JSX.Element {
  return (
    <Flex
      flexDirection={DIRECTION_ROW}
      justifyContent={JUSTIFY_SPACE_BETWEEN}
      alignItems={ALIGN_CENTER}
    >
      <StyledText as="h6">{props.label}</StyledText>
      <StyledText as="p">{props.value}</StyledText>
    </Flex>
  )
}
