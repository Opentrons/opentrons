import { ICON_DATA_BY_NAME } from '@opentrons/components'

import { Move } from './Move'

import type { Meta, StoryObj } from '@storybook/react'

const meta: Meta<typeof Move> = {
  title: 'App/Organisms/InterventionModal/InterventionStep/Move',
  component: Move,
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

type Story = StoryObj<typeof Move>

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
}

export const Refill: Story = {
  args: {
    type: 'refill',
    labwareName: 'Tip Rack',
    currentLocationProps: {
      slotName: 'A1',
    },
  },
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
}
