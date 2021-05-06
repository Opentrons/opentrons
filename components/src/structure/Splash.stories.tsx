import * as React from 'react'
import { Splash as SplashComponent } from './Splash'
import { Box } from '@opentrons/components'

import type { Story, Meta } from '@storybook/react'

export default {
  title: 'Library/Molecules/Splash',
  decorators: [
    Story => (
      <Box height="20rem" width="100%">
        <Story />
      </Box>
    ),
  ],
} as Meta

const Template: Story<React.ComponentProps<typeof SplashComponent>> = args => (
  <SplashComponent {...args} />
)
export const Splash = Template.bind({})
Splash.args = {
  iconName: 'ot-logo',
}
