import * as React from 'react'
import { css } from 'styled-components'
import {
  ALIGN_CENTER,
  BORDERS,
  Box,
  Btn,
  COLORS,
  Flex,
  Icon,
  IconName,
  SPACING,
  StyledText,
} from '@opentrons/components'

export interface StepContainerProps {
  /** id attribute */
  id?: string
  /** text of title */
  title: string
  /** optional icon left of the title */
  iconName?: IconName | null
  /** optional click action (on title div, not children) */
  onClick?: (event: React.MouseEvent) => void
  /** optional mouseEnter action */
  onMouseEnter?: (event: React.MouseEvent) => void
  /** optional mouseLeave action */
  onMouseLeave?: (event: React.MouseEvent) => void
  selected?: boolean
  hovered?: boolean
  iconColor?: string
}

export function StepContainer(props: StepContainerProps): JSX.Element {
  const {
    id,
    iconName,
    onMouseEnter,
    onMouseLeave,
    selected,
    onClick,
    hovered,
    iconColor,
  } = props

  let backgroundColor = COLORS.blue20
  let color = COLORS.black90
  if (selected) {
    backgroundColor = COLORS.blue50
    color = COLORS.white
  }
  if (hovered) {
    backgroundColor = COLORS.grey20
    color = COLORS.grey40
  }
  return (
    <Box id={id} {...{ onMouseEnter, onMouseLeave }}>
      <Btn
        onClick={onClick}
        padding={SPACING.spacing12}
        marginBottom={SPACING.spacing4}
        css={css`
          background-color: ${backgroundColor};
          color: ${color};
        `}
        borderRadius={BORDERS.borderRadius8}
        width="100%"
      >
        <Flex alignItems={ALIGN_CENTER} gridGap={SPACING.spacing8}>
          {iconName && (
            <Icon size="1rem" name={iconName} color={iconColor ?? color} />
          )}
          <StyledText desktopStyle="bodyDefaultRegular">
            {props.title}
          </StyledText>
        </Flex>
      </Btn>
    </Box>
  )
}
