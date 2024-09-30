import { I18nextProvider } from 'react-i18next'
import { i18n } from '../../i18n'
import { MainContentContainer as MainContentContainerComponent } from './index'

import type { Meta, StoryObj } from '@storybook/react'

const meta: Meta<typeof MainContentContainerComponent> = {
  title: 'AI/organisms/ChatContainer',
  component: MainContentContainerComponent,
  decorators: [
    Story => (
      <I18nextProvider i18n={i18n}>
        <Story />
      </I18nextProvider>
    ),
  ],
}
export default meta
type Story = StoryObj<typeof MainContentContainerComponent>
export const ChatContainer: Story = {}
