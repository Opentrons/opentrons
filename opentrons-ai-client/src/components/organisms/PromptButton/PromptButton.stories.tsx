import { FormProvider, useForm } from 'react-hook-form'

import { PromptButton as PromptButtonComponent } from '.'

import type { Meta, StoryObj } from '@storybook/react'

const buttonTextOptions = [
  'Reagent Transfer',
  'Reagent Transfer (Flex)',
  'PCR',
  'PCR (Flex)',
]

const FormProviderWrapper = ({
  children,
}: {
  children: React.ReactNode
}): JSX.Element => {
  const methods = useForm()
  return <FormProvider {...methods}>{children}</FormProvider>
}

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
        <FormProviderWrapper>
          <Story />
        </FormProviderWrapper>
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
