import * as React from 'react'
import fixture_96_plate from '@opentrons/shared-data/labware/fixtures/2/fixture_96_plate.json'
import { MoveLabwareOnDeck as MoveLabwareOnDeckComponent } from './MoveLabwareOnDeck'
import { FLEX_ROBOT_TYPE, LabwareDefinition2 } from '@opentrons/shared-data'

import type { Meta, StoryObj } from '@storybook/react'

const meta: Meta<React.ComponentProps<typeof MoveLabwareOnDeckComponent>> = {
  component: MoveLabwareOnDeckComponent,
  title: 'Library/Molecules/Simulation/MoveLabwareOnDeck',
} as Meta

export default meta
type Story = StoryObj<React.ComponentProps<typeof MoveLabwareOnDeckComponent>>

export const MoveLabwareOnDeck: Story = {
  render: args => (
    <MoveLabwareOnDeckComponent
      height="400px"
      movedLabwareDef={fixture_96_plate as LabwareDefinition2}
      initialLabwareLocation={args.initialLabwareLocation}
      finalLabwareLocation={args.finalLabwareLocation}
      loadedModules={[]}
      robotType={args.robotType}
    />
  ),
  args: {
    initialLabwareLocation: { slotName: 'A1' },
    finalLabwareLocation: 'offDeck',
    robotType: FLEX_ROBOT_TYPE,
  },
}
