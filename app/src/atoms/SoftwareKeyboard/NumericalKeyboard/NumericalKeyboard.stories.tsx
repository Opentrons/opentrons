import * as React from 'react'
import {
  DIRECTION_COLUMN,
  Flex,
  POSITION_ABSOLUTE,
  SPACING,
  VIEWPORT,
} from '@opentrons/components'
import { InputField } from '../../InputField'
import { NumericalKeyboard } from '.'

import type { Story, Meta } from '@storybook/react'

export default {
  title: 'ODD/Atoms/SoftwareKeyboard/NumericalKeyboard',
  component: NumericalKeyboard,
  parameters: VIEWPORT.touchScreenViewport,
  argTypes: {
    isDecimal: {
      control: {
        type: 'boolean',
        options: [true, false],
      },
      defaultValue: false,
    },
    hasHyphen: {
      control: {
        type: 'boolean',
        options: [true, false],
      },
      defaultValue: false,
    },
  },
} as Meta

const Template: Story<
  React.ComponentProps<typeof NumericalKeyboard>
> = args => {
  const [showKeyboard, setShowKeyboard] = React.useState(false)
  const [value, setValue] = React.useState<string>('')
  const keyboardRef = React.useRef(null)
  return (
    <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing16}>
      <form id="test_form">
        <InputField
          value={value}
          type="text"
          placeholder="When focusing, the numpad shows up"
          onFocus={() => {
            setShowKeyboard(true)
          }}
        />
      </form>
      <Flex
        position={POSITION_ABSOLUTE}
        top="20%"
        width="22.5rem"
        height="max-content"
      >
        {showKeyboard && (
          <NumericalKeyboard
            // eslint-disable-next-line @typescript-eslint/no-confusing-void-expression
            onChange={e => e != null && setValue(String(e))}
            keyboardRef={keyboardRef}
            isDecimal={args.isDecimal}
            hasHyphen={args.hasHyphen}
          />
        )}
      </Flex>
    </Flex>
  )
}

export const Keyboard = Template.bind({})
Keyboard.args = {
  isDecimal: false,
  hasHyphen: false,
}
