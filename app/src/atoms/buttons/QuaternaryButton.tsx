import styled from 'styled-components'

import {
  BORDERS,
  COLORS,
  Btn,
  SPACING,
  styleProps,
  TYPOGRAPHY,
} from '@opentrons/components'

export const QuaternaryButton: typeof Btn = styled(Btn)`
  background-color: ${COLORS.white};
  border: 1px solid ${COLORS.blue50};
  border-radius: ${BORDERS.borderRadiusFull};
  box-shadow: none;
  color: ${COLORS.blue50};
  overflow: no-wrap;
  padding: ${SPACING.spacing8} ${SPACING.spacing16};
  text-transform: ${TYPOGRAPHY.textTransformNone};
  white-space: nowrap;
  ${TYPOGRAPHY.labelSemiBold}

  ${styleProps as any}

  &:hover {
    opacity: 70%;
    box-shadow: 0 0 0;
  }
  &:focus-visible {
    box-shadow: 0 0 0 3px ${COLORS.blue50};
  }

  &:disabled {
    opacity: 50%;
  }
`