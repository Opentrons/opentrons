import styled from 'styled-components'
import { Btn, COLORS, TEXT_ALIGN_LEFT, TYPOGRAPHY } from '@opentrons/components'

import type { PrimitiveComponent } from '@opentrons/components'

type BtnComponent = PrimitiveComponent<'button'>

export const OverflowMenuBtn: BtnComponent = styled(Btn)`
  width: 153px;
  text-align: ${TEXT_ALIGN_LEFT};
  font-size: ${TYPOGRAPHY.fontSizeP};
  padding-bottom: ${TYPOGRAPHY.fontSizeH6};
  background-color: transparent;
  color: ${COLORS.darkBlack};
  padding-left: ${TYPOGRAPHY.fontSizeLabel};
  padding-right: ${TYPOGRAPHY.fontSizeLabel};
  padding-top: 8px;

  &:hover {
    background-color: ${COLORS.lightBlue};
  }

  &:focus,
  &:active {
    font-weight: 600;
  }

  &:disabled,
  &.disabled {
    color: ${COLORS.greyDisabled};
  }
`
