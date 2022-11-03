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
  background-color: ${COLORS.transparent};
  color: ${COLORS.darkBlackEnabled};
  padding: ${SPACING.spacing3} 0.75rem ${SPACING.spacing3} 0.75rem;

  &:hover {
    background-color: ${COLORS.lightBlue};
  }

  &:disabled,
  &.disabled {
    background-color: ${COLORS.transparent};
    color: ${COLORS.black}${COLORS.opacity50HexCode};
  }
`
