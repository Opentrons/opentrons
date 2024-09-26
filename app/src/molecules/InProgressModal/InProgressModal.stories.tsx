import type { Meta, StoryObj } from '@storybook/react'
import { InProgressModal as InProgressModalComponent } from './'
import { SimpleWizardInProgressBody } from '../SimpleWizardBody'

const meta: Meta<typeof InProgressModalComponent> = {
  title: 'App/Molecules/InProgressModal',
  component: InProgressModalComponent,
  argTypes: {
    description: {
      control: {
        type: 'text',
      },
    },
    body: {
      control: {
        type: 'text',
      },
    },
  },
}

export default meta

export type Story = StoryObj<typeof InProgressModalComponent>

export const InProgressModal: Story = {
  args: {
    description: 'here is a description',
    body: 'Here is the body of the whole thing',
  },
}

export const InProgressModalSimpleWizard: Story = {
  args: {
    description: 'here is a description',
    body: 'Here is the body of the whole thing',
  },
  render: args => <SimpleWizardInProgressBody {...args} />,
}
