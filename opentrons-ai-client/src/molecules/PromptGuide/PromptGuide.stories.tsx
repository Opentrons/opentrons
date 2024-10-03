import { I18nextProvider } from 'react-i18next'
import { i18n } from '../../i18n'
import { PromptGuide as PromptGuideComponent } from './index'

import type { Meta, StoryObj } from '@storybook/react'

const meta: Meta<typeof PromptGuideComponent> = {
  title: 'AI/molecules/PromptGuide',
  component: PromptGuideComponent,
  decorators: [
    Story => (
      <I18nextProvider i18n={i18n}>
        <Story />
      </I18nextProvider>
    ),
  ],
}
export default meta
type Story = StoryObj<typeof PromptGuideComponent>
export const PromptGuide: Story = {}
