import { v4 as uuidv4 } from 'uuid'

import {
  STAGING_AREA_LOAD_NAME,
  STANDARD_SLOT_LOAD_NAME,
  TRASH_BIN_LOAD_NAME,
  WASTE_CHUTE_LOAD_NAME,
} from '@opentrons/shared-data'

import type { Fixture } from '@opentrons/shared-data'

export const DECK_CONFIG_STUB: { [fixtureLocation: string]: Fixture } = {
  A1: {
    fixtureLocation: 'A1',
    loadName: STANDARD_SLOT_LOAD_NAME,
    fixtureId: uuidv4(),
  },
  B1: {
    fixtureLocation: 'B1',
    loadName: STANDARD_SLOT_LOAD_NAME,
    fixtureId: uuidv4(),
  },
  C1: {
    fixtureLocation: 'C1',
    loadName: STANDARD_SLOT_LOAD_NAME,
    fixtureId: uuidv4(),
  },
  D1: {
    fixtureLocation: 'D1',
    loadName: STANDARD_SLOT_LOAD_NAME,
    fixtureId: uuidv4(),
  },
  A2: {
    fixtureLocation: 'A2',
    loadName: STANDARD_SLOT_LOAD_NAME,
    fixtureId: uuidv4(),
  },
  B2: {
    fixtureLocation: 'B2',
    loadName: STANDARD_SLOT_LOAD_NAME,
    fixtureId: uuidv4(),
  },
  C2: {
    fixtureLocation: 'C2',
    loadName: STANDARD_SLOT_LOAD_NAME,
    fixtureId: uuidv4(),
  },
  D2: {
    fixtureLocation: 'D2',
    loadName: STANDARD_SLOT_LOAD_NAME,
    fixtureId: uuidv4(),
  },
  A3: {
    fixtureLocation: 'A3',
    loadName: TRASH_BIN_LOAD_NAME,
    fixtureId: uuidv4(),
  },
  B3: {
    fixtureLocation: 'B3',
    loadName: STANDARD_SLOT_LOAD_NAME,
    fixtureId: uuidv4(),
  },
  C3: {
    fixtureLocation: 'C3',
    loadName: STAGING_AREA_LOAD_NAME,
    fixtureId: uuidv4(),
  },
  D3: {
    fixtureLocation: 'D3',
    loadName: WASTE_CHUTE_LOAD_NAME,
    fixtureId: uuidv4(),
  },
}
