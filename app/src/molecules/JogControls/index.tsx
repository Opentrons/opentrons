// jog controls component
import * as React from 'react'

import {
  Flex,
  SPACING_4,
  JUSTIFY_CENTER,
  ALIGN_STRETCH,
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
  buttonColor?: string
  isLPC?: boolean
}

export { HORIZONTAL_PLANE, VERTICAL_PLANE }

export function JogControls(props: JogControlsProps): JSX.Element {
  const {
    isLPC,
    stepSizes = DEFAULT_STEP_SIZES,
    planes = [HORIZONTAL_PLANE, VERTICAL_PLANE],
    jog,
    auxiliaryControl = null,
    ...styleProps
  } = props
  const [currentStepSize, setCurrentStepSize] = React.useState<number>(
    stepSizes[0]
  )
  return (
    <Flex
      justifyContent={JUSTIFY_CENTER}
      paddingX={SPACING_4}
      paddingTop={SPACING_4}
      paddingBottom="2.5rem"
      alignSelf={ALIGN_STRETCH}
      {...styleProps}
    >
      <StepSizeControl
        {...{ currentStepSize, setCurrentStepSize, stepSizes, isLPC
      }}
      />
      {planes.map(plane => (
        <DirectionControl
          key={plane}
          plane={plane}
          jog={jog}
          stepSize={currentStepSize}
          buttonColor={props.buttonColor}
        />
      ))}
      {auxiliaryControl}
    </Flex>
  )
}
