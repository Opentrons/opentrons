import { Box } from '@opentrons/components'

import { StepContainer as StepContainerComponent } from '.'

import type { Meta, StoryObj } from '@storybook/react'

const meta: Meta<typeof StepContainerComponent> = {
  component: StepContainerComponent,
  title: 'Protocol-Designer/Molecules/StepContainer',
}

export default meta
type Story = StoryObj<typeof meta>

export const WithoutSubtext: Story = {
  args: {
    iconName: 'transfer',
    stepNumber: 1,
    text: 'Pause',
    type: 'default',
    size: 'iconAndText',
    cursor: 'default',
  },
}

export const WithSubtext: Story = {
  args: {
    iconName: 'transfer',
    stepNumber: 1,
    text: 'Pause',
    subtext: 'Until told to resume',
    type: 'default',
    size: 'iconAndText',
    cursor: 'default',
  },
}

export const Truncation: Story = {
  args: {
    iconName: 'transfer',
    stepNumber: 1,
    text: 'Text blah blah blah blah blah blah blah blah',
    subtext: 'Subtext blah blah blah blah blah blah blah blah',
    type: 'default',
    size: 'iconAndText',
    cursor: 'default',
  },
  decorators: Story => (
    <Box width="250px">
      <Story />
    </Box>
  ),
}
