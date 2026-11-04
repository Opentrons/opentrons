import styled from 'styled-components'

import { BORDERS, COLORS } from '../../../helix-design-system'
import { Btn, styleProps } from '../../../primitives'
import { SPACING, TYPOGRAPHY } from '../../../ui-style-constants'

import type { StyledComponent } from 'styled-components'

export const DefaultPrimaryButton: StyledComponent<any, any> = styled(Btn)`
  color: ${COLORS.white};
  background-color: ${COLORS.blue50};
  border-radius: ${BORDERS.borderRadius8};
  box-shadow: none;
  padding: ${SPACING.spacing8} ${SPACING.spacing16};
  line-height: ${TYPOGRAPHY.lineHeight20};
  text-transform: ${TYPOGRAPHY.textTransformNone};
  font-size: ${TYPOGRAPHY.fontSizeH3};
  font-weight: ${TYPOGRAPHY.fontWeightSemiBold};
  line-height: ${TYPOGRAPHY.lineHeight20};

  ${styleProps as any}

  &:hover {
    background-color: ${COLORS.blue55};
    box-shadow: none;
  }

  &:focus-visible {
    outline: 2px solid ${COLORS.blue50};
    outline-offset: 0.125rem;
  }

  &:active {
    background-color: ${COLORS.blue60};
  }

  &:disabled {
    background-color: ${COLORS.grey30};
    color: ${COLORS.grey40};
  }
`
