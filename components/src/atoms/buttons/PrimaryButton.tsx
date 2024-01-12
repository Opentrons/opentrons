import styled from 'styled-components'
import { LEGACY_COLORS, BORDERS, TYPOGRAPHY, SPACING } from '../../ui-style-constants'
import { NewPrimaryBtn, styleProps } from '../../primitives'

export const PrimaryButton = styled(NewPrimaryBtn)`
  background-color: ${LEGACY_COLORS.blueEnabled};
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
    box-shadow: 0 0 0 3px ${LEGACY_COLORS.warningEnabled};
  }

  &:active {
    background-color: ${COLORS.blue60};
  }

  &:disabled {
    background-color: ${LEGACY_COLORS.darkGreyDisabled};
    color: ${LEGACY_COLORS.errorDisabled};
  }
`
