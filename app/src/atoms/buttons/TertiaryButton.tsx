import styled from 'styled-components'
import {
  NewPrimaryBtn,
  SPACING,
  COLORS,
  BORDERS,
  TYPOGRAPHY,
  styleProps,
} from '@opentrons/components'

export const TertiaryButton = styled(NewPrimaryBtn)`
  background-color: ${COLORS.blue50};
  border-radius: ${BORDERS.radiusRoundEdge};
  box-shadow: none;
  color: ${COLORS.white};
  overflow: no-wrap;
  padding-left: ${SPACING.spacing16};
  padding-right: ${SPACING.spacing16};
  text-transform: ${TYPOGRAPHY.textTransformNone};
  white-space: nowrap;
  ${TYPOGRAPHY.labelSemiBold}

  ${styleProps}

  &:hover {
    background-color: ${COLORS.blue55};
    box-shadow: none;
  }

  &:active {
    background-color: ${COLORS.blue60};
  }

  &:focus-visible {
    background-color: ${COLORS.blue55};
    box-shadow: 0 0 0 3px ${COLORS.yellow50};
  }

  &:disabled {
    background-color: ${COLORS.grey30};
    color: ${COLORS.grey40};
  }
`
