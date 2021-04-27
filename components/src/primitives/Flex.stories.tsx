import * as React from 'react'
import { Flex as FlexComponent } from './Flex'
import {
  Box,
  DIRECTION_COLUMN,
  JUSTIFY_SPACE_AROUND,
} from '@opentrons/components'

import type { Story, Meta } from '@storybook/react'

export default {
  title: 'Library/Atoms/Flex',
} as Meta

const Template: Story<React.ComponentProps<typeof FlexComponent>> = args => (
  <FlexComponent {...args} />
)
export const Flex = Template.bind({})
Flex.args = {
  children: [
    <Box key="1" backgroundColor="red">
      This is a flex child
    </Box>,
    <Box key="2" backgroundColor="red">
      This is a flex child
    </Box>,
  ],
  flexDirection: DIRECTION_COLUMN,
  justifyContent: JUSTIFY_SPACE_AROUND,
  backgroundColor: 'grey',
  border: '1px solid black',
  padding: '1rem',
  maxWidth: '20rem',
  height: '10rem',
}
