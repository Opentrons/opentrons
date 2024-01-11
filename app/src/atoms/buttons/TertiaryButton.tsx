import styled from 'styled-components'
import {
  NewPrimaryBtn,
  SPACING,
  COLORS,
  BORDERS,
  TYPOGRAPHY,
  styleProps,
} from '@opentrons/components'

export const TertiaryButton = styled(NewPrimaryBtn)`
<<<<<<< HEAD
  background-color: ${COLORS.blue50};
=======
  background-color: ${COLORS.blueEnabled};
>>>>>>> 2524ab95c98ff696e637a42d46ea6a893c63f735
  border-radius: ${BORDERS.radiusRoundEdge};
  box-shadow: none;
  color: ${COLORS.grey35};
  overflow: no-wrap;
  padding-left: ${SPACING.spacing16};
  padding-right: ${SPACING.spacing16};
  text-transform: ${TYPOGRAPHY.textTransformNone};
  white-space: nowrap;
  ${TYPOGRAPHY.labelSemiBold}

  ${styleProps}

  &:hover {
<<<<<<< HEAD
    background-color: ${COLORS.blue55};
=======
    background-color: ${COLORS.blueHover};
>>>>>>> 2524ab95c98ff696e637a42d46ea6a893c63f735
    box-shadow: none;
  }

  &:active {
<<<<<<< HEAD
    background-color: ${COLORS.blue60};
=======
    background-color: ${COLORS.bluePressed};
>>>>>>> 2524ab95c98ff696e637a42d46ea6a893c63f735
  }

  &:focus-visible {
    box-shadow: 0 0 0 3px ${COLORS.fundamentalsFocus};
  }

  &:disabled {
    background-color: ${COLORS.grey50Disabled};
    color: ${COLORS.grey40};
  }
`
