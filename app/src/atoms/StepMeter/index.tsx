import * as React from 'react'
import { css } from 'styled-components'
import {
  Box,
  COLORS,
  SPACING,
  POSITION_RELATIVE,
  POSITION_ABSOLUTE,
} from '@opentrons/components'

interface StepMeterProps {
  totalSteps: number
  currentStep: number | null
}

export const StepMeter = (props: StepMeterProps): JSX.Element => {
  const { totalSteps, currentStep } = props
  const progress = currentStep || 0
  const percentComplete = `${(progress / totalSteps) * 100}%`

  const progressBarContainer = css`
    position: ${POSITION_RELATIVE};
    height: ${SPACING.spacing2};
    margin-bottom: ${SPACING.spacing4};
    background-color: #d9d9d9;
  `
  const progressBar = css`
    position: ${POSITION_ABSOLUTE};
    top: 0;
    height: 100%;
    background-color: ${COLORS.blue};
    width: ${percentComplete};
    webkit-transition: width 1s ease-in-out;
    moz-transition: width 1s ease-in-out;
    o-transition: width 1s ease-in-out;
    transition: width 1s ease-in-out;
  `

  return (
    <Box css={progressBarContainer}>
      <Box css={progressBar} />
    </Box>
  )
}
