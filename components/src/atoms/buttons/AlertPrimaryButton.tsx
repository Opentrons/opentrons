import styled from 'styled-components'
import { LEGACY_COLORS, BORDERS, TYPOGRAPHY, SPACING } from '../../ui-style-constants'
import { NewAlertPrimaryBtn, styleProps } from '../../primitives'

export const AlertPrimaryButton = styled(NewAlertPrimaryBtn)`
  background-color: ${LEGACY_COLORS.errorEnabled};
  border-radius: ${BORDERS.radiusSoftCorners};
  padding-left: ${SPACING.spacing16};
  padding-right: ${SPACING.spacing16};
  text-transform: ${TYPOGRAPHY.textTransformNone};
  box-shadow: 0 0 0;
  ${TYPOGRAPHY.pSemiBold}

  ${styleProps}

  &:hover {
    box-shadow: 0 0 0;
  }

  &:disabled {
    background-color: ${LEGACY_COLORS.darkGreyDisabled};
    color: ${LEGACY_COLORS.errorDisabled};
  }
`
