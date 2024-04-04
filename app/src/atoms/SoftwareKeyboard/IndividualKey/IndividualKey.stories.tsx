import * as React from 'react'
import {
  DIRECTION_COLUMN,
  Flex,
  POSITION_ABSOLUTE,
  SPACING,
  VIEWPORT,
} from '@opentrons/components'
import { InputField } from '../../InputField'
import { IndividualKey } from '.'
import '../index.css'
import './index.css'

import type { Story, Meta } from '@storybook/react'

export default {
  title: 'ODD/Atoms/SoftwareKeyboard/IndividualKey',
  component: IndividualKey,
  parameters: VIEWPORT.touchScreenViewport,
} as Meta

const Template: Story<React.ComponentProps<typeof IndividualKey>> = args => {
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

export const Keyboard = Template.bind({})
Keyboard.args = {
  keyText: 'hello!',
}
