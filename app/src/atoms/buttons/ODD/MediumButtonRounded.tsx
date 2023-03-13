import styled from 'styled-components'
import {
  TYPOGRAPHY,
  COLORS,
  SPACING,
  BORDERS,
  NewPrimaryBtn,
  styleProps,
} from '@opentrons/components'

export const MediumButtonRounded = styled(NewPrimaryBtn)`
  background-color: ${COLORS.blueEnabled};
  border-radius: ${BORDERS.size_six};
  box-shadow: none;
  height: '4.25rem';
  font-size: ${TYPOGRAPHY.fontSize28};
  font-weight: ${TYPOGRAPHY.fontWeightSemiBold};
  line-height: ${TYPOGRAPHY.lineHeight36};
  padding: ${SPACING.spacing4} ${SPACING.spacing6};
  text-transform: ${TYPOGRAPHY.textTransformNone};
  width: '13.375rem';

  ${styleProps}

  &:focus-visible {
    box-shadow: 0 0 0 3px ${COLORS.fundamentalsFocus};
  }

  &:active {
    background-color: ${COLORS.blueEnabled};
  }

  &:disabled {
    background-color: ${COLORS.darkBlack_twenty};
    color: ${COLORS.darkBlack_sixty};
  }
`
