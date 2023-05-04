import { NewAlertPrimaryBtn, styleProps } from '../../primitives'
import { COLORS, BORDERS, TYPOGRAPHY, SPACING } from '../../ui-style-constants'
import styled from 'styled-components'

export const AlertPrimaryButton = styled(NewAlertPrimaryBtn)`
  background-color: ${COLORS.errorEnabled};
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
    background-color: ${COLORS.darkGreyDisabled};
    color: ${COLORS.errorDisabled};
  }
`
