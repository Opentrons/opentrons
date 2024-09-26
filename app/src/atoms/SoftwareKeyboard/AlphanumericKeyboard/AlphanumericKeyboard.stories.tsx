import { useState, useRef } from 'react'
import {
  DIRECTION_COLUMN,
  Flex,
  InputField,
  POSITION_ABSOLUTE,
  SPACING,
  VIEWPORT,
} from '@opentrons/components'
import { AlphanumericKeyboard } from '.'

import type { Meta, StoryObj } from '@storybook/react'

const meta: Meta<typeof AlphanumericKeyboard> = {
  title: 'ODD/Atoms/SoftwareKeyboard/AlphanumericKeyboard',
  component: AlphanumericKeyboard,
  parameters: VIEWPORT.touchScreenViewport,
}

export default meta

type Story = StoryObj<typeof AlphanumericKeyboard>

const Keyboard = (): JSX.Element => {
  const [showKeyboard, setShowKeyboard] = useState(false)
  const [value, setValue] = useState<string>('')
  const keyboardRef = useRef(null)
  return (
    <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing16}>
      <form id="test_form">
        <InputField
          value={value}
          type="text"
          placeholder="When focusing, the keyboard shows up"
          // eslint-disable-next-line @typescript-eslint/no-confusing-void-expression
          onFocus={() => setShowKeyboard(true)}
        />
      </form>
      <Flex position={POSITION_ABSOLUTE} top="20%" left="0" width="64rem">
        {showKeyboard && (
          <AlphanumericKeyboard
            // eslint-disable-next-line @typescript-eslint/no-confusing-void-expression
            onChange={(e: string) => e != null && setValue(String(e))}
            keyboardRef={keyboardRef}
          />
        )}
      </Flex>
    </Flex>
  )
}

export const AlphanumericSoftwareKeyboard: Story = {
  render: () => <Keyboard />,
}
