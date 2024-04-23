import React from 'react'
import { Flex, SPACING } from '@opentrons/components'
import { PromptProvider, promptContext } from './PromptProvider'
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
        <PromptProvider>
          <Story />
          <PromptDisplay />
        </PromptProvider>
      )
    },
  ],
}
export default meta

const PromptDisplay = (): JSX.Element => {
  const usePromptValue = (): string => React.useContext(promptContext)
  const promptFromButton = usePromptValue()
  return <Flex padding={SPACING.spacing16}>{promptFromButton}</Flex>
}

type Story = StoryObj<typeof PromptButtonComponent>

export const PromptButton: Story = {
  args: {
    buttonText: 'Reagent Transfer',
  },
}
