import { Splash as SplashComponent } from './Splash'

import type { Meta, StoryObj } from '@storybook/react'

const meta: Meta<typeof SplashComponent> = {
  title: 'Helix/Molecules/Splash',
  component: SplashComponent,
  decorators: [
    Story => (
      <div style={{ height: '20rem', width: '100%' }}>
        <Story />
      </div>
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
