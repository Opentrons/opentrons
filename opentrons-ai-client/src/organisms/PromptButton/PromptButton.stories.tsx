import React from 'react'
import { I18nextProvider } from 'react-i18next'
import { Flex, SPACING } from '@opentrons/components'
import { i18n } from '../../i18n'
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
      const usePromptValue = (): string => React.useContext(promptContext)
      const prompt = usePromptValue()
      return (
        <I18nextProvider i18n={i18n}>
          <PromptProvider>
            <Story />
            <Flex padding={SPACING.spacing16}>{prompt}</Flex>
          </PromptProvider>
        </I18nextProvider>
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
