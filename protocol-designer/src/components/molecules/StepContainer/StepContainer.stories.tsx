import { StepContainer as StepContainerComponent } from '.'

import type { Meta, StoryObj } from '@storybook/react'

const meta: Meta<typeof StepContainerComponent> = {
  component: StepContainerComponent,
  title: 'Protocol-Designer/Molecules/StepContainer',
}

export default meta
type Story = StoryObj<typeof meta>

export const StepContainer: Story = {
  args: {
    text: '1. Pause',
    iconName: 'transfer',
    type: 'default',
    size: 'iconAndText',
    cursor: 'default',
    active: false,
    error: false,
    hover: false,
    semiTransparent: false,
  },
}
