import styled from 'styled-components'
import { BORDERS, TYPOGRAPHY, SPACING } from '../../ui-style-constants'
import { COLORS } from '../../helix-design-system'
import { NewAlertPrimaryBtn, styleProps } from '../../primitives'

export const AlertPrimaryButton = styled(NewAlertPrimaryBtn)`
  background-color: ${COLORS.red50};
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
    background-color: ${COLORS.grey30};
    color: ${COLORS.grey40};
  }
`
