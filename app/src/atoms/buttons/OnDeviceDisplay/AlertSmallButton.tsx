import styled from 'styled-components'
import {
  TYPOGRAPHY,
  COLORS,
  SPACING,
  NewPrimaryBtn,
  styleProps,
} from '@opentrons/components'

export const AlertSmallButton = styled(NewPrimaryBtn)`
  background-color: ${COLORS.errorEnabled};
  border-radius: 12px;
  box-shadow: none;
  padding-left: ${SPACING.spacing4};
  padding-right: ${SPACING.spacing4};
  line-height: ${TYPOGRAPHY.lineHeight20};
  text-transform: ${TYPOGRAPHY.textTransformNone};
  ${TYPOGRAPHY.pSemiBold}

  ${styleProps}

  &:focus-visible {
    background-color: #e31e1e;
    box-shadow: 0 0 0 3px ${COLORS.fundamentalsFocus};
  }

  &:active {
    background-color: #e31e1e;
  }

  &:hover {
    background-color: ${COLORS.errorEnabled};
  }

  &:disabled {
    background-color: ${COLORS.darkBlackEnabled}${COLORS.opacity20HexCode};
    color: ${COLORS.darkBlackEnabled}${COLORS.opacity55HexCode};
  }
`
