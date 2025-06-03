import { css } from 'styled-components'

import { COLORS } from '../../helix-design-system'
import { Box } from '../../primitives'
import { POSITION_ABSOLUTE, POSITION_RELATIVE } from '../../styles'
import { RESPONSIVENESS, SPACING } from '../../ui-style-constants'

import type { FlattenSimpleInterpolation } from 'styled-components'
import type { StyleProps } from '../../primitives'

interface StepMeterProps extends StyleProps {
  totalSteps: number
  currentStep: number | null
}

export const StepMeter = (props: StepMeterProps): JSX.Element => {
  const { totalSteps, currentStep, ...styleProps } = props
  const progress = currentStep != null ? currentStep : 0
  const percentComplete = `${
    //    this logic puts a cap at 100% percentComplete which we should never run into
    currentStep != null && currentStep > totalSteps
      ? 100
      : (progress / totalSteps) * 100
  }%`

  return (
    <Box
      data-testid="StepMeter_StepMeterContainer"
      css={StepMeterContainer(styleProps)}
      {...styleProps}
    >
      <Box
        data-testid="StepMeter_StepMeterBar"
        css={StepMeterBar(percentComplete)}
      />
    </Box>
  )
}

const StepMeterContainer = (
  styleProps: StyleProps
): FlattenSimpleInterpolation => css`
  position: ${styleProps.position ? styleProps.position : POSITION_RELATIVE};
  height: ${SPACING.spacing4};
  background-color: ${COLORS.grey30};
  @media ${RESPONSIVENESS.touchscreenMediaQuerySpecs} {
    height: ${SPACING.spacing12};
  }
`
const StepMeterBar = (
  percentComplete: string
): FlattenSimpleInterpolation => css`
  position: ${POSITION_ABSOLUTE};
  top: 0;
  height: 100%;
  background-color: ${COLORS.blue50};
  width: ${percentComplete};
  webkit-transition: width 0.5s ease-in-out;
  moz-transition: width 0.5s ease-in-out;
  o-transition: width 0.5s ease-in-out;
  transition: width 0.5s ease-in-out;
`
