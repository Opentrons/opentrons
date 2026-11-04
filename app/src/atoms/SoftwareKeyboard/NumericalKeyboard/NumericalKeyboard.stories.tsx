import { useRef, useState } from 'react'

import {
  DIRECTION_COLUMN,
  POSITION_ABSOLUTE,
  SPACING,
  TouchInputField,
  VIEWPORT,
} from '@opentrons/components'

import { NumericalKeyboard } from '.'

import type { Meta, StoryObj } from '@storybook/react'
import type { ReactNode } from 'react'
import type { KeyboardReactInterface } from 'react-simple-keyboard'

const meta: Meta<typeof NumericalKeyboard> = {
  title: 'ODD/Atoms/SoftwareKeyboard/NumericalKeyboard',
  component: NumericalKeyboard,
  ...VIEWPORT.touchScreenViewport,
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

const Keyboard = (args): ReactNode => {
  const { isDecimal, hasHyphen } = args
  const [showKeyboard, setShowKeyboard] = useState(false)
  const [value, setValue] = useState<string>('')
  const keyboardRef = useRef<KeyboardReactInterface | null>(null)
  const inputElementRef = useRef<HTMLInputElement>(null)
  return (
    <div
      style={{
        flexDirection: DIRECTION_COLUMN,
        gridGap: SPACING.spacing16,
      }}
    >
      <form id="test_form">
        <TouchInputField
          ref={inputElementRef}
          value={value}
          type="text"
          label="Numerical keyboard input"
          placeholder="When focusing, the numpad shows up"
          onFocus={() => {
            setShowKeyboard(true)
          }}
          onChange={e => {
            setValue(e.target.value)
          }}
        />
      </form>
      <div
        style={{
          position: POSITION_ABSOLUTE,
          top: '20%',
          width: '22.5rem',
          height: 'max-content',
        }}
      >
        {showKeyboard && (
          <NumericalKeyboard
            keyboardRef={keyboardRef}
            inputElementRef={inputElementRef}
            isDecimal={isDecimal}
            hasHyphen={hasHyphen}
          />
        )}
      </div>
    </div>
  )
}

export const NumericalSoftwareKeyboard: Story = args => <Keyboard {...args} />
NumericalSoftwareKeyboard.args = {
  isDecimal: false,
  hasHyphen: false,
}
