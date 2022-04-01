import styled from 'styled-components'
import {
  SPACING,
  Btn,
  COLORS,
  TEXT_ALIGN_LEFT,
  TYPOGRAPHY,
} from '@opentrons/components'

import type { PrimitiveComponent } from '@opentrons/components'

type BtnComponent = PrimitiveComponent<'button'>

export const MenuItem: BtnComponent = styled(Btn)`
  text-align: ${TEXT_ALIGN_LEFT};
  font-size: ${TYPOGRAPHY.fontSizeP};
  background-color: transparent;
  color: ${COLORS.darkBlack};
  padding: ${SPACING.spacing3} ${SPACING.spacing4};

  &:hover {
    background-color: ${COLORS.lightBlue};
  }

  &:focus,
  &:active {
    font-weight: ${TYPOGRAPHY.fontWeightSemiBold};
  }

  &:disabled,
  &.disabled {
    color: ${COLORS.greyDisabled};
  }
`
