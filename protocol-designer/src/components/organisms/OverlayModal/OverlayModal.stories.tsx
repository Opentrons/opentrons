import {
  ALIGN_CENTER,
  COLORS,
  Flex,
  JUSTIFY_SPACE_BETWEEN,
  PrimaryButton,
  SecondaryButton,
  SPACING,
  VIEWPORT,
} from '@opentrons/components'

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
    children: {
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
    children: (
      <Flex
        alignItems={ALIGN_CENTER}
        justifyContent={JUSTIFY_SPACE_BETWEEN}
        gridGap={SPACING.spacing16}
      >
        <SecondaryButton
          backgroundColor={COLORS.white}
          onClick={() => {
            alert('cancel')
          }}
        >
          cancel
        </SecondaryButton>
        <PrimaryButton
          backgroundColor={COLORS.red50}
          onClick={() => {
            alert('continue')
          }}
        >
          continue
        </PrimaryButton>
      </Flex>
    ),
  },
}

export const ClearLiquidOverlayModal: Story = {
  args: {
    header: 'Labware have different liquid layouts',
    subText:
      'To edit liquid in these labware at the same time, you will have to clear liquids from them',
    children: (
      <Flex
        alignItems={ALIGN_CENTER}
        justifyContent={JUSTIFY_SPACE_BETWEEN}
        gridGap={SPACING.spacing16}
      >
        <SecondaryButton
          backgroundColor={COLORS.white}
          onClick={() => {
            alert('Cancel')
          }}
        >
          Cancel
        </SecondaryButton>
        <PrimaryButton
          backgroundColor={COLORS.red50}
          onClick={() => {
            alert('Clear Liquids')
          }}
        >
          Clear Liquids
        </PrimaryButton>
      </Flex>
    ),
  },
}
