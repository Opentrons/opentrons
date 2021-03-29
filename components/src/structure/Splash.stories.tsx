import * as React from 'react'
import { Splash } from './Splash'
import { Box } from '@opentrons/components'

import type { Story, Meta } from '@storybook/react'

export default {
  title: 'Library/Molecules/Splash',
  decorators: [(Story) => (
    <Box height="20rem" width="100%">
      <Story />
    </Box>
  )]
} as Meta

const Template: Story<React.ComponentProps<typeof Splash>> = (args) => <Splash {...args}/>
export const Basic = Template.bind({})
Basic.args = {
  iconName: 'ot-logo'
}
