import { ProtocolDeck as ProtocolDeckComponent } from './index'
import StackerAnalysis from './StackerAnalysis.json'

import type { Meta, StoryObj } from '@storybook/react'

const meta: Meta<typeof ProtocolDeckComponent> = {
  title: 'Helix/Organisms/ProtocolDeck',
  component: ProtocolDeckComponent,
  decorators: [
    Story => (
      <div style={{ width: '50rem', height: '50rem' }}>
        <Story />
      </div>
    ),
  ],
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
    protocolAnalysis: StackerAnalysis as any,
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
    protocolAnalysis: StackerAnalysis as any,
    baseDeckProps: {
      showSlotLabels: true,
    },
  },
  parameters: {
    docs: {
      description: {
        story:
          'ProtocolDeck with slot labels shown for easier identification of deck positions.',
      },
    },
  },
}

export const NullAnalysis: Story = {
  args: {
    protocolAnalysis: null,
  },
  parameters: {
    docs: {
      description: {
        story:
          'ProtocolDeck with null analysis - should render nothing gracefully.',
      },
    },
  },
}

export const ErrorAnalysis: Story = {
  args: {
    protocolAnalysis: {
      ...StackerAnalysis,
      errors: [{ id: 'test-error', detail: 'Test error message' }],
    } as any,
  },
  parameters: {
    docs: {
      description: {
        story:
          'ProtocolDeck with analysis containing errors - should render nothing when errors are present.',
      },
    },
  },
}
