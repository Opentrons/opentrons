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
  padding-bottom: ${TYPOGRAPHY.fontSizeH6};
  background-color: transparent;
  color: ${COLORS.darkBlack};
  padding-left: ${TYPOGRAPHY.fontSizeLabel};
  padding-right: ${TYPOGRAPHY.fontSizeLabel};
  padding-top: ${SPACING.spacing3};

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
