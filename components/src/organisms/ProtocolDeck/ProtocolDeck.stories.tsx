import { ProtocolDeck } from '.'
// Import the real protocol analysis data
import realProtocolAnalysis from './1751479157228.json'

import type { Meta, StoryObj } from '@storybook/react'
import type { CompletedProtocolAnalysis } from '@opentrons/shared-data'

const meta: Meta<typeof ProtocolDeck> = {
  title: 'Library/Organisms/ProtocolDeck',
  component: ProtocolDeck,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `
The ProtocolDeck component renders a visual representation of a protocol deck setup
with labware, modules, and other equipment positioned on the deck. It takes a protocol
analysis and renders the deck using the BaseDeck component with appropriate configuration.

## Usage Notes

- Pass in a \`protocolAnalysis\` prop with protocol analysis data
- Use \`baseDeckProps\` to customize the underlying BaseDeck component
- The component automatically handles deck configuration, labware positioning, and module rendering
- Returns null if the analysis is null or contains errors
        `,
      },
    },
  },
  argTypes: {
    protocolAnalysis: {
      control: { type: 'object' },
      description:
        'Protocol analysis data containing commands, labware, modules, etc.',
    },
    baseDeckProps: {
      control: { type: 'object' },
      description:
        'Additional props to pass to the underlying BaseDeck component',
    },
  },
}

export default meta
type Story = StoryObj<typeof ProtocolDeck>

// Story with real protocol analysis data - P50 & P1000 transfer protocol
export const Default: Story = {
  args: {
    protocolAnalysis: realProtocolAnalysis as CompletedProtocolAnalysis,
    baseDeckProps: {
      showSlotLabels: true,
      showExpansion: true,
      animatedSVG: false,
      svgProps: {
        style: {
          transform: 'none',
          transformOrigin: 'initial',
          width: '100%',
          height: 'auto',
        },
      },
    },
  },
}
