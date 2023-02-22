import styled from 'styled-components'
import {
  TYPOGRAPHY,
  COLORS,
  SPACING,
  NewPrimaryBtn,
  styleProps,
} from '@opentrons/components'

export const OnDevicePrimaryButton = styled(NewPrimaryBtn)`
  background-color: ${COLORS.blueEnabled};
  border-radius: 12px;
  box-shadow: none;
  padding-left: ${SPACING.spacing4};
  padding-right: ${SPACING.spacing4};
  line-height: ${TYPOGRAPHY.lineHeight20};
  text-transform: ${TYPOGRAPHY.textTransformNone};
  ${TYPOGRAPHY.pSemiBold}

  ${styleProps}

  &:focus-visible {
    box-shadow: 0 0 0 3px ${COLORS.fundamentalsFocus};
  }

  &:active {
    background-color: #006cfa;
  }

  &:disabled {
    background-color: #16212d33;
    color: #16212d8c;
  }
`
