import { useState, useRef } from 'react'
import {
  DIRECTION_COLUMN,
  Flex,
  InputField,
  POSITION_ABSOLUTE,
  SPACING,
  VIEWPORT,
} from '@opentrons/components'
import { NumericalKeyboard } from '.'

import type { Meta, StoryObj } from '@storybook/react'

const meta: Meta<typeof NumericalKeyboard> = {
  title: 'ODD/Atoms/SoftwareKeyboard/NumericalKeyboard',
  component: NumericalKeyboard,
  parameters: VIEWPORT.touchScreenViewport,
  argTypes: {
    isDecimal: {
      control: {
        type: 'boolean',
        options: [true, false],
      },
    },
    hasHyphen: {
      control: {
        type: 'boolean',
        options: [true, false],
      },
    },
  },
}

export default meta

type Story = StoryObj<typeof NumericalKeyboard>

const Keyboard = (args): JSX.Element => {
  const { isDecimal, hasHyphen } = args
  const [showKeyboard, setShowKeyboard] = useState(false)
  const [value, setValue] = useState<string>('')
  const keyboardRef = useRef(null)
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
            isDecimal={isDecimal}
            hasHyphen={hasHyphen}
          />
        )}
      </Flex>
    </Flex>
  )
}

export const NumericalSoftwareKeyboard: Story = args => <Keyboard {...args} />
NumericalSoftwareKeyboard.args = {
  isDecimal: false,
  hasHyphen: false,
}
