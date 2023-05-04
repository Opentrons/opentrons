import { StyledText } from '../../atoms/text'
import {
  Icon,
  Flex,
  COLORS,
  SPACING,
  SIZE_4,
  JUSTIFY_CENTER,
  ALIGN_CENTER,
  DIRECTION_COLUMN,
} from '@opentrons/components'
import * as React from 'react'

interface RobotMotionLoaderProps {
  header?: string
  body?: string
}

export function RobotMotionLoader(props: RobotMotionLoaderProps): JSX.Element {
  const { header, body } = props
  return (
    <Flex
      flexDirection={DIRECTION_COLUMN}
      justifyContent={JUSTIFY_CENTER}
      alignItems={ALIGN_CENTER}
      minHeight="29.5rem"
    >
      <Icon
        name="ot-spinner"
        spin
        size={SIZE_4}
        color={COLORS.darkGreyEnabled}
      />
      {header != null ? (
        <StyledText as="h1" marginTop={SPACING.spacing24}>
          {header}
        </StyledText>
      ) : null}
      {body != null ? <StyledText as="p">{body}</StyledText> : null}
    </Flex>
  )
}
