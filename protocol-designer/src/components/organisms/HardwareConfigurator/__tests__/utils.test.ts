import { describe, expect, it } from 'vitest'

import {
  FLEX_ROBOT_TYPE,
  FLEX_STACKER_V1_FIXTURE,
  FLEX_STACKER_WITH_MAG_BLOCK_FIXTURE,
  FLEX_STACKER_WITH_WASTE_CHUTE_ADAPTER_NO_COVER_FIXTURE,
  getDeckDefFromRobotType,
  MAGNETIC_BLOCK_V1_FIXTURE,
  STAGING_AREA_RIGHT_SLOT_FIXTURE,
  STAGING_AREA_SLOT_WITH_WASTE_CHUTE_RIGHT_ADAPTER_NO_COVER_FIXTURE,
  TEMPERATURE_MODULE_V2_FIXTURE,
  TRASH_BIN_ADAPTER_FIXTURE,
  VACUUM_MODULE_V1,
  WASTE_CHUTE_RIGHT_ADAPTER_NO_COVER_FIXTURE,
} from '@opentrons/shared-data'

import { getModuleOptions, mergeToComboFixtures } from '../utils'

import type { CutoutConfigMap, DeckConfiguration } from '@opentrons/shared-data'
import type { FormModules } from '/protocol-designer/step-forms'

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

  it('should merge equipment for staging area and waste chute at the same cutoutId', () => {
    const moduleConfig: CutoutConfigMap[] = []
    const additionalEquipmentConfig: DeckConfiguration = [
      {
        cutoutId: 'cutoutD3',
        cutoutFixtureId: STAGING_AREA_RIGHT_SLOT_FIXTURE,
      },
      {
        cutoutId: 'cutoutD3',
        cutoutFixtureId: WASTE_CHUTE_RIGHT_ADAPTER_NO_COVER_FIXTURE,
      },
    ]
    const result = mergeToComboFixtures(moduleConfig, additionalEquipmentConfig)

    expect(result.comboFixtures).toHaveLength(1)
    expect(result.comboFixtures[0].cutoutFixtureId).toEqual(
      STAGING_AREA_SLOT_WITH_WASTE_CHUTE_RIGHT_ADAPTER_NO_COVER_FIXTURE
    )
    expect(result.comboFixtures[0].cutoutId).toEqual('cutoutD3')
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
})

describe('getModuleOptions vacuum module gripper collisions', () => {
  const deckDef = getDeckDefFromRobotType(FLEX_ROBOT_TYPE)
  const vacuumOnA3: FormModules = {
    1: {
      model: VACUUM_MODULE_V1,
      type: 'vacuumModuleType',
      slot: 'A3',
      cutoutFixtureId: VACUUM_MODULE_V1,
      cutoutId: 'cutoutA3',
    },
  }
  const heaterShakerOnB3: FormModules = {
    1: {
      model: 'heaterShakerModuleV1',
      type: 'heaterShakerModuleType',
      slot: 'B3',
      cutoutFixtureId: 'heaterShakerModuleV1',
      cutoutId: 'cutoutB3',
    },
  }

  it('offers no modules on B3 when a vacuum module is on A3', () => {
    expect(getModuleOptions('cutoutB3', 'B3', deckDef, {}, vacuumOnA3)).toEqual(
      []
    )
  })

  it('still offers modules on C3 when a vacuum module is on A3', () => {
    expect(
      getModuleOptions('cutoutC3', 'C3', deckDef, {}, vacuumOnA3).length
    ).toBeGreaterThan(0)
  })

  it('does not change staging slot B4 module options when a vacuum module is on A3', () => {
    const stagingOnB3 = {
      staging: {
        name: 'stagingArea' as const,
        cutoutId: 'cutoutB3' as const,
        cutoutFixtureId: 'stagingAreaRightSlot' as const,
      },
    }
    expect(
      getModuleOptions('cutoutB3', 'B4', deckDef, stagingOnB3, vacuumOnA3)
    ).toEqual(getModuleOptions('cutoutB3', 'B4', deckDef, stagingOnB3, {}))
  })

  it('does not offer the vacuum module on A3 when B3 already has a module', () => {
    const options = getModuleOptions(
      'cutoutA3',
      'A3',
      deckDef,
      {},
      heaterShakerOnB3
    )
    expect(
      options.some(option =>
        option.some(config => config.cutoutFixtureId === VACUUM_MODULE_V1)
      )
    ).toBe(false)
    expect(options.length).toBeGreaterThan(0)
  })

  it('offers the vacuum module on A3 when the neighboring slot is empty', () => {
    const options = getModuleOptions('cutoutA3', 'A3', deckDef, {}, {})
    expect(
      options.some(option =>
        option.some(config => config.cutoutFixtureId === VACUUM_MODULE_V1)
      )
    ).toBe(true)
  })
})
