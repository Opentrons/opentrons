import { StyledText } from '@opentrons/components'

import { Accordion as AccordionComponent } from './index'

import type { Meta, StoryObj } from '@storybook/react'

const meta: Meta<typeof AccordionComponent> = {
  title: 'App/Molecules/Accordion',
  component: AccordionComponent,
  argTypes: {
    title: {
      control: 'text',
      description: 'Accordion header label.',
    },
  },
  decorators: [
    Story => (
      <div style={{ maxWidth: '42.375rem', width: '100%' }}>
        <Story />
      </div>
    ),
  ],
}

export default meta

type Story = StoryObj<typeof AccordionComponent>

export const Accordion: Story = {
  args: {
    title: 'User management',
  },
}

export const WithContent: Story = {
  args: {
    title: 'Compliance Ready Software settings',
    children: (
      <StyledText desktopStyle="bodyDefaultRegular">
        Accordion body content goes here.
      </StyledText>
    ),
  },
}
