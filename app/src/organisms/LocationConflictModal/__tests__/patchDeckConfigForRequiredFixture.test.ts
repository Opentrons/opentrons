import { describe, expect, it } from 'vitest'

import {
  FLEX_STACKER_V1_FIXTURE,
  FLEX_STACKER_WITH_MAG_BLOCK_FIXTURE,
  FLEX_STACKER_WTIH_WASTE_CHUTE_ADAPTER_NO_COVER_FIXTURE,
  HEATERSHAKER_MODULE_V1_FIXTURE,
  MAGNETIC_BLOCK_V1_FIXTURE,
  SINGLE_LEFT_SLOT_FIXTURE,
  STAGING_AREA_RIGHT_SLOT_FIXTURE,
  STAGING_AREA_SLOT_WITH_MAGNETIC_BLOCK_V1_FIXTURE,
  THERMOCYCLER_V2_REAR_FIXTURE,
} from '@opentrons/shared-data'

import { patchDeckConfigForRequiredFixture } from '../patchDeckConfigForRequiredFixture'

import type { DeckConfiguration } from '@opentrons/shared-data'

describe('patchDeckConfigForRequiredFixture', () => {
  const startingDeckConfig = [
    { cutoutId: 'cutoutA1', cutoutFixtureId: THERMOCYCLER_V2_REAR_FIXTURE },
    { cutoutId: 'cutoutB1', cutoutFixtureId: THERMOCYCLER_V2_REAR_FIXTURE },
    {
      cutoutId: 'cutoutA3',
      cutoutFixtureId: STAGING_AREA_RIGHT_SLOT_FIXTURE,
    },
    {
      cutoutId: 'cutoutB3',
      cutoutFixtureId: FLEX_STACKER_V1_FIXTURE,
      opentronsModuleSerialNumber: 'flex-1',
    },
    {
      cutoutId: 'cutoutC1',
      cutoutFixtureId: HEATERSHAKER_MODULE_V1_FIXTURE,
      opentronsModuleSerialNumber: 'hs-1',
    },
    {
      cutoutId: 'cutoutC3',
      cutoutFixtureId: MAGNETIC_BLOCK_V1_FIXTURE,
    },
    {
      cutoutId: 'cutoutD3',
      cutoutFixtureId: FLEX_STACKER_V1_FIXTURE,
      opentronsModuleSerialNumber: 'flex-2',
    },
  ] as DeckConfiguration
  it('should patch deck config with combination fixture if staging area is configured and mag block is required', () => {
    const result = patchDeckConfigForRequiredFixture(
      startingDeckConfig,
      'cutoutA3',
      MAGNETIC_BLOCK_V1_FIXTURE
    )
    expect(result).toEqual([
      { cutoutId: 'cutoutA1', cutoutFixtureId: THERMOCYCLER_V2_REAR_FIXTURE },
      { cutoutId: 'cutoutB1', cutoutFixtureId: THERMOCYCLER_V2_REAR_FIXTURE },
      {
        cutoutId: 'cutoutA3',
        cutoutFixtureId: STAGING_AREA_SLOT_WITH_MAGNETIC_BLOCK_V1_FIXTURE,
      },
      {
        cutoutId: 'cutoutB3',
        cutoutFixtureId: FLEX_STACKER_V1_FIXTURE,
        opentronsModuleSerialNumber: 'flex-1',
      },
      {
        cutoutId: 'cutoutC1',
        cutoutFixtureId: HEATERSHAKER_MODULE_V1_FIXTURE,
        opentronsModuleSerialNumber: 'hs-1',
      },

      {
        cutoutId: 'cutoutC3',
        cutoutFixtureId: MAGNETIC_BLOCK_V1_FIXTURE,
      },
      {
        cutoutId: 'cutoutD3',
        cutoutFixtureId: FLEX_STACKER_V1_FIXTURE,
        opentronsModuleSerialNumber: 'flex-2',
      },
    ])
  })
  it('should patch deck config with combination fixture if mag block is configured and staging area is required', () => {
    const result = patchDeckConfigForRequiredFixture(
      startingDeckConfig,
      'cutoutC3',
      STAGING_AREA_RIGHT_SLOT_FIXTURE
    )
    expect(result).toEqual([
      { cutoutId: 'cutoutA1', cutoutFixtureId: THERMOCYCLER_V2_REAR_FIXTURE },
      { cutoutId: 'cutoutB1', cutoutFixtureId: THERMOCYCLER_V2_REAR_FIXTURE },
      {
        cutoutId: 'cutoutA3',
        cutoutFixtureId: STAGING_AREA_RIGHT_SLOT_FIXTURE,
      },
      {
        cutoutId: 'cutoutB3',
        cutoutFixtureId: FLEX_STACKER_V1_FIXTURE,
        opentronsModuleSerialNumber: 'flex-1',
      },
      {
        cutoutId: 'cutoutC1',
        cutoutFixtureId: HEATERSHAKER_MODULE_V1_FIXTURE,
        opentronsModuleSerialNumber: 'hs-1',
      },
      {
        cutoutId: 'cutoutC3',
        cutoutFixtureId: STAGING_AREA_SLOT_WITH_MAGNETIC_BLOCK_V1_FIXTURE,
      },
      {
        cutoutId: 'cutoutD3',
        cutoutFixtureId: FLEX_STACKER_V1_FIXTURE,
        opentronsModuleSerialNumber: 'flex-2',
      },
    ])
  })
  it('should patch deck config with combination fixture if stacker is configured and waste chute combo fixture is required', () => {
    const result = patchDeckConfigForRequiredFixture(
      startingDeckConfig,
      'cutoutD3',
      FLEX_STACKER_WTIH_WASTE_CHUTE_ADAPTER_NO_COVER_FIXTURE
    )
    expect(result).toEqual([
      { cutoutId: 'cutoutA1', cutoutFixtureId: THERMOCYCLER_V2_REAR_FIXTURE },
      { cutoutId: 'cutoutB1', cutoutFixtureId: THERMOCYCLER_V2_REAR_FIXTURE },
      {
        cutoutId: 'cutoutA3',
        cutoutFixtureId: STAGING_AREA_RIGHT_SLOT_FIXTURE,
      },
      {
        cutoutId: 'cutoutB3',
        cutoutFixtureId: FLEX_STACKER_V1_FIXTURE,
        opentronsModuleSerialNumber: 'flex-1',
      },
      {
        cutoutId: 'cutoutC1',
        cutoutFixtureId: HEATERSHAKER_MODULE_V1_FIXTURE,
        opentronsModuleSerialNumber: 'hs-1',
      },

      {
        cutoutId: 'cutoutC3',
        cutoutFixtureId: MAGNETIC_BLOCK_V1_FIXTURE,
      },
      {
        cutoutId: 'cutoutD3',
        cutoutFixtureId: FLEX_STACKER_WTIH_WASTE_CHUTE_ADAPTER_NO_COVER_FIXTURE,
        opentronsModuleSerialNumber: 'flex-2',
      },
    ])
  })
  it('should patch deck config with combination fixture if stacker is configured and waste chute combo fixture is required', () => {
    const result = patchDeckConfigForRequiredFixture(
      startingDeckConfig,
      'cutoutD3',
      FLEX_STACKER_WTIH_WASTE_CHUTE_ADAPTER_NO_COVER_FIXTURE
    )
    expect(result).toEqual([
      { cutoutId: 'cutoutA1', cutoutFixtureId: THERMOCYCLER_V2_REAR_FIXTURE },
      { cutoutId: 'cutoutB1', cutoutFixtureId: THERMOCYCLER_V2_REAR_FIXTURE },
      {
        cutoutId: 'cutoutA3',
        cutoutFixtureId: STAGING_AREA_RIGHT_SLOT_FIXTURE,
      },
      {
        cutoutId: 'cutoutB3',
        cutoutFixtureId: FLEX_STACKER_V1_FIXTURE,
        opentronsModuleSerialNumber: 'flex-1',
      },
      {
        cutoutId: 'cutoutC1',
        cutoutFixtureId: HEATERSHAKER_MODULE_V1_FIXTURE,
        opentronsModuleSerialNumber: 'hs-1',
      },

      {
        cutoutId: 'cutoutC3',
        cutoutFixtureId: MAGNETIC_BLOCK_V1_FIXTURE,
      },
      {
        cutoutId: 'cutoutD3',
        cutoutFixtureId: FLEX_STACKER_WTIH_WASTE_CHUTE_ADAPTER_NO_COVER_FIXTURE,
        opentronsModuleSerialNumber: 'flex-2',
      },
    ])
  })
  it('should patch deck config with combination fixture if stacker is configured and mag block fixture is required', () => {
    const result = patchDeckConfigForRequiredFixture(
      startingDeckConfig,
      'cutoutB3',
      MAGNETIC_BLOCK_V1_FIXTURE
    )
    expect(result).toEqual([
      { cutoutId: 'cutoutA1', cutoutFixtureId: THERMOCYCLER_V2_REAR_FIXTURE },
      { cutoutId: 'cutoutB1', cutoutFixtureId: THERMOCYCLER_V2_REAR_FIXTURE },
      {
        cutoutId: 'cutoutA3',
        cutoutFixtureId: STAGING_AREA_RIGHT_SLOT_FIXTURE,
      },
      {
        cutoutId: 'cutoutB3',
        cutoutFixtureId: FLEX_STACKER_WITH_MAG_BLOCK_FIXTURE,
        opentronsModuleSerialNumber: 'flex-1',
      },
      {
        cutoutId: 'cutoutC1',
        cutoutFixtureId: HEATERSHAKER_MODULE_V1_FIXTURE,
        opentronsModuleSerialNumber: 'hs-1',
      },

      {
        cutoutId: 'cutoutC3',
        cutoutFixtureId: MAGNETIC_BLOCK_V1_FIXTURE,
      },
      {
        cutoutId: 'cutoutD3',
        cutoutFixtureId: FLEX_STACKER_V1_FIXTURE,
        opentronsModuleSerialNumber: 'flex-2',
      },
    ])
  })
  it('should remove both thermocycler fixtures if a one of them is replaced', () => {
    const result = patchDeckConfigForRequiredFixture(
      startingDeckConfig,
      'cutoutA1',
      MAGNETIC_BLOCK_V1_FIXTURE
    )
    expect(result).toEqual([
      {
        cutoutId: 'cutoutA1',
        cutoutFixtureId: MAGNETIC_BLOCK_V1_FIXTURE,
        opentronsModuleSerialNumber: undefined,
      },
      {
        cutoutId: 'cutoutB1',
        cutoutFixtureId: SINGLE_LEFT_SLOT_FIXTURE,
        opentronsModuleSerialNumber: undefined,
      },
      {
        cutoutId: 'cutoutA3',
        cutoutFixtureId: STAGING_AREA_RIGHT_SLOT_FIXTURE,
      },
      {
        cutoutId: 'cutoutB3',
        cutoutFixtureId: FLEX_STACKER_V1_FIXTURE,
        opentronsModuleSerialNumber: 'flex-1',
      },
      {
        cutoutId: 'cutoutC1',
        cutoutFixtureId: HEATERSHAKER_MODULE_V1_FIXTURE,
        opentronsModuleSerialNumber: 'hs-1',
      },
      {
        cutoutId: 'cutoutC3',
        cutoutFixtureId: MAGNETIC_BLOCK_V1_FIXTURE,
      },
      {
        cutoutId: 'cutoutD3',
        cutoutFixtureId: FLEX_STACKER_V1_FIXTURE,
        opentronsModuleSerialNumber: 'flex-2',
      },
    ])
  })
  it('should replace the current fixture with the required fixtire and remove module in any other case', () => {
    const result = patchDeckConfigForRequiredFixture(
      startingDeckConfig,
      'cutoutC1',
      MAGNETIC_BLOCK_V1_FIXTURE
    )
    expect(result).toEqual([
      { cutoutId: 'cutoutA1', cutoutFixtureId: THERMOCYCLER_V2_REAR_FIXTURE },
      { cutoutId: 'cutoutB1', cutoutFixtureId: THERMOCYCLER_V2_REAR_FIXTURE },
      {
        cutoutId: 'cutoutA3',
        cutoutFixtureId: STAGING_AREA_RIGHT_SLOT_FIXTURE,
      },
      {
        cutoutId: 'cutoutB3',
        cutoutFixtureId: FLEX_STACKER_V1_FIXTURE,
        opentronsModuleSerialNumber: 'flex-1',
      },
      {
        cutoutId: 'cutoutC1',
        cutoutFixtureId: MAGNETIC_BLOCK_V1_FIXTURE,
        opentronsModuleSerialNumber: undefined,
      },
      {
        cutoutId: 'cutoutC3',
        cutoutFixtureId: MAGNETIC_BLOCK_V1_FIXTURE,
      },
      {
        cutoutId: 'cutoutD3',
        cutoutFixtureId: FLEX_STACKER_V1_FIXTURE,
        opentronsModuleSerialNumber: 'flex-2',
      },
    ])
  })
})
