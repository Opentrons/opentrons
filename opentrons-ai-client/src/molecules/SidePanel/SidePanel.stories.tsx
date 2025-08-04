import { FormProvider, useForm } from 'react-hook-form'
import { I18nextProvider } from 'react-i18next'

import { i18n } from '/ai-client/i18n'

import { SidePanel as SidePanelComponent } from './index'

import type { Meta, StoryObj } from '@storybook/react'

const FormProviderWrapper = ({
  children,
}: {
  children: React.ReactNode
}): JSX.Element => {
  const methods = useForm()
  return <FormProvider {...methods}>{children}</FormProvider>
}

const meta: Meta<typeof SidePanelComponent> = {
  title: 'AI/molecules/SidePanel',
  component: SidePanelComponent,
  decorators: [
    Story => (
      <I18nextProvider i18n={i18n}>
        <FormProviderWrapper>
          <Story />
        </FormProviderWrapper>
      </I18nextProvider>
    ),
  ],
}
export default meta
type Story = StoryObj<typeof SidePanelComponent>
export const SidePanel: Story = {}
