import {
  SINGLE_LEFT_SLOT_FIXTURE,
  SINGLE_CENTER_SLOT_FIXTURE,
  TRASH_BIN_ADAPTER_FIXTURE,
  SINGLE_RIGHT_SLOT_FIXTURE,
  STAGING_AREA_RIGHT_SLOT_FIXTURE,
  WASTE_CHUTE_RIGHT_ADAPTER_COVERED_FIXTURE,
} from '@opentrons/shared-data'

import type { DeckConfiguration } from '@opentrons/shared-data'

export const STANDARD_SLOT_DECK_CONFIG_FIXTURE: DeckConfiguration = [
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
    cutoutFixtureId: TRASH_BIN_ADAPTER_FIXTURE,
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
    cutoutFixtureId: SINGLE_RIGHT_SLOT_FIXTURE,
  },
]

// contains staging area fixtures
export const EXTENDED_DECK_CONFIG_FIXTURE: DeckConfiguration = [
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
    cutoutFixtureId: STAGING_AREA_RIGHT_SLOT_FIXTURE,
  },
]

// contains waste chute fixture
export const WASTE_CHUTE_DECK_CONFIG_FIXTURE: DeckConfiguration = [
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
    cutoutFixtureId: TRASH_BIN_ADAPTER_FIXTURE,
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
