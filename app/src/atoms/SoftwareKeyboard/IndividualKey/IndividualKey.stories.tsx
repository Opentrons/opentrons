import { useState, useRef } from 'react'
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

const meta: Meta<typeof IndividualKey> = {
  title: 'ODD/Atoms/SoftwareKeyboard/IndividualKey',
  component: IndividualKey,
  parameters: VIEWPORT.touchScreenViewport,
}

export default meta

type Story = StoryObj<typeof IndividualKey>

const Keyboard = ({ ...args }): JSX.Element => {
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
      <Flex position={POSITION_ABSOLUTE} top="20%" width="15rem">
        {showKeyboard && (
          <IndividualKey
            // eslint-disable-next-line @typescript-eslint/no-confusing-void-expression
            onChange={e => e != null && setValue(String(e))}
            keyboardRef={keyboardRef}
            keyText={args.keyText}
          />
        )}
      </Flex>
    </Flex>
  )
}

export const IndividualKeySoftwareKeyboard: Story = args => (
  <Keyboard {...args} />
)
IndividualKeySoftwareKeyboard.args = {
  keyText: 'hello',
}
