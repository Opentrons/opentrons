import styled from 'styled-components'
import {
  NewSecondaryBtn,
  SPACING,
  COLORS,
  BORDERS,
  TYPOGRAPHY,
  styleProps,
} from '@opentrons/components'

export const QuaternaryButton = styled(NewSecondaryBtn)`
  background-color: ${COLORS.white};
  border-radius: ${BORDERS.radiusRoundEdge};
  box-shadow: none;
<<<<<<< HEAD
  color: ${COLORS.blue50};
=======
  color: ${COLORS.blueEnabled};
>>>>>>> 2524ab95c98ff696e637a42d46ea6a893c63f735
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
    box-shadow: 0 0 0 3px ${COLORS.yellow50};
  }

  &:disabled {
    opacity: 50%;
  }
`
