import * as React from 'react'
import { v4 as uuidv4 } from 'uuid'

import {
  STAGING_AREA_LOAD_NAME,
  STANDARD_SLOT_LOAD_NAME,
  TRASH_BIN_LOAD_NAME,
  WASTE_CHUTE_LOAD_NAME,
} from '@opentrons/shared-data'

import { DeckConfigurator } from '.'

import type { Story, Meta } from '@storybook/react'

export default {
  title: 'Library/Molecules/Simulation/DeckConfigurator',
} as Meta

const Template: Story<React.ComponentProps<typeof DeckConfigurator>> = args => (
  <DeckConfigurator {...args} />
)
const deckConfig = [
  {
    fixtureLocation: 'A1',
    loadName: STANDARD_SLOT_LOAD_NAME,
    fixtureId: uuidv4(),
  },
  {
    fixtureLocation: 'B1',
    loadName: STANDARD_SLOT_LOAD_NAME,
    fixtureId: uuidv4(),
  },
  {
    fixtureLocation: 'C1',
    loadName: STANDARD_SLOT_LOAD_NAME,
    fixtureId: uuidv4(),
  },
  {
    fixtureLocation: 'D1',
    loadName: STANDARD_SLOT_LOAD_NAME,
    fixtureId: uuidv4(),
  },
  {
    fixtureLocation: 'A3',
    loadName: TRASH_BIN_LOAD_NAME,
    fixtureId: uuidv4(),
  },
  {
    fixtureLocation: 'B3',
    loadName: STANDARD_SLOT_LOAD_NAME,
    fixtureId: uuidv4(),
  },
  {
    fixtureLocation: 'C3',
    loadName: STAGING_AREA_LOAD_NAME,
    fixtureId: uuidv4(),
  },
  {
    fixtureLocation: 'D3',
    loadName: WASTE_CHUTE_LOAD_NAME,
    fixtureId: uuidv4(),
  },
]

export const Default = Template.bind({})
Default.args = {
  deckConfig,
  handleClickAdd: fixtureLocation => console.log(`add at ${fixtureLocation}`),
  handleClickRemove: fixtureLocation =>
    console.log(`remove at ${fixtureLocation}`),
}

export const ReadOnly = Template.bind({})
ReadOnly.args = {
  deckConfig,
  handleClickAdd: fixtureLocation => console.log(`add at ${fixtureLocation}`),
  handleClickRemove: fixtureLocation =>
    console.log(`remove at ${fixtureLocation}`),
  readOnly: true,
}
