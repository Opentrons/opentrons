import { ProtocolDeck as ProtocolDeckComponent } from './index'
import StackerAnalysis from './StackerAnalysis.json'

import type { Meta, StoryObj } from '@storybook/react'

const meta: Meta<typeof ProtocolDeckComponent> = {
  title: 'Helix/Organisms/ProtocolDeck',
  component: ProtocolDeckComponent,
  decorators: [Story => <Story />],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'ProtocolDeck component visualizes the deck layout for a protocol analysis, showing labware, modules, and their positions on the robot deck.',
      },
    },
  },
}

export default meta
type Story = StoryObj<typeof ProtocolDeckComponent>

export const Default: Story = {
  args: {
    protocolAnalysis: StackerAnalysis,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Default ProtocolDeck visualization using the stacker analysis protocol data.',
      },
    },
  },
}

export const WithCustomStyling: Story = {
  args: {
    protocolAnalysis: StackerAnalysis,
    baseDeckProps: {
      showSlotLabels: true,
      svgProps: {
        style: { width: '100%', height: 'auto', border: '1px solid #ccc' },
      },
    },
  },
  parameters: {
    docs: {
      description: {
        story:
          'ProtocolDeck with custom SVG styling applied through baseDeckProps.',
      },
    },
  },
}
