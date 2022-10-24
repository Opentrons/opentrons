import * as React from 'react'
import {
  Flex,
  DIRECTION_COLUMN,
  POSITION_ABSOLUTE,
  SPACING,
} from '@opentrons/components'
import { InputField } from '../InputField'
import { Numpad } from './'
import '../../styles.global.css'

import type { Story, Meta } from '@storybook/react'

export default {
  title: 'App/Atoms/SoftwareKeyboard/Numpad',
  component: Numpad,
} as Meta

const Template: Story<React.ComponentProps<typeof Numpad>> = args => {
  const [showKeyboard, setShowKeyboard] = React.useState(false)
  const [value, setValue] = React.useState<string>('')
  const keyboardRef = React.useRef(null)
  return (
    <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing4}>
      <form id="test_form">
        <InputField
          value={value}
          type="text"
          placeholder="When focusing, the numpad shows up"
          onFocus={() => setShowKeyboard(true)}
        />
      </form>
      <Flex position={POSITION_ABSOLUTE} top="15%" width="15rem">
        {showKeyboard && (
          <Numpad
            onChange={e => e != null && setValue(String(e))}
            keyboardRef={keyboardRef}
          />
        )}
      </Flex>
    </Flex>
  )
}

export const NormalSoftwareKeyboard = Template.bind({})
