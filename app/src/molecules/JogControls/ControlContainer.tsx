import React from 'react'
import { css } from 'styled-components'
import {
  BORDERS,
  LEGACY_COLORS,
  DIRECTION_COLUMN,
  JUSTIFY_CENTER,
  Flex,
  SPACING,
} from '@opentrons/components'
import { StyledText } from '../../atoms/text'
import type { StyleProps } from '@opentrons/components'

interface ControlContainerProps extends StyleProps {
  title: string
  children: React.ReactNode
}

const CONTROL_CHILDREN_STYLES = css`
  background-color: ${COLORS.grey10};
  border-radius: ${BORDERS.radiusSoftCorners};
  padding: ${SPACING.spacing16};
  width: 100%;
  height: 9.75rem;

  @media screen and (max-width: 750px) {
    height: 15.875rem;
    justify-content: ${JUSTIFY_CENTER};
  }
`

export const ControlContainer = (props: ControlContainerProps): JSX.Element => {
  const { title, children } = props
  return (
    <Flex width="100%" flexDirection={DIRECTION_COLUMN}>
      <StyledText as="h6" marginY={SPACING.spacing8}>
        {title}
      </StyledText>
      <Flex css={CONTROL_CHILDREN_STYLES}>{children}</Flex>
    </Flex>
  )
}
