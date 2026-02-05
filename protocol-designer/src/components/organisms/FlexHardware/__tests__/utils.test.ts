import { describe, expect, it } from 'vitest'

import {
  FLEX_STACKER_WITH_WASTE_CHUTE_ADAPTER_COVERED_FIXTURE,
  FLEX_STACKER_WITH_WASTE_CHUTE_ADAPTER_NO_COVER_FIXTURE,
  HEATERSHAKER_MODULE_V1_FIXTURE,
  SINGLE_RIGHT_SLOT_FIXTURE,
  STAGING_AREA_RIGHT_SLOT_FIXTURE,
  STAGING_AREA_SLOT_WITH_MAGNETIC_BLOCK_V1_FIXTURE,
  STAGING_AREA_SLOT_WITH_WASTE_CHUTE_RIGHT_ADAPTER_COVERED_FIXTURE,
  STAGING_AREA_SLOT_WITH_WASTE_CHUTE_RIGHT_ADAPTER_NO_COVER_FIXTURE,
  TRASH_BIN_ADAPTER_FIXTURE,
  WASTE_CHUTE_RIGHT_ADAPTER_COVERED_FIXTURE,
  WASTE_CHUTE_RIGHT_ADAPTER_NO_COVER_FIXTURE,
} from '@opentrons/shared-data'

import { mapFixtureIdToFixtureName } from '../util'

describe('mapFixtureIdToFixtureName', () => {
  it('returns null when fixtureId is null', () => {
    expect(mapFixtureIdToFixtureName(null)).toBeNull()
  })

  it('returns trashBin for TRASH_BIN_ADAPTER_FIXTURE', () => {
    expect(mapFixtureIdToFixtureName(TRASH_BIN_ADAPTER_FIXTURE)).toBe(
      'trashBin'
    )
  })

  describe('waste chute fixtures', () => {
    it('returns wasteChute for WASTE_CHUTE_RIGHT_ADAPTER_COVERED_FIXTURE', () => {
      expect(
        mapFixtureIdToFixtureName(WASTE_CHUTE_RIGHT_ADAPTER_COVERED_FIXTURE)
      ).toBe('wasteChute')
    })

    it('returns wasteChute for WASTE_CHUTE_RIGHT_ADAPTER_NO_COVER_FIXTURE', () => {
      expect(
        mapFixtureIdToFixtureName(WASTE_CHUTE_RIGHT_ADAPTER_NO_COVER_FIXTURE)
      ).toBe('wasteChute')
    })

    it('returns wasteChute for STAGING_AREA_SLOT_WITH_WASTE_CHUTE_RIGHT_ADAPTER_COVERED_FIXTURE', () => {
      expect(
        mapFixtureIdToFixtureName(
          STAGING_AREA_SLOT_WITH_WASTE_CHUTE_RIGHT_ADAPTER_COVERED_FIXTURE
        )
      ).toBe('wasteChute')
    })

    it('returns wasteChute for STAGING_AREA_SLOT_WITH_WASTE_CHUTE_RIGHT_ADAPTER_NO_COVER_FIXTURE', () => {
      expect(
        mapFixtureIdToFixtureName(
          STAGING_AREA_SLOT_WITH_WASTE_CHUTE_RIGHT_ADAPTER_NO_COVER_FIXTURE
        )
      ).toBe('wasteChute')
    })

    it('returns wasteChute for FLEX_STACKER_WITH_WASTE_CHUTE_ADAPTER_NO_COVER_FIXTURE', () => {
      expect(
        mapFixtureIdToFixtureName(
          FLEX_STACKER_WITH_WASTE_CHUTE_ADAPTER_NO_COVER_FIXTURE
        )
      ).toBe('wasteChute')
    })

    it('returns wasteChute for FLEX_STACKER_WITH_WASTE_CHUTE_ADAPTER_COVERED_FIXTURE', () => {
      expect(
        mapFixtureIdToFixtureName(
          FLEX_STACKER_WITH_WASTE_CHUTE_ADAPTER_COVERED_FIXTURE
        )
      ).toBe('wasteChute')
    })
  })

  describe('staging area fixtures', () => {
    it('returns stagingArea for STAGING_AREA_RIGHT_SLOT_FIXTURE', () => {
      expect(mapFixtureIdToFixtureName(STAGING_AREA_RIGHT_SLOT_FIXTURE)).toBe(
        'stagingArea'
      )
    })

    it('returns stagingArea for STAGING_AREA_SLOT_WITH_MAGNETIC_BLOCK_V1_FIXTURE', () => {
      expect(
        mapFixtureIdToFixtureName(
          STAGING_AREA_SLOT_WITH_MAGNETIC_BLOCK_V1_FIXTURE
        )
      ).toBe('stagingArea')
    })
  })

  describe('unrecognized fixtures', () => {
    it('returns null for SINGLE_RIGHT_SLOT_FIXTURE', () => {
      expect(mapFixtureIdToFixtureName(SINGLE_RIGHT_SLOT_FIXTURE)).toBeNull()
    })

    it('returns null for module fixtures like HEATERSHAKER_MODULE_V1_FIXTURE', () => {
      expect(
        mapFixtureIdToFixtureName(HEATERSHAKER_MODULE_V1_FIXTURE)
      ).toBeNull()
    })
  })
})
