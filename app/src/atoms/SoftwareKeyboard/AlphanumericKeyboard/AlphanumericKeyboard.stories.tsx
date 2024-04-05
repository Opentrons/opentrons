import * as React from 'react'
import {
  DIRECTION_COLUMN,
  Flex,
  POSITION_ABSOLUTE,
  SPACING,
  VIEWPORT,
} from '@opentrons/components'
import { InputField } from '../../InputField'
import { AlphanumericKeyboard } from '.'

import type { Story, Meta } from '@storybook/react'

export default {
  title: 'ODD/Atoms/SoftwareKeyboard/AlphanumericKeyboard',
  component: AlphanumericKeyboard,
  parameters: VIEWPORT.touchScreenViewport,
} as Meta

const Template: Story<
  React.ComponentProps<typeof AlphanumericKeyboard>
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
          placeholder="When focusing, the keyboard shows up"
          onFocus={() => setShowKeyboard(true)}
        />
      </form>
      <Flex position={POSITION_ABSOLUTE} top="20%" left="0" width="64rem">
        {showKeyboard && (
          <AlphanumericKeyboard
            onChange={(e: string) => e != null && setValue(String(e))}
            keyboardRef={keyboardRef}
          />
        )}
      </Flex>
    </Flex>
  )
}

export const AlphanumericSoftwareKeyboard = Template.bind({})
