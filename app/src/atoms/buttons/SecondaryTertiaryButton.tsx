import styled from 'styled-components'
import {
  NewSecondaryBtn,
  SPACING,
  COLORS,
  BORDERS,
  TYPOGRAPHY,
  styleProps,
} from '@opentrons/components'

export const SecondaryTertiaryButton = styled(NewSecondaryBtn)`
  background-color: ${COLORS.white};
  border-radius: ${BORDERS.radiusRoundEdge};
  box-shadow: none;
  color: ${COLORS.blueEnabled};
  overflow: no-wrap;
  padding-left: ${SPACING.spacing4};
  padding-right: ${SPACING.spacing4};
  text-transform: ${TYPOGRAPHY.textTransformNone};
  white-space: nowrap;
  ${TYPOGRAPHY.labelSemiBold}

  ${styleProps}

  &:hover {
    opacity: 70%;
    box-shadow: 0 0 0;
  }
  &:focus-visible {
    box-shadow: 0 0 0 3px ${COLORS.warningEnabled};
  }

  &:disabled {
    opacity: 50%;
  }
`
