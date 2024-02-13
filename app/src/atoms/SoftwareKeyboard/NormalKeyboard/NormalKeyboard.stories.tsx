import * as React from 'react'
import {
  Flex,
  DIRECTION_COLUMN,
  POSITION_ABSOLUTE,
  SPACING,
} from '@opentrons/components'
import { touchScreenViewport } from '../../../DesignTokens/constants'
import { InputField } from '../../InputField'
import { NormalKeyboard } from '.'
import '../../../styles.global.module.css'

import type { Story, Meta } from '@storybook/react'

export default {
  title: 'ODD/Atoms/SoftwareKeyboard/NormalKeyboard',
  component: NormalKeyboard,
  parameters: touchScreenViewport,
} as Meta

const Template: Story<React.ComponentProps<typeof NormalKeyboard>> = args => {
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
      <Flex position={POSITION_ABSOLUTE} top="20%" width="55rem">
        {showKeyboard && (
          <NormalKeyboard
            onChange={e => e != null && setValue(String(e))}
            keyboardRef={keyboardRef}
          />
        )}
      </Flex>
    </Flex>
  )
}

export const NormalSoftwareKeyboard = Template.bind({})
