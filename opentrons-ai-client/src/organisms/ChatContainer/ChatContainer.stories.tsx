import React from 'react'
import { I18nextProvider } from 'react-i18next'
import { i18n } from '../../i18n'
import { ChatContainer as ChatContainerComponent } from './index'

import type { Meta, StoryObj } from '@storybook/react'

const meta: Meta<typeof ChatContainerComponent> = {
  title: 'AI/organisms/ChatContainer',
  component: ChatContainerComponent,
  decorators: [
    Story => (
      <I18nextProvider i18n={i18n}>
        <Story />
      </I18nextProvider>
    ),
  ],
}
export default meta
type Story = StoryObj<typeof ChatContainerComponent>
export const ChatContainer: Story = {}
