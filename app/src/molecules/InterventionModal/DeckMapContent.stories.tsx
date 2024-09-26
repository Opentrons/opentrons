import type * as React from 'react'

import { css } from 'styled-components'
import { DeckMapContent } from '.'
import { Box, RESPONSIVENESS, BORDERS } from '@opentrons/components'
import type { Meta, StoryObj } from '@storybook/react'
import {
  FLEX_ROBOT_TYPE,
  OT2_ROBOT_TYPE,
  fixture96Plate,
  fixtureTiprack1000ul,
  HEATERSHAKER_MODULE_V1,
  MAGNETIC_BLOCK_V1,
  TEMPERATURE_MODULE_V2,
  THERMOCYCLER_MODULE_V2,
} from '@opentrons/shared-data'
import type { ModuleLocation, LabwareDefinition2 } from '@opentrons/shared-data'
import {
  EXTENDED_DECK_CONFIG_FIXTURE,
  STANDARD_SLOT_DECK_CONFIG_FIXTURE,
  WASTE_CHUTE_DECK_CONFIG_FIXTURE,
} from './__fixtures__'
import { TwoColumn } from './TwoColumn'
import { StandInContent } from './story-utils/StandIn'

const DEFAULT_MODULES_ON_DECK = [
  {
    moduleLocation: { slotName: 'B1' },
    moduleModel: THERMOCYCLER_MODULE_V2,
    nestedLabwareDef: fixture96Plate as LabwareDefinition2,
    innerProps: { lidMotorState: 'open' },
  },
  {
    moduleLocation: { slotName: 'D1' },
    moduleModel: TEMPERATURE_MODULE_V2,
    nestedLabwareDef: fixture96Plate as LabwareDefinition2,
  },
  {
    moduleLocation: { slotName: 'B3' },
    moduleModel: HEATERSHAKER_MODULE_V1,
    nestedLabwareDef: fixture96Plate as LabwareDefinition2,
  },
  {
    moduleLocation: { slotName: 'D2' },
    moduleModel: MAGNETIC_BLOCK_V1,
    nestedLabwareDef: fixture96Plate as LabwareDefinition2,
  },
]

const DEFAULT_LABWARE_ON_DECK = [
  {
    labwareLocation: { slotName: 'C2' },
    definition: fixture96Plate as LabwareDefinition2,
  },
  {
    labwareLocation: { slotName: 'C3' },
    definition: fixtureTiprack1000ul as LabwareDefinition2,
  },
]

const CONSOLE_LOG_ON_SELECT = (location: ModuleLocation): void => {
  console.log(`selected location is ${location?.slotName}`)
}

const meta: Meta<React.ComponentProps<typeof DeckMapContent>> = {
  title: 'App/Molecules/InterventionModal/DeckMapContent',
  component: DeckMapContent,
  argTypes: {
    robotType: {
      control: {
        type: 'select',
      },
      options: [OT2_ROBOT_TYPE, FLEX_ROBOT_TYPE],
      default: FLEX_ROBOT_TYPE,
    },
    kind: {
      control: {
        type: 'select',
      },
      options: ['intervention', 'deck-config'],
    },
    setSelectedLocation: {
      control: {
        type: 'select',
      },
      options: ['print-to-console'],
      mapping: {
        'print-to-console': CONSOLE_LOG_ON_SELECT,
      },
      if: { arg: 'kind', eq: 'deck-config' },
    },
    deckConfig: {
      control: {
        type: 'select',
      },
      options: ['staging-area', 'waste-chute', 'standard'],
      mapping: {
        'staging-area': EXTENDED_DECK_CONFIG_FIXTURE,
        'waste-chute': WASTE_CHUTE_DECK_CONFIG_FIXTURE,
        standard: STANDARD_SLOT_DECK_CONFIG_FIXTURE,
      },
      if: { arg: 'kind', eq: 'intervention' },
    },
    labwareOnDeck: {
      if: { arg: 'kind', eq: 'intervention' },
    },
    modulesOnDeck: {
      if: { arg: 'kind', eq: 'intervention' },
    },
    highlightLabwareEventuallyIn: {
      if: { arg: 'kind', eq: 'intervention' },
    },
  },
  decorators: [
    Story => (
      <Box
        css={css`
          border: 4px solid #000000;
          border-radius: ${BORDERS.borderRadius8};
          max-width: 47rem;
          @media ${RESPONSIVENESS.touchscreenMediaQuerySpecs} {
            max-width: 62rem;
            max-height: 33.5rem;
          }
        `}
      >
        <TwoColumn>
          <StandInContent />
          <Story />
        </TwoColumn>
      </Box>
    ),
  ],
}

export default meta

type Story = StoryObj<typeof DeckMapContent>

export const InterventionMap: Story = {
  args: {
    kind: 'intervention',
    robotType: FLEX_ROBOT_TYPE,
    deckConfig: EXTENDED_DECK_CONFIG_FIXTURE,
    labwareOnDeck: DEFAULT_LABWARE_ON_DECK,
    modulesOnDeck: DEFAULT_MODULES_ON_DECK,
    highlightLabwareEventuallyIn: ['thermocyclerModuleV2', 'C3'],
  },
}

export const DeckConfigMap: Story = {
  args: {
    kind: 'deck-config',
    robotType: FLEX_ROBOT_TYPE,
    setSelectedLocation: CONSOLE_LOG_ON_SELECT,
  },
}
