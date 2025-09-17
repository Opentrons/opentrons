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
    children: (
      <Flex alignItems={ALIGN_CENTER} justifyContent={JUSTIFY_SPACE_BETWEEN} gridGap={SPACING.spacing16}>
        <SecondaryButton>cancel</SecondaryButton>
        <PrimaryButton backgroundColor={COLORS.red50}>continue</PrimaryButton>
      </Flex>
    ),
    handleCancel: () => {},
    handleContinue: () => {},
  },
}
