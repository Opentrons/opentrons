import { PromptButton as PromptButtonComponent } from '.'

import type { Meta, StoryObj } from '@storybook/react'

const buttonTextOptions = [
  'Reagent Transfer',
  'Reagent Transfer (Flex)',
  'PCR',
  'PCR (Flex)',
]

// ToDo (kk:04/22/2024) fix this stories
const meta: Meta<typeof PromptButtonComponent> = {
  title: 'AI/organisms/PromptButton',
  component: PromptButtonComponent,
  argTypes: {
    buttonText: {
      control: {
        type: 'select',
      },
      options: buttonTextOptions,
    },
  },
  decorators: [
    Story => {
      return (
        <>
          <Story />
        </>
      )
    },
  ],
}
export default meta

type Story = StoryObj<typeof PromptButtonComponent>

export const PromptButton: Story = {
  args: {
    buttonText: 'Reagent Transfer',
  },
}
