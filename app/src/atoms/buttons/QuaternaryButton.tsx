import styled from 'styled-components'
import {
  NewSecondaryBtn,
  SPACING,
  LEGACY_COLORS,
  BORDERS,
  TYPOGRAPHY,
  styleProps,
} from '@opentrons/components'

export const QuaternaryButton = styled(NewSecondaryBtn)`
  background-color: ${LEGACY_COLORS.white};
  border-radius: ${BORDERS.radiusRoundEdge};
  box-shadow: none;
  color: ${COLORS.blue50};
  overflow: no-wrap;
  padding-left: ${SPACING.spacing16};
  padding-right: ${SPACING.spacing16};
  text-transform: ${TYPOGRAPHY.textTransformNone};
  white-space: nowrap;
  ${TYPOGRAPHY.labelSemiBold}

  ${styleProps}

  &:hover {
    opacity: 70%;
    box-shadow: 0 0 0;
  }
  &:focus-visible {
    box-shadow: 0 0 0 3px ${LEGACY_COLORS.warningEnabled};
  }

  &:disabled {
    opacity: 50%;
  }
`
