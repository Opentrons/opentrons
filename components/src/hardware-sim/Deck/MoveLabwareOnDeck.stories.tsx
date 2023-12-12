import * as React from 'react'
import fixture_96_plate from '@opentrons/shared-data/labware/fixtures/2/fixture_96_plate.json'
import {
  FLEX_ROBOT_TYPE,
  SINGLE_CENTER_SLOT_FIXTURE,
  SINGLE_LEFT_SLOT_FIXTURE,
  SINGLE_RIGHT_SLOT_FIXTURE,
  STAGING_AREA_RIGHT_SLOT_FIXTURE,
} from '@opentrons/shared-data'
import { MoveLabwareOnDeck as MoveLabwareOnDeckComponent } from './MoveLabwareOnDeck'
import type {
  DeckConfiguration,
  LabwareDefinition2,
} from '@opentrons/shared-data'

import type { Meta, StoryObj } from '@storybook/react'

const meta: Meta<React.ComponentProps<typeof MoveLabwareOnDeckComponent>> = {
  component: MoveLabwareOnDeckComponent,
  title: 'Library/Molecules/Simulation/MoveLabwareOnDeck',
} as Meta

export default meta
type Story = StoryObj<React.ComponentProps<typeof MoveLabwareOnDeckComponent>>

const FLEX_SIMPLEST_DECK_CONFIG: DeckConfiguration = [
  {
    cutoutId: 'cutoutA1',
    cutoutFixtureId: SINGLE_LEFT_SLOT_FIXTURE,
  },
  {
    cutoutId: 'cutoutB1',
    cutoutFixtureId: SINGLE_LEFT_SLOT_FIXTURE,
  },
  {
    cutoutId: 'cutoutC1',
    cutoutFixtureId: SINGLE_LEFT_SLOT_FIXTURE,
  },
  {
    cutoutId: 'cutoutD1',
    cutoutFixtureId: SINGLE_LEFT_SLOT_FIXTURE,
  },
  {
    cutoutId: 'cutoutA2',
    cutoutFixtureId: SINGLE_CENTER_SLOT_FIXTURE,
  },
  {
    cutoutId: 'cutoutB2',
    cutoutFixtureId: SINGLE_CENTER_SLOT_FIXTURE,
  },
  {
    cutoutId: 'cutoutC2',
    cutoutFixtureId: SINGLE_CENTER_SLOT_FIXTURE,
  },
  {
    cutoutId: 'cutoutD2',
    cutoutFixtureId: SINGLE_CENTER_SLOT_FIXTURE,
  },
  {
    cutoutId: 'cutoutA3',
    cutoutFixtureId: SINGLE_RIGHT_SLOT_FIXTURE,
  },
  {
    cutoutId: 'cutoutB3',
    cutoutFixtureId: SINGLE_RIGHT_SLOT_FIXTURE,
  },
  {
    cutoutId: 'cutoutC3',
    cutoutFixtureId: SINGLE_RIGHT_SLOT_FIXTURE,
  },
  {
    cutoutId: 'cutoutD3',
    cutoutFixtureId: STAGING_AREA_RIGHT_SLOT_FIXTURE,
  },
]

export const MoveLabwareOnDeck: Story = {
  render: args => (
    <MoveLabwareOnDeckComponent
      movedLabwareDef={fixture_96_plate as LabwareDefinition2}
      initialLabwareLocation={args.initialLabwareLocation}
      finalLabwareLocation={args.finalLabwareLocation}
      loadedModules={[]}
      loadedLabware={[]}
      robotType={args.robotType}
      deckConfig={
        args.robotType === FLEX_ROBOT_TYPE ? FLEX_SIMPLEST_DECK_CONFIG : []
      }
      height="400px"
    />
  ),
  args: {
    initialLabwareLocation: { slotName: 'A1' },
    finalLabwareLocation: 'offDeck',
    robotType: FLEX_ROBOT_TYPE,
  },
}
