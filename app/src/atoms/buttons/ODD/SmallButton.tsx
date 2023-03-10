import styled from 'styled-components'
import {
  TYPOGRAPHY,
  COLORS,
  SPACING,
  BORDERS,
  NewPrimaryBtn,
  styleProps,
} from '@opentrons/components'

export const SmallButton = styled(NewPrimaryBtn)`
  background-color: ${COLORS.blueEnabled};
  border-radius: ${BORDERS.size_three};
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
    background-color: ${COLORS.blueEnabled};
  }

  &:disabled {
    background-color: ${COLORS.darkBlackEnabled}${COLORS.opacity20HexCode};
    color: ${COLORS.darkBlackEnabled}${COLORS.opacity55HexCode};
  }
`
