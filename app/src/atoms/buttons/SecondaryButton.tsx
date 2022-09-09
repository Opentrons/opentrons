import styled from 'styled-components'
import {
  NewSecondaryBtn,
  SPACING,
  COLORS,
  BORDERS,
  TYPOGRAPHY,
  styleProps,
} from '@opentrons/components'

export const SecondaryButton = styled(NewSecondaryBtn)`
  color: ${COLORS.blueEnabled};
  border-radius: ${BORDERS.radiusSoftCorners};
  padding-left: ${SPACING.spacing4};
  padding-right: ${SPACING.spacing4};
  text-transform: ${TYPOGRAPHY.textTransformNone};
  background-color: ${COLORS.transparent};
  ${TYPOGRAPHY.pSemiBold}
  background-color: ${COLORS.transparent};

  ${styleProps}

  &:hover {
    opacity: 70%;
    box-shadow: 0 0 0;
  }

  &:focus-visible {
    box-shadow: 0 0 0 3px ${COLORS.fundamentalsFocus};
  }

  &:disabled {
    opacity: 50%;
  }
`
