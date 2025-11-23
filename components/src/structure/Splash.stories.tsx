import { Box } from '@opentrons/components'

import { Splash as SplashComponent } from './Splash'

import type { Meta, StoryObj } from '@storybook/react'

const meta: Meta<typeof SplashComponent> = {
  title: 'Helix/Molecules/Splash',
  component: SplashComponent,
  decorators: [
    Story => (
      <Box height="20rem" width="100%">
        <Story />
      </Box>
    ),
  ],
}
export default meta

type Story = StoryObj<typeof SplashComponent>

export const Splash: Story = {
  args: {
    iconName: 'ot-logo',
  },
}
