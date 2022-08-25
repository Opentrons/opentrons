// jog controls component
import * as React from 'react'
import { css } from 'styled-components'
import {
  Flex,
  ALIGN_STRETCH,
  ALIGN_CENTER,
  JUSTIFY_SPACE_BETWEEN,
  SPACING,
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
  initialPlane?: Plane
}

export { HORIZONTAL_PLANE, VERTICAL_PLANE }

export function JogControls(props: JogControlsProps): JSX.Element {
  const {
    jog,
    directionControlButtonColor,
    stepSizes = DEFAULT_STEP_SIZES,
    planes = [HORIZONTAL_PLANE, VERTICAL_PLANE],
    auxiliaryControl = null,
    initialPlane = HORIZONTAL_PLANE,
    ...styleProps
  } = props
  const [currentStepSize, setCurrentStepSize] = React.useState<number>(
    stepSizes[0]
  )

  return (
    <Flex
      justifyContent={JUSTIFY_SPACE_BETWEEN}
      alignSelf={ALIGN_STRETCH}
      gridGap={SPACING.spacing3}
      {...styleProps}
    >
      <Flex
        alignItems={ALIGN_CENTER}
        css={css`
          flex: 1;
          @media screen and (max-width: 750px) {
            flex: 3;
          }
        `}
      >
        <StepSizeControl
          {...{ currentStepSize, setCurrentStepSize, stepSizes }}
        />
      </Flex>
      <Flex
        alignItems={ALIGN_CENTER}
        css={css`
          flex: 1;
          @media screen and (max-width: 750px) {
            flex: 7;
          }
        `}
      >
        <DirectionControl
          planes={planes}
          jog={jog}
          stepSize={currentStepSize}
          buttonColor={directionControlButtonColor}
          initialPlane={initialPlane}
        />
      </Flex>
      {auxiliaryControl}
    </Flex>
  )
}
