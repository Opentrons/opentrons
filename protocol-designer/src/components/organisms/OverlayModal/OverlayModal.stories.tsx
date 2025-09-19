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
    primaryButtonText: {
      control: {
        type: 'text',
      },
    },
    secondaryButtonText: {
      control: {
        type: 'text',
      },
    },
    onSecondaryButtonClick: {
      control: {
        type: 'function',
      },
    },
    onPrimaryButtonClick: {
      control: {
        type: 'function',
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
    onSecondaryButtonClick: () => {
      alert('Cancel')
    },
    onPrimaryButtonClick: () => {
      alert('Continue')
    },
  },
}

export const ClearLiquidOverlayModal: Story = {
  args: {
    header: 'Selected labware have different liquid layouts',
    subText:
      'Clear liquids in labware to edit them together to edit liquid in these labware at the same time, you will have to clear liquids from them',
    primaryButtonText: 'Clear Liquids',
    secondaryButtonText: 'Cancel',
    onSecondaryButtonClick: () => {
      alert('Cancel')
    },
    onPrimaryButtonClick: () => {
      alert('Clear Liquids')
    },
  },
}
