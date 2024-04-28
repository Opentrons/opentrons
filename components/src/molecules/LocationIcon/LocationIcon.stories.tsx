import * as React from 'react'
import { Flex } from '../../primitives'
import { SPACING } from '../../ui-style-constants'
import { GlobalStyle } from '../../../../app/src/atoms/GlobalStyle'
import { customViewports } from '../../../../.storybook/preview'
import { ICON_DATA_BY_NAME } from '../../icons'
import { LocationIcon } from '.'
import type { Meta, StoryObj } from '@storybook/react'

const slots = [
  'A1',
  'A2',
  'A3',
  'A4',
  'B1',
  'B2',
  'B3',
  'B4',
  'C1',
  'C2',
  'C3',
  'C4',
  'D1',
  'D2',
  'D3',
  'D4',
]

const meta: Meta<typeof LocationIcon> = {
  title: 'Library/Molecules/LocationIcon',
  argTypes: {
    iconName: {
      control: {
        type: 'select',
      },
      options: Object.keys(ICON_DATA_BY_NAME),
    },
    slotName: {
      control: {
        type: 'select',
      },
      options: slots,
    },
  },
  component: LocationIcon,
  parameters: {
    viewport: {
      viewports: customViewports,
      defaultViewport: 'onDeviceDisplay',
    },
  },
  decorators: [
    Story => (
      <Flex padding={SPACING.spacing16} width="15rem" height="5rem">
        <GlobalStyle isOnDevice />
        <Story />
      </Flex>
    ),
  ],
}
export default meta
type Story = StoryObj<typeof LocationIcon>

export const DisplaySlot: Story = {
  args: {
    slotName: 'A1',
    iconName: undefined,
  },
}

export const DisplayIcon: Story = {
  args: {
    iconName: 'ot-temperature-v2',
  },
}
