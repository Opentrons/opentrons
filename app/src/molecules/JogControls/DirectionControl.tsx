// jog controls component
import * as React from 'react'

import {
  Box,
  SPACING_1,
  SIZE_2,
  PrimaryBtn,
  Icon,
  HandleKeypress,
  ALIGN_CENTER,
  C_BLUE,
} from '@opentrons/components'
import { ControlContainer } from './ControlContainer'

import type { IconName } from '@opentrons/components'
import type { Jog, Plane, Sign, Bearing, Axis } from './types'
import { HORIZONTAL_PLANE, VERTICAL_PLANE } from './constants'

interface Control {
  bearing: Bearing
  keyName: string
  shiftKey: boolean
  gridRow: number
  gridColumn: number
  iconName: IconName
  axis: Axis
  sign: Sign
}
interface ControlsContents {
  controls: Control[]
  title: string
  subtitle: string
}

const CONTROLS_CONTENTS_BY_PLANE: Record<Plane, ControlsContents> = {
  [VERTICAL_PLANE]: {
    controls: [
      {
        keyName: 'ArrowUp',
        shiftKey: true,
        bearing: 'up',
        gridRow: 1,
        gridColumn: 2,
        iconName: 'ot-arrow-up',
        axis: 'z',
        sign: 1,
      },
      {
        keyName: 'ArrowDown',
        shiftKey: true,
        bearing: 'down',
        gridRow: 2,
        gridColumn: 2,
        iconName: 'ot-arrow-down',
        axis: 'z',
        sign: -1,
      },
    ],
    title: 'Up & Down',
    subtitle: 'Arrow keys + SHIFT',
  },
  [HORIZONTAL_PLANE]: {
    controls: [
      {
        keyName: 'ArrowLeft',
        shiftKey: false,
        bearing: 'left',
        gridRow: 2,
        gridColumn: 1,
        iconName: 'ot-arrow-left',
        axis: 'x',
        sign: -1,
      },
      {
        keyName: 'ArrowRight',
        shiftKey: false,
        bearing: 'right',
        gridRow: 2,
        gridColumn: 3,
        iconName: 'ot-arrow-right',
        axis: 'x',
        sign: 1,
      },
      {
        keyName: 'ArrowUp',
        shiftKey: false,
        bearing: 'back',
        gridRow: 1,
        gridColumn: 2,
        iconName: 'ot-arrow-up',
        axis: 'y',
        sign: 1,
      },
      {
        keyName: 'ArrowDown',
        shiftKey: false,
        bearing: 'forward',
        gridRow: 2,
        gridColumn: 2,
        iconName: 'ot-arrow-down',
        axis: 'y',
        sign: -1,
      },
    ],
    title: 'Across Deck',
    subtitle: 'Arrow keys',
  },
}

interface DirectionControlProps {
  plane: Plane
  jog: Jog
  stepSize: number
  buttonColor?: string
}

export function DirectionControl(props: DirectionControlProps): JSX.Element {
  const { title, subtitle, controls } = CONTROLS_CONTENTS_BY_PLANE[props.plane]

  return (
    <ControlContainer {...{ title, subtitle }}>
      <HandleKeypress
        preventDefault
        handlers={controls.map(({ keyName, shiftKey, axis, sign }) => ({
          key: keyName,
          shiftKey,
          onPress: () => props.jog(axis, sign, props.stepSize),
        }))}
      >
        <Box
          display="grid"
          gridGap={SPACING_1}
          gridTemplateRows="repeat(2, [row] 3rem)"
          gridTemplateColumns="repeat(3, [col] 3rem)"
        >
          {controls.map(
            ({ bearing, gridRow, gridColumn, iconName, axis, sign }) => (
              <PrimaryBtn
                key={bearing}
                title={bearing}
                width={SIZE_2}
                height={SIZE_2}
                alignSelf={ALIGN_CENTER}
                margin={SPACING_1}
                padding={0}
                onClick={() => props.jog(axis, sign, props.stepSize)}
                {...{ gridRow, gridColumn }}
              >
                <Icon name={iconName} backgroundColor={props.buttonColor} />
              </PrimaryBtn>
            )
          )}
        </Box>
      </HandleKeypress>
    </ControlContainer>
  )
}
