import { useRef, useState } from 'react'

import {
  DIRECTION_COLUMN,
  Flex,
  InputField,
  POSITION_ABSOLUTE,
  SPACING,
  VIEWPORT,
} from '@opentrons/components'

import { IndividualKey } from '.'

import type { Meta, StoryObj } from '@storybook/react'
import type { ReactNode } from 'react'
import type { KeyboardReactInterface } from 'react-simple-keyboard'

const meta: Meta<typeof IndividualKey> = {
  title: 'ODD/Atoms/SoftwareKeyboard/IndividualKey',
  component: IndividualKey,
  ...VIEWPORT.touchScreenViewport,
}

export default meta

type Story = StoryObj<typeof IndividualKey>

const Keyboard = ({ keyText }: { keyText: string }): ReactNode => {
  const [showKeyboard, setShowKeyboard] = useState(false)
  const [value, setValue] = useState<string>('')
  const keyboardRef = useRef<KeyboardReactInterface | null>(null)
  const inputElementRef = useRef<HTMLInputElement>(null)
  return (
    <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing16}>
      <form id="test_form">
        <InputField
          ref={inputElementRef}
          value={value}
          type="text"
          placeholder="When focusing, the keyboard shows up"
          onFocus={() => {
            setShowKeyboard(true)
          }}
          onChange={e => {
            setValue(e.target.value)
          }}
        />
      </form>
      <Flex position={POSITION_ABSOLUTE} top="20%" width="15rem">
        {showKeyboard && (
          <IndividualKey
            keyboardRef={keyboardRef}
            inputElementRef={inputElementRef}
            keyText={keyText}
          />
        )}
      </Flex>
    </Flex>
  )
}

export const IndividualKeySoftwareKeyboard: Story = {
  render: args => <Keyboard keyText={args.keyText} />,
  args: {
    keyText: 'hello',
  },
}
