import styled from 'styled-components'

import {
  BORDERS,
  Btn,
  COLORS,
  SPACING,
  styleProps,
  TYPOGRAPHY,
} from '@opentrons/components'

export const TertiaryButton: typeof Btn = styled(Btn)`
  background-color: ${COLORS.blue50};
  border-radius: ${BORDERS.borderRadiusFull};
  box-shadow: none;
  color: ${COLORS.white};
  overflow: no-wrap;
  padding: ${SPACING.spacing8} ${SPACING.spacing16};
  text-transform: ${TYPOGRAPHY.textTransformNone};
  white-space: nowrap;
  ${TYPOGRAPHY.labelSemiBold}

  ${styleProps as any}

  &:hover {
    background-color: ${COLORS.blue55};
    box-shadow: none;
  }

  &:active {
    background-color: ${COLORS.blue60};
  }

  &:focus-visible {
    background-color: ${COLORS.blue55};
    box-shadow: 0 0 0 3px ${COLORS.blue50};
  }

  &:disabled {
    background-color: ${COLORS.grey30};
    color: ${COLORS.grey40};
  }
`
