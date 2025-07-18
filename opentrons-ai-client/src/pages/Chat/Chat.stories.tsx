import { I18nextProvider } from 'react-i18next'
import { MemoryRouter } from 'react-router-dom'

import { i18n } from '/ai-client/i18n'

import { Chat as ChatComponent } from './index'

import type { Meta, StoryObj } from '@storybook/react'

const meta: Meta<typeof ChatComponent> = {
  title: 'AI/organisms/ChatContainer',
  component: ChatComponent,
  decorators: [
    Story => (
      <MemoryRouter>
        <I18nextProvider i18n={i18n}>
          <Story />
        </I18nextProvider>
      </MemoryRouter>
    ),
  ],
}
export default meta
type Story = StoryObj<typeof ChatComponent>
export const ChatContainer: Story = {}
