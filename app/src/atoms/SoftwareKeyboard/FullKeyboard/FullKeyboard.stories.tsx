import * as React from 'react'
import {
  DIRECTION_COLUMN,
  Flex,
  POSITION_ABSOLUTE,
  SPACING,
  VIEWPORT,
} from '@opentrons/components'
import { InputField } from '../../InputField'
import { FullKeyboard } from '.'

import type { Meta, StoryObj } from '@storybook/react'

const meta: Meta<typeof FullKeyboard> = {
  title: 'ODD/Atoms/SoftwareKeyboard/FullKeyboard',
  component: FullKeyboard,
  parameters: VIEWPORT.touchScreenViewport,
}
export default meta

type Story = StoryObj<typeof FullKeyboard>

const Keyboard = (): JSX.Element => {
  const [showKeyboard, setShowKeyboard] = React.useState(false)
  const [value, setValue] = React.useState<string>('')
  const keyboardRef = React.useRef(null)
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
          <FullKeyboard
            // eslint-disable-next-line @typescript-eslint/no-confusing-void-expression
            onChange={e => e != null && setValue(String(e))}
            keyboardRef={keyboardRef}
          />
        )}
      </Flex>
    </Flex>
  )
}

export const FullSoftwareKeyboard: Story = {
  render: () => <Keyboard />,
}
