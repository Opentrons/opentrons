// @flow
// jog controls component
import * as React from 'react'
import cx from 'classnames'

import type { JogAxis, JogDirection, JogStep } from '../../http-api-client'

import {
  Flex,
  Box,
  Text,
  SPACING_1,
  SPACING_2,
  SPACING_4,
  TEXT_ALIGN_LEFT,
  DIRECTION_COLUMN,
  PrimaryBtn,
  RadioGroup,
  Icon,
  HandleKeypress,
  type KeypressHandler,
  type IconName,
  FONT_SIZE_HEADER,
  FONT_WEIGHT_SEMIBOLD,
  FONT_SIZE_BODY_1,
  ALIGN_CENTER,
  JUSTIFY_CENTER,
  FONT_BODY_1_DARK,
  FONT_HEADER_DARK,
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

export type { Jog }
export type JogControlsProps = {|
  jog: Jog,
  planes?: Array<Plane>,
  stepSizes?: Array<StepSize>,
  auxiliaryControl?: React.Node | null,
|}

export { HORIZONTAL_PLANE, VERTICAL_PLANE }

export function JogControls(props: JogControlsProps): React.Node {
  const {
    stepSizes = DEFAULT_STEP_SIZES,
    planes = [HORIZONTAL_PLANE, VERTICAL_PLANE],
    jog,
    auxiliaryControl = null,
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
    >
      <StepSizeControl
        {...{ currentStepSize, setCurrentStepSize, stepSizes }}
      />
      {planes.map(plane => (
        <DirectionControl
          key={plane}
          plane={plane}
          jog={jog}
          stepSize={currentStepSize}
        />
      ))}
      {auxiliaryControl}
    </Flex>
  )
}
