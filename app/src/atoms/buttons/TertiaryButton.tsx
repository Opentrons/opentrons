import styled from 'styled-components'
import {
  NewPrimaryBtn,
  SPACING,
  LEGACY_COLORS,
  BORDERS,
  TYPOGRAPHY,
  styleProps,
} from '@opentrons/components'

export const TertiaryButton = styled(NewPrimaryBtn)`
  background-color: ${COLORS.blue50};
  border-radius: ${BORDERS.radiusRoundEdge};
  box-shadow: none;
  color: ${COLORS.grey10};
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
    box-shadow: 0 0 0 3px ${COLORS.blue50};
  }

  &:disabled {
    background-color: ${COLORS.grey50Disabled};
    color: ${COLORS.grey40};
  }
`
