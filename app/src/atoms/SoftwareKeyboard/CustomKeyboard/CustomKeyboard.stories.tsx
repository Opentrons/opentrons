import * as React from 'react'
import {
  Flex,
  DIRECTION_COLUMN,
  POSITION_ABSOLUTE,
  SPACING,
} from '@opentrons/components'
import { touchScreenViewport } from '../../../DesignTokens/constants'
import { InputField } from '../../InputField'
import { CustomKeyboard } from './'
import '../../../styles.global.css'

import type { Story, Meta } from '@storybook/react'

export default {
  title: 'ODD/Atoms/SoftwareKeyboard/CustomKeyboard',
  component: CustomKeyboard,
  parameters: touchScreenViewport,
} as Meta

const Template: Story<React.ComponentProps<typeof CustomKeyboard>> = args => {
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
          <CustomKeyboard
            onChange={(e: string) => e != null && setValue(String(e))}
            keyboardRef={keyboardRef}
          />
        )}
      </Flex>
    </Flex>
  )
}

export const CustomSoftwareKeyboard = Template.bind({})
