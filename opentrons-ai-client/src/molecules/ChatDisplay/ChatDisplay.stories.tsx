import { I18nextProvider } from 'react-i18next'
import { COLORS, Flex, SPACING } from '@opentrons/components'
import { i18n } from '../../i18n'
import { ChatDisplay } from './index'

import type { Meta, StoryObj } from '@storybook/react'

const meta: Meta<typeof ChatDisplay> = {
  title: 'AI/molecules/ChatDisplay',
  component: ChatDisplay,
  decorators: [
    Story => (
      <I18nextProvider i18n={i18n}>
        <Flex backgroundColor={COLORS.grey10} padding={SPACING.spacing40}>
          <Story />
        </Flex>
      </I18nextProvider>
    ),
  ],
}
export default meta
type Story = StoryObj<typeof ChatDisplay>

export const OpentronsAI: Story = {
  args: {
    chat: {
      role: 'assistant',
      content: `
## sample output from OpentronsAI

\`\`\`py
from opentrons import protocol_api
# Metadata
metadata = {
    'protocolName': 'ThermoPrime Taq DNA Polymerase PCR Amplification',
    'author': 'Name <email@address.com>',
    'description': 'PCR amplification using ThermoPrime Taq DNA Polymerase kit',
    'apiLevel': '2.11'
}

# Protocol run function
def run(protocol: protocol_api.ProtocolContext):

    # Constants
    NO_OF_SAMPLES = 41
    SAMPLE_VOL = 3  # uL
    MASTERMIX_VOL = 10  # uL
    TC_SAMPLE_MASTERMIX_MIXES = 4
    TC_SAMPLE_MASTERMIX_MIX_VOLUME = SAMPLE_VOL + MASTERMIX_VOL
    MASTERMIX_BLOCK_TEMP = 10  # degree C
    TEMP_DECK_WAIT_TIME = 50  # seconds
\`\`\`
`,
    },
  },
}

export const User: Story = {
  args: {
    chat: {
      role: 'user',
      content: `
    - Application: Reagent transfer
    - Robot: OT-2
    - API: 2.13

    Pipette mount:
    - P1000 Single-Channel GEN2 is mounted on left
    - P300 Single-Channel GEN2 is mounted on right

    Labware:
    - Source Labware: Thermo Scientific Nunc 96 Well Plate 2000 µL on slot 7
    - Destination Labware: Opentrons 24 Well Aluminum Block with NEST 0.5 mL Screwcap on slot 3
    - Tiprack: Opentrons 96 Filter Tip Rack 1000 µL on slot 4

    Commands:
    - Using P1000 Single-Channel GEN2 pipette on left mount, transfer 195.0 uL of reagent
    from H10, F12, D7, B1, C8  wells in source labware
    to first well in the destination labware.
    Use  new tip for each transfer.
    `,
    },
  },
}
