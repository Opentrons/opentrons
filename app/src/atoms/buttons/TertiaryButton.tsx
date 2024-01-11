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
  background-color: ${COLORS.blueEnabled};
  border-radius: ${BORDERS.radiusRoundEdge};
  box-shadow: none;
  color: ${COLORS.grey35};
  overflow: no-wrap;
  padding-left: ${SPACING.spacing16};
  padding-right: ${SPACING.spacing16};
  text-transform: ${TYPOGRAPHY.textTransformNone};
  white-space: nowrap;
  ${TYPOGRAPHY.labelSemiBold}

  ${styleProps}

  &:hover {
    background-color: ${COLORS.blueHover};
    box-shadow: none;
  }

  &:active {
    background-color: ${COLORS.bluePressed};
  }

  &:focus-visible {
    box-shadow: 0 0 0 3px ${COLORS.fundamentalsFocus};
  }

  &:disabled {
    background-color: ${COLORS.grey50Disabled};
    color: ${COLORS.grey40};
  }
`
