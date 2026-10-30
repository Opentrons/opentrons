// jog controls component
import { useState } from 'react'
import { css } from 'styled-components'

import {
  ALIGN_CENTER,
  ALIGN_STRETCH,
  Flex,
  JUSTIFY_SPACE_BETWEEN,
  SPACING,
} from '@opentrons/components'

import {
  DEFAULT_STEP_SIZES,
  HORIZONTAL_PLANE,
  LARGE_STEP_SIZE_MM,
  MEDIUM_STEP_SIZE_MM,
  SMALL_STEP_SIZE_MM,
  VERTICAL_PLANE,
} from './constants'
import { DirectionControl, TouchDirectionControl } from './DirectionControl'
import { StepSizeControl, TouchStepSizeControl } from './StepSizeControl'

import type { ReactNode } from 'react'
import type { StyleProps } from '@opentrons/components'
import type { Jog, Plane, StepSize } from './types'

export type { Jog }
export interface JogControlsProps extends StyleProps {
  jog: Jog
  planes?: Plane[]
  stepSizes?: StepSize[]
  auxiliaryControl?: ReactNode | null
  directionControlButtonColor?: string
  initialPlane?: Plane
  isOnDevice?: boolean
}

export {
  HORIZONTAL_PLANE,
  VERTICAL_PLANE,
  SMALL_STEP_SIZE_MM,
  MEDIUM_STEP_SIZE_MM,
  LARGE_STEP_SIZE_MM,
}

export function JogControls(props: JogControlsProps): ReactNode {
  const {
    jog,
    directionControlButtonColor,
    stepSizes = DEFAULT_STEP_SIZES,
    planes = [HORIZONTAL_PLANE, VERTICAL_PLANE],
    auxiliaryControl = null,
    initialPlane = HORIZONTAL_PLANE,
    isOnDevice = false,
    ...styleProps
  } = props
  const [currentStepSize, setCurrentStepSize] = useState<StepSize>(stepSizes[0])

  const controls = isOnDevice ? (
    <>
      <TouchStepSizeControl
        {...{
          currentStepSize,
          setCurrentStepSize,
          stepSizes,
          isOnDevice,
        }}
      />
      <TouchDirectionControl
        planes={planes}
        jog={jog}
        stepSize={currentStepSize}
        buttonColor={directionControlButtonColor}
        initialPlane={initialPlane}
      />
    </>
  ) : (
    <>
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
          {...{
            currentStepSize,
            setCurrentStepSize,
            stepSizes,
            isOnDevice,
          }}
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
    </>
  )
  return (
    <Flex
      justifyContent={JUSTIFY_SPACE_BETWEEN}
      alignSelf={ALIGN_STRETCH}
      gridGap={SPACING.spacing8}
      {...styleProps}
    >
      {controls}
      {auxiliaryControl}
    </Flex>
  )
}
