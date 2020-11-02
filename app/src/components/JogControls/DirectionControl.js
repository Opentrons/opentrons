// @flow
// jog controls component
import * as React from 'react'

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
import { ControlContainer } from './ControlContainer'

import type { Jog, Plane, Sign, Bearing } from './types'

type Control = {|
  title: Bearing,
  keyName: string,
  shiftKey: boolean,
  gridRow: number,
  gridColumn: number,
  iconName: IconName,
  axis: 'x' | 'y' | 'z',
  sign: Sign,
|}
type ControlsContents = {|
  controls: Array<Control>,
  title: string,
  subtitle: string,
|}

const CONTROLS_CONTENTS_BY_PLANE: { [Plane]: ControlsContents } = {
  vertical: {
    controls: [
      {
        keyName: 'ArrowUp',
        shiftKey: true,
        title: 'up',
        gridRow: 1,
        gridColumn: 2,
        iconName: 'ot-arrow-up',
        axis: 'z',
        sign: 1,
      },
      {
        keyName: 'ArrowDown',
        shiftKey: true,
        title: 'down',
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
  horizontal: {
    controls: [
      {
        keyName: 'ArrowLeft',
        shiftKey: false,
        title: 'left',
        gridRow: 2,
        gridColumn: 1,
        iconName: 'ot-arrow-left',
        axis: 'x',
        sign: -1,
      },
      {
        keyName: 'ArrowRight',
        shiftKey: false,
        title: 'right',
        gridRow: 2,
        gridColumn: 3,
        iconName: 'ot-arrow-right',
        axis: 'x',
        sign: 1,
      },
      {
        keyName: 'ArrowUp',
        shiftKey: false,
        title: 'back',
        gridRow: 1,
        gridColumn: 2,
        iconName: 'ot-arrow-up',
        axis: 'y',
        sign: 1,
      },
      {
        keyName: 'ArrowDown',
        shiftKey: false,
        title: 'forward',
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

type DirectionControlProps = {|
  plane: Plane,
  jog: Jog,
  stepSize: number,
|}

export function DirectionControl(props: DirectionControlProps): React.Node {
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
            ({ title, gridRow, gridColumn, iconName, axis, sign }) => (
              <PrimaryBtn
                key={title}
                title={title}
                width="2.5rem"
                height="2.5rem"
                alignSelf={ALIGN_CENTER}
                onClick={() => props.jog(axis, sign, props.stepSize)}
                padding={SPACING_1}
                {...{ gridRow, gridColumn }}
              >
                <Icon name={iconName} />
              </PrimaryBtn>
            )
          )}
        </Box>
      </HandleKeypress>
    </ControlContainer>
  )
}
