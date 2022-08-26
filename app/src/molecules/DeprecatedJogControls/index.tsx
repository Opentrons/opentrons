// jog controls component
import * as React from 'react'

import { Flex, JUSTIFY_CENTER, ALIGN_STRETCH } from '@opentrons/components'

import { DeprecatedDirectionControl } from './DeprecatedDirectionControl'
import { DeprecatedStepSizeControl } from './DeprecatedStepSizeControl'
import {
  HORIZONTAL_PLANE,
  VERTICAL_PLANE,
  DEFAULT_STEP_SIZES,
} from '../JogControls/constants'

import type { Jog, Plane, StepSize } from '../JogControls/types'
import type { StyleProps } from '@opentrons/components'

export type { Jog }
export interface DeprecatedJogControlsProps extends StyleProps {
  jog: Jog
  planes?: Plane[]
  stepSizes?: StepSize[]
  auxiliaryControl?: React.ReactNode | null
  directionControlButtonColor?: string
  //  TODO: remove this prop after all primary buttons are changed to blue in the next gen app work
  isLPC?: boolean
}

export { HORIZONTAL_PLANE, VERTICAL_PLANE }

/**
 * @deprecated use `JogControls` instead
 */

export function DeprecatedJogControls(
  props: DeprecatedJogControlsProps
): JSX.Element {
  const {
    jog,
    isLPC,
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
      justifyContent={JUSTIFY_CENTER}
      alignSelf={ALIGN_STRETCH}
      {...styleProps}
    >
      <DeprecatedStepSizeControl
        {...{ currentStepSize, setCurrentStepSize, stepSizes, isLPC }}
      />
      {planes.map(plane => (
        <DeprecatedDirectionControl
          key={plane}
          plane={plane}
          jog={jog}
          stepSize={currentStepSize}
          buttonColor={directionControlButtonColor}
        />
      ))}
      {auxiliaryControl}
    </Flex>
  )
}
