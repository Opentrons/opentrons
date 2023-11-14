import { v4 as uuidv4 } from 'uuid'

import {
  STAGING_AREA_LOAD_NAME,
  STANDARD_SLOT_LOAD_NAME,
  TRASH_BIN_LOAD_NAME,
  WASTE_CHUTE_LOAD_NAME,
} from '@opentrons/shared-data'

import type { DeckConfiguration } from '@opentrons/shared-data'

export const STANDARD_SLOT_DECK_CONFIG_FIXTURE: DeckConfiguration = [
  {
    fixtureLocation: 'cutoutA1',
    loadName: STANDARD_SLOT_LOAD_NAME,
    fixtureId: uuidv4(),
  },
  {
    fixtureLocation: 'cutoutB1',
    loadName: STANDARD_SLOT_LOAD_NAME,
    fixtureId: uuidv4(),
  },
  {
    fixtureLocation: 'cutoutC1',
    loadName: STANDARD_SLOT_LOAD_NAME,
    fixtureId: uuidv4(),
  },
  {
    fixtureLocation: 'cutoutD1',
    loadName: STANDARD_SLOT_LOAD_NAME,
    fixtureId: uuidv4(),
  },
  {
    fixtureLocation: 'cutoutA2',
    loadName: STANDARD_SLOT_LOAD_NAME,
    fixtureId: uuidv4(),
  },
  {
    fixtureLocation: 'cutoutB2',
    loadName: STANDARD_SLOT_LOAD_NAME,
    fixtureId: uuidv4(),
  },
  {
    fixtureLocation: 'cutoutC2',
    loadName: STANDARD_SLOT_LOAD_NAME,
    fixtureId: uuidv4(),
  },
  {
    fixtureLocation: 'cutoutD2',
    loadName: STANDARD_SLOT_LOAD_NAME,
    fixtureId: uuidv4(),
  },
  {
    fixtureLocation: 'cutoutA3',
    loadName: TRASH_BIN_LOAD_NAME,
    fixtureId: uuidv4(),
  },
  {
    fixtureLocation: 'cutoutB3',
    loadName: STANDARD_SLOT_LOAD_NAME,
    fixtureId: uuidv4(),
  },
  {
    fixtureLocation: 'cutoutC3',
    loadName: STANDARD_SLOT_LOAD_NAME,
    fixtureId: uuidv4(),
  },
  {
    fixtureLocation: 'cutoutD3',
    loadName: STANDARD_SLOT_LOAD_NAME,
    fixtureId: uuidv4(),
  },
]

// contains staging area fixtures
export const EXTENDED_DECK_CONFIG_FIXTURE: DeckConfiguration = [
  {
    fixtureLocation: 'cutoutA1',
    loadName: STANDARD_SLOT_LOAD_NAME,
    fixtureId: uuidv4(),
  },
  {
    fixtureLocation: 'cutoutB1',
    loadName: STANDARD_SLOT_LOAD_NAME,
    fixtureId: uuidv4(),
  },
  {
    fixtureLocation: 'cutoutC1',
    loadName: STANDARD_SLOT_LOAD_NAME,
    fixtureId: uuidv4(),
  },
  {
    fixtureLocation: 'cutoutD1',
    loadName: STANDARD_SLOT_LOAD_NAME,
    fixtureId: uuidv4(),
  },
  {
    fixtureLocation: 'cutoutA2',
    loadName: STANDARD_SLOT_LOAD_NAME,
    fixtureId: uuidv4(),
  },
  {
    fixtureLocation: 'cutoutB2',
    loadName: STANDARD_SLOT_LOAD_NAME,
    fixtureId: uuidv4(),
  },
  {
    fixtureLocation: 'cutoutC2',
    loadName: STANDARD_SLOT_LOAD_NAME,
    fixtureId: uuidv4(),
  },
  {
    fixtureLocation: 'cutoutD2',
    loadName: STANDARD_SLOT_LOAD_NAME,
    fixtureId: uuidv4(),
  },
  {
    fixtureLocation: 'cutoutA3',
    loadName: TRASH_BIN_LOAD_NAME,
    fixtureId: uuidv4(),
  },
  {
    fixtureLocation: 'cutoutB3',
    loadName: STAGING_AREA_LOAD_NAME,
    fixtureId: uuidv4(),
  },
  {
    fixtureLocation: 'cutoutC3',
    loadName: STAGING_AREA_LOAD_NAME,
    fixtureId: uuidv4(),
  },
  {
    fixtureLocation: 'cutoutD3',
    loadName: STAGING_AREA_LOAD_NAME,
    fixtureId: uuidv4(),
  },
]

// contains waste chute fixture
export const WASTE_CHUTE_DECK_CONFIG_FIXTURE: DeckConfiguration = [
  {
    fixtureLocation: 'cutoutA1',
    loadName: STANDARD_SLOT_LOAD_NAME,
    fixtureId: uuidv4(),
  },
  {
    fixtureLocation: 'cutoutB1',
    loadName: STANDARD_SLOT_LOAD_NAME,
    fixtureId: uuidv4(),
  },
  {
    fixtureLocation: 'cutoutC1',
    loadName: TRASH_BIN_LOAD_NAME,
    fixtureId: uuidv4(),
  },
  {
    fixtureLocation: 'cutoutD1',
    loadName: STANDARD_SLOT_LOAD_NAME,
    fixtureId: uuidv4(),
  },
  {
    fixtureLocation: 'cutoutA2',
    loadName: STANDARD_SLOT_LOAD_NAME,
    fixtureId: uuidv4(),
  },
  {
    fixtureLocation: 'cutoutB2',
    loadName: STANDARD_SLOT_LOAD_NAME,
    fixtureId: uuidv4(),
  },
  {
    fixtureLocation: 'cutoutC2',
    loadName: STANDARD_SLOT_LOAD_NAME,
    fixtureId: uuidv4(),
  },
  {
    fixtureLocation: 'cutoutD2',
    loadName: STANDARD_SLOT_LOAD_NAME,
    fixtureId: uuidv4(),
  },
  {
    fixtureLocation: 'cutoutA3',
    loadName: STANDARD_SLOT_LOAD_NAME,
    fixtureId: uuidv4(),
  },
  {
    fixtureLocation: 'cutoutB3',
    loadName: STAGING_AREA_LOAD_NAME,
    fixtureId: uuidv4(),
  },
  {
    fixtureLocation: 'cutoutC3',
    loadName: STAGING_AREA_LOAD_NAME,
    fixtureId: uuidv4(),
  },
  {
    fixtureLocation: 'cutoutD3',
    loadName: WASTE_CHUTE_LOAD_NAME,
    fixtureId: uuidv4(),
  },
]
