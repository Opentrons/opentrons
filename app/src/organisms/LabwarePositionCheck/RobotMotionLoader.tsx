import * as React from 'react'
import styled from 'styled-components'
import {
  Icon,
  Flex,
  COLORS,
  RESPONSIVENESS,
  TYPOGRAPHY,
  SIZE_4,
  JUSTIFY_CENTER,
  ALIGN_CENTER,
  DIRECTION_COLUMN,
  SPACING,
} from '@opentrons/components'
import { StyledText } from '../../atoms/text'

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
      gridGap={SPACING.spacing24}
    >
      <Icon
        name="ot-spinner"
        spin
        size={SIZE_4}
        color={COLORS.darkGreyEnabled}
      />
      {header != null ? <LoadingText>{header}</LoadingText> : null}
      {body != null ? <StyledText as="p">{body}</StyledText> : null}
    </Flex>
  )
}

const LoadingText = styled.h1`
  ${TYPOGRAPHY.h1Default}

  @media ${RESPONSIVENESS.touchscreenMediaQuerySpecs} {
    ${TYPOGRAPHY.level4HeaderSemiBold}
  }
`
