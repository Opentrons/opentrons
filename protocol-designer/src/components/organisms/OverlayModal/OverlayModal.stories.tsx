import { VIEWPORT } from '@opentrons/components'

import { OverlayModal } from '.'

import type { Meta, StoryObj } from '@storybook/react'

const meta: Meta<typeof OverlayModal> = {
  title: 'PROTOCOL_DESIGNER/organisms/OverlayModal',
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
    primaryButtonProps: {
      control: {
        type: 'object',
      },
    },
    secondaryButtonProps: {
      control: {
        type: 'object',
      },
    },
  },
  parameters: VIEWPORT.touchScreenViewport,
}

export default meta
type Story = StoryObj<typeof OverlayModal>

export const PrimaryOverlayModal: Story = {
  args: {
    header: 'header',
    subText: 'subText',
    secondaryButtonProps: {
      onClick: () => {
        alert('Cancel')
      },
      text: 'Cancel',
    },
    primaryButtonProps: {
      onClick: () => {
        alert('Continue')
      },
      text: 'Continue',
    },
  },
}

export const ClearLiquidOverlayModal: Story = {
  args: {
    header: 'Selected labware have different liquid layouts',
    subText:
      'Clear liquids in labware to edit them together to edit liquid in these labware at the same time, you will have to clear liquids from them',
    primaryButtonProps: {
      onClick: () => {
        alert('Clear Liquids')
      },
      text: 'Clear Liquids',
    },
    secondaryButtonProps: {
      onClick: () => {
        alert('Cancel')
      },
      text: 'Cancel',
    },
  },
}

export const NoButtonsOverlayModal: Story = {
  args: {
    header: 'Selected labware have different liquid layouts',
    subText:
      'Clear liquids in labware to edit them together to edit liquid in these labware at the same time, you will have to clear liquids from them',
  },
}
