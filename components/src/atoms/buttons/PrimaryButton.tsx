import styled from 'styled-components'
import { BORDERS, TYPOGRAPHY, SPACING } from '../../ui-style-constants'
import { COLORS } from '../../helix-design-system'
import { NewPrimaryBtn, styleProps } from '../../primitives'

export const PrimaryButton = styled(NewPrimaryBtn)`
  background-color: ${COLORS.blue50};
  border-radius: ${BORDERS.radiusSoftCorners};
  box-shadow: none;
  padding-left: ${SPACING.spacing16};
  padding-right: ${SPACING.spacing16};
  line-height: ${TYPOGRAPHY.lineHeight20};
  text-transform: ${TYPOGRAPHY.textTransformNone};
  ${TYPOGRAPHY.pSemiBold}

  ${styleProps}

  &:hover,
  &:focus {
    background-color: ${COLORS.blue55};
    box-shadow: none;
  }

  &:focus-visible {
    box-shadow: 0 0 0 3px ${COLORS.yellow50};
  }

  &:active {
    background-color: ${COLORS.blue60};
  }

  &:disabled {
    background-color: ${COLORS.grey30};
    color: ${COLORS.grey40};
  }
`
