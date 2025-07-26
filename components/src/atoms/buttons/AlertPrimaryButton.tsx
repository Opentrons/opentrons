import styled from 'styled-components'

import { BORDERS, COLORS } from '../../helix-design-system'
import { Btn, styleProps } from '../../primitives'
import { SPACING, TYPOGRAPHY } from '../../ui-style-constants'

export const AlertPrimaryButton = styled(Btn)`
  color: ${COLORS.white};
  background-color: ${COLORS.red50};
  border-radius: ${BORDERS.borderRadius8};
  padding: ${SPACING.spacing8} ${SPACING.spacing16};
  text-transform: ${TYPOGRAPHY.textTransformNone};
  box-shadow: 0 0 0;
  ${TYPOGRAPHY.pSemiBold}

  ${styleProps}

  &:hover {
    box-shadow: 0 0 0;
    background-color: ${COLORS.red55};
  }

  &:disabled {
    background-color: ${COLORS.grey30};
    color: ${COLORS.grey40};
  }
`
