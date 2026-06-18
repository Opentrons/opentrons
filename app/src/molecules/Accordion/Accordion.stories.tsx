import { StyledText } from '@opentrons/components'

import { Accordion as AccordionComponent } from './index'

import type { Meta, StoryObj } from '@storybook/react'

const meta: Meta<typeof AccordionComponent> = {
  title: 'App/Molecules/Accordion',
  component: AccordionComponent,
  argTypes: {
    id: {
      control: 'text',
      description: 'Id for the accordion content region.',
    },
    title: {
      control: 'text',
      description: 'Accordion header label.',
    },
  },
}

export default meta

type Story = StoryObj<typeof AccordionComponent>

export const Accordion: Story = {
  args: {
    id: 'user-management',
    title: 'User management',
  },
}

export const WithContent: Story = {
  args: {
    id: 'compliance-ready-software-settings',
    title: 'Compliance Ready Software settings',
    children: (
      <StyledText desktopStyle="bodyDefaultRegular">
        Accordion body content goes here.
      </StyledText>
    ),
  },
}
