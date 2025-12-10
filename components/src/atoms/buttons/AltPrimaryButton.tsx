import styled from 'styled-components'

import { BORDERS, COLORS } from '../../helix-design-system'
import { Btn, styleProps } from '../../primitives'
import { SPACING, TYPOGRAPHY } from '../../ui-style-constants'

export const AltPrimaryButton = styled(Btn)`
  background-color: ${COLORS.grey30};
  color: ${COLORS.black90};
  padding: ${SPACING.spacing8} ${SPACING.spacing16};
  border-radius: ${BORDERS.borderRadius8};
  box-shadow: none;
  font-size: ${TYPOGRAPHY.fontSizeH3};
  font-weight: ${TYPOGRAPHY.fontWeightSemiBold};
  line-height: ${TYPOGRAPHY.lineHeight20};

  ${styleProps}

  &:hover {
    box-shadow: 0 0 0;
    background-color: ${COLORS.grey35};
  }

  &:active {
    background-color: ${COLORS.grey40};
  }

  &:active:hover {
    background-color: ${COLORS.grey40};
  }

  &:disabled {
    background-color: ${COLORS.grey30};
    color: ${COLORS.grey40};
  }
`
