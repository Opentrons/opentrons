import { describe, expect, it } from 'vitest'

import {
  FLEX_STACKER_V1_FIXTURE,
  FLEX_STACKER_WITH_MAG_BLOCK_FIXTURE,
  FLEX_STACKER_WITH_WASTE_CHUTE_ADAPTER_NO_COVER_FIXTURE,
  MAGNETIC_BLOCK_V1_FIXTURE,
  STAGING_AREA_RIGHT_SLOT_FIXTURE,
  STAGING_AREA_SLOT_WITH_MAGNETIC_BLOCK_V1_FIXTURE,
  TEMPERATURE_MODULE_V2_FIXTURE,
  TRASH_BIN_ADAPTER_FIXTURE,
  WASTE_CHUTE_RIGHT_ADAPTER_NO_COVER_FIXTURE,
} from '@opentrons/shared-data'

import { mergeToComboFixtures } from '../utils'

import type {
  CutoutConfigMap,
  CutoutFixtureId,
  DeckConfiguration,
} from '@opentrons/shared-data'

describe('mergeToComboFixtures', () => {
  it('should return empty arrays when no configs provided', () => {
    const result = mergeToComboFixtures([], [])

    expect(result.comboFixtures).toEqual([])
    expect(result.remainingModuleConfig).toEqual([])
    expect(result.remainingAdditionalEquipmentConfig).toEqual([])
  })

  it('should not create combo when module has no matching fixture at same cutoutId', () => {
    const moduleConfig: CutoutConfigMap[] = [
      {
        cutoutId: 'cutoutD3',
        cutoutFixtureId: FLEX_STACKER_V1_FIXTURE,
        addressableAreaId: 'flexStackerModuleV1D4',
      },
    ]
    const additionalEquipmentConfig: DeckConfiguration = [
      {
        cutoutId: 'cutoutA3',
        cutoutFixtureId: TRASH_BIN_ADAPTER_FIXTURE,
      },
    ]

    const result = mergeToComboFixtures(moduleConfig, additionalEquipmentConfig)

    expect(result.comboFixtures).toEqual([])
    expect(result.remainingModuleConfig).toEqual(moduleConfig)
    expect(result.remainingAdditionalEquipmentConfig).toEqual(
      additionalEquipmentConfig
    )
  })

  it('should merge flex stacker and magnetic block into combo fixture', () => {
    const moduleConfig: CutoutConfigMap[] = [
      {
        cutoutId: 'cutoutD3',
        cutoutFixtureId: FLEX_STACKER_V1_FIXTURE,
        addressableAreaId: 'flexStackerModuleV1D4',
      },
      {
        cutoutId: 'cutoutD3',
        cutoutFixtureId: MAGNETIC_BLOCK_V1_FIXTURE,
        addressableAreaId: 'magneticBlockV1D3',
      },
    ]
    const additionalEquipmentConfig: DeckConfiguration = []

    const result = mergeToComboFixtures(moduleConfig, additionalEquipmentConfig)

    expect(result.comboFixtures).toHaveLength(1)
    expect(result.comboFixtures[0].cutoutFixtureId).toEqual(
      FLEX_STACKER_WITH_MAG_BLOCK_FIXTURE
    )
    expect(result.comboFixtures[0].cutoutId).toEqual('cutoutD3')
    expect(result.remainingModuleConfig).toEqual([])
    expect(result.remainingAdditionalEquipmentConfig).toEqual([])
  })

  it('should merge module and fixture at same cutoutId into combo fixture', () => {
    const moduleConfig: CutoutConfigMap[] = [
      {
        cutoutId: 'cutoutD3',
        cutoutFixtureId: FLEX_STACKER_V1_FIXTURE,
        addressableAreaId: 'flexStackerModuleV1D4',
      },
    ]
    const additionalEquipmentConfig: DeckConfiguration = [
      {
        cutoutId: 'cutoutD3',
        cutoutFixtureId: WASTE_CHUTE_RIGHT_ADAPTER_NO_COVER_FIXTURE,
      },
    ]

    const result = mergeToComboFixtures(moduleConfig, additionalEquipmentConfig)

    expect(result.comboFixtures).toHaveLength(1)
    expect(result.comboFixtures[0].cutoutFixtureId).toEqual(
      FLEX_STACKER_WITH_WASTE_CHUTE_ADAPTER_NO_COVER_FIXTURE
    )
    expect(result.comboFixtures[0].cutoutId).toEqual('cutoutD3')
    expect(result.remainingModuleConfig).toEqual([])
    expect(result.remainingAdditionalEquipmentConfig).toEqual([])
  })

  it('should keep unmerged modules and fixtures separate', () => {
    const moduleConfig: CutoutConfigMap[] = [
      {
        cutoutId: 'cutoutD3',
        cutoutFixtureId: FLEX_STACKER_V1_FIXTURE,
        addressableAreaId: 'flexStackerModuleV1D4',
      },
      {
        cutoutId: 'cutoutC1',
        cutoutFixtureId: TEMPERATURE_MODULE_V2_FIXTURE,
        addressableAreaId: 'temperatureModuleV2C1',
      },
    ]
    const additionalEquipmentConfig: DeckConfiguration = [
      {
        cutoutId: 'cutoutD3',
        cutoutFixtureId: MAGNETIC_BLOCK_V1_FIXTURE,
      },
      {
        cutoutId: 'cutoutA3',
        cutoutFixtureId: TRASH_BIN_ADAPTER_FIXTURE,
      },
    ]

    const result = mergeToComboFixtures(moduleConfig, additionalEquipmentConfig)

    // D3 should be merged into combo
    expect(result.comboFixtures).toHaveLength(1)
    expect(result.comboFixtures[0].cutoutId).toEqual('cutoutD3')

    // Temperature module at C1 should remain
    expect(result.remainingModuleConfig).toHaveLength(1)
    expect(result.remainingModuleConfig[0].cutoutId).toEqual('cutoutC1')

    // Trash bin at A3 should remain
    expect(result.remainingAdditionalEquipmentConfig).toHaveLength(1)
    expect(result.remainingAdditionalEquipmentConfig[0].cutoutId).toEqual(
      'cutoutA3'
    )
  })

  it('should not merge if there is no additional equipment at the same cutoutId', () => {
    const moduleConfig: CutoutConfigMap[] = [
      {
        cutoutId: 'cutoutD3',
        cutoutFixtureId: FLEX_STACKER_V1_FIXTURE,
        addressableAreaId: 'flexStackerModuleV1D4',
      },
    ]
    const additionalEquipmentConfig: DeckConfiguration = []

    const result = mergeToComboFixtures(moduleConfig, additionalEquipmentConfig)

    expect(result.comboFixtures).toEqual([])
    expect(result.remainingModuleConfig).toEqual(moduleConfig)
    expect(result.remainingAdditionalEquipmentConfig).toEqual([])
  })

  it('should not merge when no combo fixture exists for the combination', () => {
    const moduleConfig: CutoutConfigMap[] = [
      {
        cutoutId: 'cutoutD3',
        cutoutFixtureId: TEMPERATURE_MODULE_V2_FIXTURE,
        addressableAreaId: 'temperatureModuleV2D3',
      },
    ]
    const additionalEquipmentConfig: DeckConfiguration = [
      {
        cutoutId: 'cutoutD3',
        cutoutFixtureId: STAGING_AREA_RIGHT_SLOT_FIXTURE,
      },
    ]

    const result = mergeToComboFixtures(moduleConfig, additionalEquipmentConfig)

    // No combo exists for temp module + staging area
    expect(result.comboFixtures).toEqual([])
    expect(result.remainingModuleConfig).toEqual(moduleConfig)
    expect(result.remainingAdditionalEquipmentConfig).toEqual(
      additionalEquipmentConfig
    )
  })

  it('should not create combo when duplicate modules with same fixtureId exist at same cutoutId', () => {
    const moduleConfig: CutoutConfigMap[] = [
      {
        cutoutId: 'cutoutD3',
        cutoutFixtureId: FLEX_STACKER_V1_FIXTURE,
        addressableAreaId: 'D4',
      },
      {
        cutoutId: 'cutoutD3',
        cutoutFixtureId: FLEX_STACKER_V1_FIXTURE,
        addressableAreaId: 'D4',
      },
    ]
    const additionalEquipmentConfig: DeckConfiguration = [
      {
        cutoutId: 'cutoutA3',
        cutoutFixtureId: TRASH_BIN_ADAPTER_FIXTURE,
      },
    ]

    const result = mergeToComboFixtures(moduleConfig, additionalEquipmentConfig)

    // No combo exists for two of the same fixtures
    expect(result.comboFixtures).toEqual([])
    // Both duplicate modules should remain (they weren't merged)
    expect(result.remainingModuleConfig).toEqual(moduleConfig)
    expect(result.remainingAdditionalEquipmentConfig).toEqual(
      additionalEquipmentConfig
    )
  })
})
