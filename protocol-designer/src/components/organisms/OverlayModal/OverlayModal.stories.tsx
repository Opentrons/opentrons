import { Btn, VIEWPORT } from '@opentrons/components'

import { OverlayModal } from '.'

import type { Meta, StoryObj } from '@storybook/react'

const meta: Meta<typeof OverlayModal> = {
  title: 'PD/organisms/OverlayModal',
  component: OverlayModal,
  argTypes: {
    header: {
      control: {
        type: 'text',
      },
    },
    subText: {
      control: {
        type: 'text',
      },
    },
    children: {
      control: {
        type: 'object',
      },
    },
    handleCancel: { action: 'clicked' },
    handleContinue: { action: 'clicked' },
  },
  parameters: VIEWPORT.touchScreenViewport,
}

export default meta
type Story = StoryObj<typeof OverlayModal>

export const PrimaryOverlayModal: Story = {
  args: {
    header: 'header',
    subText: 'subText',
    children: <Btn>Button</Btn>,
    handleCancel: () => {},
    handleContinue: () => {},
  },
}
