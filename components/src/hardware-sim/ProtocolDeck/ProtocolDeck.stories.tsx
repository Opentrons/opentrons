import * as React from 'react'
import analysisFileFixture from './__fixtures__/analysis_QIAseqFX24xv4_8.json'

import { ProtocolDeck as ProtocolDeckComponent } from './'

import type { Meta, StoryObj } from '@storybook/react'
import type { ProtocolAnalysisOutput } from '@opentrons/shared-data'

const meta: Meta<React.ComponentProps<typeof ProtocolDeckComponent>> = {
  component: ProtocolDeckComponent,
  title: 'Library/Molecules/Simulation/ProtocolDeck',
} as Meta

export default meta
type Story = StoryObj<React.ComponentProps<typeof ProtocolDeckComponent>>


export const ProtocolDeck: Story = {
  args: {
    protocolAnalysis: analysisFileFixture as ProtocolAnalysisOutput
  },
  render: args => {
    return <ProtocolDeckComponent {...args} />
  },
}
