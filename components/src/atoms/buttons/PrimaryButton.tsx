import styled from 'styled-components'
import { COLORS, BORDERS, TYPOGRAPHY, SPACING } from '../../ui-style-constants'
import { NewPrimaryBtn, styleProps } from '../../primitives'

export const PrimaryButton = styled(NewPrimaryBtn)`
  background-color: ${COLORS.blueEnabled};
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
    background-color: ${COLORS.blueHover};
    box-shadow: none;
  }

  &:focus-visible {
    box-shadow: 0 0 0 3px ${COLORS.warningEnabled};
  }

  &:active {
    background-color: ${COLORS.bluePressed};
  }

  &:disabled {
    background-color: ${COLORS.darkGreyDisabled};
    color: ${COLORS.errorDisabled};
  }
`
