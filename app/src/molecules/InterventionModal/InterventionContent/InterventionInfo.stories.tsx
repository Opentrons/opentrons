import * as React from 'react'

import { Box, ICON_DATA_BY_NAME } from '@opentrons/components'

import { InterventionInfo } from './InterventionInfo'

import type { Meta, StoryObj } from '@storybook/react'

const meta: Meta<typeof InterventionInfo> = {
  title: 'App/Molecules/InterventionModal/InterventionContent/InterventionInfo',
  component: InterventionInfo,
  argTypes: {
    type: {
      control: {
        type: 'select',
        options: ['move', 'refill', 'select'],
      },
    },
    labwareName: {
      control: 'text',
    },
    currentLocationProps: {
      control: {
        type: 'object',
      },
      slotName: {
        control: 'text',
      },
      iconName: {
        control: {
          type: 'select',
          options: Object.keys(ICON_DATA_BY_NAME),
        },
      },
    },
    newLocationProps: {
      control: {
        type: 'object',
      },
      slotName: {
        control: 'text',
      },
      iconName: {
        control: {
          type: 'select',
          options: Object.keys(ICON_DATA_BY_NAME),
        },
      },
    },
  },
}

export default meta

type Story = StoryObj<typeof InterventionInfo>

export const MoveBetweenSlots: Story = {
  args: {
    type: 'move',
    labwareName: 'Plate',
    currentLocationProps: {
      slotName: 'A1',
    },
    newLocationProps: {
      slotName: 'B2',
    },
  },
  render: args => (
    <Box width="27rem">
      <InterventionInfo {...args} />
    </Box>
  ),
}

export const Refill: Story = {
  args: {
    type: 'refill',
    labwareName: 'Tip Rack',
    currentLocationProps: {
      slotName: 'A1',
    },
  },
  render: args => (
    <Box width="27rem">
      <InterventionInfo {...args} />
    </Box>
  ),
}

export const Select: Story = {
  args: {
    type: 'select',
    labwareName: 'Well',
    currentLocationProps: {
      slotName: 'A1',
    },
    newLocationProps: {
      slotName: 'B1',
    },
  },
  render: args => (
    <Box width="27rem">
      <InterventionInfo {...args} />
    </Box>
  ),
}
