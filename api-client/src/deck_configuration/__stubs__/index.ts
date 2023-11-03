import { v4 as uuidv4 } from 'uuid'

import {
  STAGING_AREA_LOAD_NAME,
  STANDARD_SLOT_LOAD_NAME,
  TRASH_BIN_LOAD_NAME,
  WASTE_CHUTE_LOAD_NAME,
} from '@opentrons/shared-data'

import type { Fixture } from '@opentrons/shared-data'

export const DECK_CONFIG_STUB: { [fixtureLocation: string]: Fixture } = {
  cutoutA1: {
    fixtureLocation: 'cutoutA1',
    loadName: STANDARD_SLOT_LOAD_NAME,
    fixtureId: uuidv4(),
  },
  cutoutB1: {
    fixtureLocation: 'cutoutB1',
    loadName: STANDARD_SLOT_LOAD_NAME,
    fixtureId: uuidv4(),
  },
  cutoutC1: {
    fixtureLocation: 'cutoutC1',
    loadName: STANDARD_SLOT_LOAD_NAME,
    fixtureId: uuidv4(),
  },
  cutoutD1: {
    fixtureLocation: 'cutoutD1',
    loadName: STANDARD_SLOT_LOAD_NAME,
    fixtureId: uuidv4(),
  },
  cutoutA2: {
    fixtureLocation: 'cutoutA2',
    loadName: STANDARD_SLOT_LOAD_NAME,
    fixtureId: uuidv4(),
  },
  cutoutB2: {
    fixtureLocation: 'cutoutB2',
    loadName: STANDARD_SLOT_LOAD_NAME,
    fixtureId: uuidv4(),
  },
  cutoutC2: {
    fixtureLocation: 'cutoutC2',
    loadName: STANDARD_SLOT_LOAD_NAME,
    fixtureId: uuidv4(),
  },
  cutoutD2: {
    fixtureLocation: 'cutoutD2',
    loadName: STANDARD_SLOT_LOAD_NAME,
    fixtureId: uuidv4(),
  },
  cutoutA3: {
    fixtureLocation: 'cutoutA3',
    loadName: TRASH_BIN_LOAD_NAME,
    fixtureId: uuidv4(),
  },
  cutoutB3: {
    fixtureLocation: 'cutoutB3',
    loadName: STANDARD_SLOT_LOAD_NAME,
    fixtureId: uuidv4(),
  },
  cutoutC3: {
    fixtureLocation: 'cutoutC3',
    loadName: STAGING_AREA_LOAD_NAME,
    fixtureId: uuidv4(),
  },
  cutoutD3: {
    fixtureLocation: 'cutoutD3',
    loadName: WASTE_CHUTE_LOAD_NAME,
    fixtureId: uuidv4(),
  },
}
