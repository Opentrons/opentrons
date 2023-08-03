import * as React from 'react'
import fixture_96_plate from '@opentrons/shared-data/labware/fixtures/2/fixture_96_plate.json'
import fixture_tiprack_1000_ul from '@opentrons/shared-data/labware/fixtures/2/fixture_tiprack_1000_ul.json'
import { FLEX_ROBOT_TYPE, LabwareDefinition2 } from '@opentrons/shared-data'

import type { Meta, StoryObj } from '@storybook/react'
import { BaseDeck as BaseDeckComponent } from './'
import {
  HEATERSHAKER_MODULE_V1,
  MAGNETIC_BLOCK_V1,
  TEMPERATURE_MODULE_V2,
  THERMOCYCLER_MODULE_V2,
} from '@opentrons/shared-data/js'

const meta: Meta<React.ComponentProps<typeof BaseDeckComponent>> = {
  component: BaseDeckComponent,
  title: 'Library/Molecules/Simulation/BaseDeck',
} as Meta

export default meta
type Story = StoryObj<React.ComponentProps<typeof BaseDeckComponent>>

export const BaseDeck: Story = {
  render: args => <BaseDeckComponent {...args} />,
  args: {
    robotType: FLEX_ROBOT_TYPE,
    trashSlotName: 'A3',
    labwareLocations: [
      {
        labwareLocation: { slotName: 'C2' },
        definition: fixture_96_plate as LabwareDefinition2,
      },
      {
        labwareLocation: { slotName: 'C3' },
        definition: fixture_tiprack_1000_ul as LabwareDefinition2,
      },
    ],
    moduleLocations: [
      {
        moduleLocation: { slotName: 'B1' },
        moduleModel: THERMOCYCLER_MODULE_V2,
        nestedLabwareDef: fixture_96_plate as LabwareDefinition2,
        innerProps: { lidMotorState: 'open' },
      },
      {
        moduleLocation: { slotName: 'D1' },
        moduleModel: TEMPERATURE_MODULE_V2,
        nestedLabwareDef: fixture_96_plate as LabwareDefinition2,
      },
      {
        moduleLocation: { slotName: 'D3' },
        moduleModel: HEATERSHAKER_MODULE_V1,
        nestedLabwareDef: fixture_96_plate as LabwareDefinition2,
      },
      {
        moduleLocation: { slotName: 'D2' },
        moduleModel: MAGNETIC_BLOCK_V1,
        nestedLabwareDef: fixture_96_plate as LabwareDefinition2,
      },
    ],
    darkFill: 'rebeccapurple',
    lightFill: 'lavender',
  },
}
