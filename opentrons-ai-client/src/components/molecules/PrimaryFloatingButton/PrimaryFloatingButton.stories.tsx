import { PrimaryFloatingButton as PrimaryFloatingButtonComponent } from './index'

import type { Meta, StoryObj } from '@storybook/react'

const meta: Meta<typeof PrimaryFloatingButtonComponent> = {
  title: 'AI/molecules/PrimaryFloatingButton',
  component: PrimaryFloatingButtonComponent,
  decorators: [Story => <Story />],
}
export default meta
type Story = StoryObj<typeof PrimaryFloatingButtonComponent>
export const PrimaryFloatingButton: Story = {
  args: {
    buttonText: 'primary floating button',
    iconName: 'arrow-down',
  },
}
