import * as React from 'react'
import { css } from 'styled-components'
import {
  Box,
  COLORS,
  SPACING,
  POSITION_RELATIVE,
  POSITION_ABSOLUTE,
  RESPONSIVENESS,
} from '@opentrons/components'

interface StepMeterProps {
  totalSteps: number
  currentStep: number | null
}

export const StepMeter = (props: StepMeterProps): JSX.Element => {
  const { totalSteps, currentStep } = props
  const prevPercentComplete = React.useRef(0)
  const progress = currentStep != null ? currentStep : 0
  const percentComplete =
    //    this logic puts a cap at 100% percentComplete which we should never run into
    currentStep != null && currentStep > totalSteps
      ? 100
      : (progress / totalSteps) * 100

  const StepMeterContainer = css`
    position: ${POSITION_RELATIVE};
    height: ${SPACING.spacing4};
    background-color: ${COLORS.medGreyEnabled};
    @media ${RESPONSIVENESS.touchscreenMediaQuerySpecs} {
      height: ${SPACING.spacing12};
    }
  `

  const ODD_ANIMATION_OPTIMIZATIONS = `
  backface-visibility: hidden;
  perspective: 1000;
  will-change: transform;
  `

  const StepMeterBar = css`
    ${ODD_ANIMATION_OPTIMIZATIONS}
    position: ${POSITION_ABSOLUTE};
    top: 0;
    height: 100%;
    background-color: ${COLORS.blueEnabled};
    width: ${percentComplete}%;
    transform: translateX(0);
    transition: ${prevPercentComplete.current <= percentComplete
      ? 'width 0.5s ease-in-out'
      : ''};
  `

  prevPercentComplete.current = percentComplete

  return (
    <Box data-testid="StepMeter_StepMeterContainer" css={StepMeterContainer}>
      <Box data-testid="StepMeter_StepMeterBar" css={StepMeterBar} />
    </Box>
  )
}
