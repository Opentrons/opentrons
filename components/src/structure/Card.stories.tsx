import * as React from 'react'
import { Card } from './Card'
import { Box, Text, SIZE_4, SPACING_3} from '@opentrons/components'

import type { Story, Meta } from '@storybook/react'

export default {
  title: 'Library/Molecules/Card',
  args: {
    children: (
      <>
        <Box size={SIZE_4} padding={SPACING_3}>
          <Text>Some text contents</Text>
        </Box>
        <Box size={SIZE_4} padding={SPACING_3}>
          <Text>Some more text contents</Text>
        </Box>
      </>
    )
  }
} as Meta

const Template: Story<React.ComponentProps<typeof Card>> = args => (
  <Card {...args} />
)
export const Simple = Template.bind({})
Simple.args = {
  title: 'Main Title Goes Here',
}

export const Disabled = Template.bind({})
Disabled.args = {
  title: 'This card does not want to be interacted with',
  disabled: true
}
