// jog controls component
import * as React from 'react'

import {
  Flex,
  ALIGN_STRETCH,
  JUSTIFY_SPACE_BETWEEN,
} from '@opentrons/components'

import { DirectionControl } from './DirectionControl'
import { StepSizeControl } from './StepSizeControl'
import {
  HORIZONTAL_PLANE,
  VERTICAL_PLANE,
  DEFAULT_STEP_SIZES,
} from './constants'

import type { Jog, Plane, StepSize } from './types'
import type { StyleProps } from '@opentrons/components'

export type { Jog }
export interface JogControlsProps extends StyleProps {
  jog: Jog
  planes?: Plane[]
  stepSizes?: StepSize[]
  auxiliaryControl?: React.ReactNode | null
  directionControlButtonColor?: string
}

export { HORIZONTAL_PLANE, VERTICAL_PLANE }

export function JogControls(props: JogControlsProps): JSX.Element {
  const {
    jog,
    directionControlButtonColor,
    stepSizes = DEFAULT_STEP_SIZES,
    planes = [HORIZONTAL_PLANE, VERTICAL_PLANE],
    auxiliaryControl = null,
    ...styleProps
  } = props
  const [currentStepSize, setCurrentStepSize] = React.useState<number>(
    stepSizes[0]
  )
  return (
    <Flex
      justifyContent={JUSTIFY_SPACE_BETWEEN}
      alignSelf={ALIGN_STRETCH}
      {...styleProps}
    >
      <StepSizeControl
        {...{ currentStepSize, setCurrentStepSize, stepSizes }}
      />
      <DirectionControl
        planes={planes}
        jog={jog}
        stepSize={currentStepSize}
        buttonColor={directionControlButtonColor}
      />
      {auxiliaryControl}
    </Flex>
  )
}
