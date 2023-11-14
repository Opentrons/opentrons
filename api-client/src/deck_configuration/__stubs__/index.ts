import {
  SINGLE_LEFT_SLOT_FIXTURE,
  SINGLE_CENTER_SLOT_FIXTURE,
  SINGLE_RIGHT_SLOT_FIXTURE,
  STAGING_AREA_RIGHT_SLOT_FIXTURE,
  TRASH_BIN_ADAPTER_FIXTURE,
  WASTE_CHUTE_RIGHT_ADAPTER_NO_COVER_FIXTURE,
} from '@opentrons/shared-data'

import type { CutoutConfig } from '@opentrons/shared-data'

export const DECK_CONFIG_STUB: { [cutoutId: string]: CutoutConfig } = {
  cutoutA1: {
    cutoutId: 'cutoutA1',
    cutoutFixtureId: SINGLE_LEFT_SLOT_FIXTURE,
  },
  cutoutB1: {
    cutoutId: 'cutoutB1',
    cutoutFixtureId: SINGLE_LEFT_SLOT_FIXTURE,
  },
  cutoutC1: {
    cutoutId: 'cutoutC1',
    cutoutFixtureId: SINGLE_LEFT_SLOT_FIXTURE,
  },
  cutoutD1: {
    cutoutId: 'cutoutD1',
    cutoutFixtureId: SINGLE_LEFT_SLOT_FIXTURE,
  },
  cutoutA2: {
    cutoutId: 'cutoutA2',
    cutoutFixtureId: SINGLE_CENTER_SLOT_FIXTURE,
  },
  cutoutB2: {
    cutoutId: 'cutoutB2',
    cutoutFixtureId: SINGLE_CENTER_SLOT_FIXTURE,
  },
  cutoutC2: {
    cutoutId: 'cutoutC2',
    cutoutFixtureId: SINGLE_CENTER_SLOT_FIXTURE,
  },
  cutoutD2: {
    cutoutId: 'cutoutD2',
    cutoutFixtureId: SINGLE_CENTER_SLOT_FIXTURE,
  },
  cutoutA3: {
    cutoutId: 'cutoutA3',
    cutoutFixtureId: TRASH_BIN_ADAPTER_FIXTURE,
  },
  cutoutB3: {
    cutoutId: 'cutoutB3',
    cutoutFixtureId: SINGLE_RIGHT_SLOT_FIXTURE,
  },
  cutoutC3: {
    cutoutId: 'cutoutC3',
    cutoutFixtureId: STAGING_AREA_RIGHT_SLOT_FIXTURE,
  },
  cutoutD3: {
    cutoutId: 'cutoutD3',
    cutoutFixtureId: WASTE_CHUTE_RIGHT_ADAPTER_NO_COVER_FIXTURE,
  },
}
