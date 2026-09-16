import { action } from 'storybook/actions'

import { ProtocolDropTipModal } from './ProtocolDropTipModal'

import type { Meta, StoryObj } from '@storybook/react'

const meta: Meta<typeof ProtocolDropTipModal> = {
  title: 'App/Organisms/ProtocolDropTipModal',
  component: ProtocolDropTipModal,
}

export default meta

type Story = StoryObj<typeof ProtocolDropTipModal>

const defaultHandlers = {
  onSkip: action('onSkip'),
  onBeginRemoval: action('onBeginRemoval'),
}

export const Default: Story = {
  args: {
    mount: 'left',
    isDisabled: false,
    ...defaultHandlers,
  },
}

export const Loading: Story = {
  args: {
    mount: 'left',
    isDisabled: true,
    ...defaultHandlers,
  },
}
