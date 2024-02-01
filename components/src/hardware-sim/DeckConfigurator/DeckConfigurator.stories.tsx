import * as React from 'react'

import {
  SINGLE_CENTER_SLOT_FIXTURE,
  SINGLE_LEFT_SLOT_FIXTURE,
  STAGING_AREA_RIGHT_SLOT_FIXTURE,
  TRASH_BIN_ADAPTER_FIXTURE,
  WASTE_CHUTE_RIGHT_ADAPTER_COVERED_FIXTURE,
} from '@opentrons/shared-data'

import { DeckConfigurator } from '.'

import type { Story, Meta } from '@storybook/react'
import type { CutoutConfig } from '@opentrons/shared-data'

export default {
  title: 'Library/Molecules/Simulation/DeckConfigurator',
} as Meta

const Template: Story<React.ComponentProps<typeof DeckConfigurator>> = args => (
  <DeckConfigurator {...args} />
)
const deckConfig: CutoutConfig[] = [
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
    cutoutFixtureId: SINGLE_CENTER_SLOT_FIXTURE,
    cutoutId: 'cutoutA2',
  },
  {
    cutoutFixtureId: SINGLE_CENTER_SLOT_FIXTURE,
    cutoutId: 'cutoutB2',
  },
  {
    cutoutFixtureId: SINGLE_CENTER_SLOT_FIXTURE,
    cutoutId: 'cutoutC2',
  },
  {
    cutoutFixtureId: SINGLE_CENTER_SLOT_FIXTURE,
    cutoutId: 'cutoutD2',
  },
  {
    cutoutId: 'cutoutA3',
    cutoutFixtureId: TRASH_BIN_ADAPTER_FIXTURE,
  },
  {
    cutoutId: 'cutoutB3',
    cutoutFixtureId: STAGING_AREA_RIGHT_SLOT_FIXTURE,
  },
  {
    cutoutId: 'cutoutC3',
    cutoutFixtureId: STAGING_AREA_RIGHT_SLOT_FIXTURE,
  },
  {
    cutoutId: 'cutoutD3',
    cutoutFixtureId: WASTE_CHUTE_RIGHT_ADAPTER_COVERED_FIXTURE,
  },
]

export const Default = Template.bind({})
Default.args = {
  deckConfig,
  handleClickAdd: cutoutId => console.log(`add at ${cutoutId}`),
  handleClickRemove: cutoutId => console.log(`remove at ${cutoutId}`),
}

export const ReadOnly = Template.bind({})
ReadOnly.args = {
  deckConfig,
  handleClickAdd: cutoutId => console.log(`add at ${cutoutId}`),
  handleClickRemove: cutoutId => console.log(`remove at ${cutoutId}`),
  readOnly: true,
}
