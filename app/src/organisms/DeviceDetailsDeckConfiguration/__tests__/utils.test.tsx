import { describe, expect, it } from 'vitest'

import {
  DEFAULT_AA_FOR_WASTE_CHUTE,
  FLEX_STACKER_MODULE_TYPE,
  FLEX_STACKER_MODULE_V1,
  getDeckDefFromRobotType,
  HEATERSHAKER_MODULE_TYPE,
  HEATERSHAKER_MODULE_V1,
  MAGNETIC_BLOCK_V1_FIXTURE,
  THERMOCYCLER_MODULE_TYPE,
  THERMOCYCLER_MODULE_V2,
  WASTE_CHUTE_RIGHT_ADAPTER_COVERED_FIXTURE,
  WASTE_CHUTE_RIGHT_ADAPTER_NO_COVER_FIXTURE,
} from '@opentrons/shared-data'

import {
  getFixtureOptions,
  getModuleOptions,
  getModuleUnconfiguredFixtures,
  getThermoUnconfiguredFixtures,
  getWasteChuteOptions,
} from '../utils'

import type { AttachedModule } from '@opentrons/api-client'

const deckDef = getDeckDefFromRobotType('OT-3 Standard')

describe('getModuleOptions', () => {
  const attachedModules = [
    {
      moduleModel: FLEX_STACKER_MODULE_V1,
      moduleType: FLEX_STACKER_MODULE_TYPE,
      serialNumber: 'flex-1',
      id: 'flex-1',
    },
    {
      moduleModel: FLEX_STACKER_MODULE_V1,
      moduleType: FLEX_STACKER_MODULE_TYPE,
      serialNumber: 'flex-2',
      id: 'flex-2',
    },
    {
      moduleModel: HEATERSHAKER_MODULE_V1,
      moduleType: HEATERSHAKER_MODULE_TYPE,
      serialNumber: 'heater-1',
      id: 'heater-1',
    },
  ] as AttachedModule[]
  it('should get mag block and heater shaker to place on AA A3', () => {
    const result = getModuleOptions('cutoutA3', attachedModules, 'A3', deckDef)
    expect(result).toEqual([
      [
        {
          cutoutId: 'cutoutA3',
          cutoutFixtureId: MAGNETIC_BLOCK_V1_FIXTURE,
          addressableAreaId: 'magneticBlockV1A3',
        },
      ],
      [
        {
          cutoutId: 'cutoutA3',
          cutoutFixtureId: HEATERSHAKER_MODULE_V1,
          addressableAreaId: 'heaterShakerV1A3',
          opentronsModuleSerialNumber: 'heater-1',
        },
      ],
    ])
  })
  it('should get mag block to place on AA A3', () => {
    const result = getModuleOptions('cutoutA3', [], 'A3', deckDef)
    expect(result).toEqual([
      [
        {
          cutoutId: 'cutoutA3',
          cutoutFixtureId: MAGNETIC_BLOCK_V1_FIXTURE,
          addressableAreaId: 'magneticBlockV1A3',
        },
      ],
    ])
  })
})

describe('getModuleUnconfiguredFixtures', () => {
  const attachedModules = [
    {
      moduleModel: FLEX_STACKER_MODULE_V1,
      moduleType: FLEX_STACKER_MODULE_TYPE,
      serialNumber: 'flex-1',
      id: 'flex-1',
    },
    {
      moduleModel: FLEX_STACKER_MODULE_V1,
      moduleType: FLEX_STACKER_MODULE_TYPE,
      serialNumber: 'flex-2',
      id: 'flex-2',
    },
    {
      moduleModel: HEATERSHAKER_MODULE_V1,
      moduleType: HEATERSHAKER_MODULE_TYPE,
      serialNumber: 'heater-1',
      id: 'heater-1',
    },
  ] as AttachedModule[]
  it('should return a list of fixtures for Flex Stacker', () => {
    const result = getModuleUnconfiguredFixtures(
      attachedModules,
      'cutoutB3',
      FLEX_STACKER_MODULE_V1,
      'fakeB4',
      deckDef
    )
    expect(result).toEqual([
      [
        {
          cutoutId: 'cutoutB3',
          addressableAreaId: 'flexStackerModuleV1B4',
          cutoutFixtureId: 'flexStackerModuleV1',
          opentronsModuleSerialNumber: 'flex-1',
        },
      ],
      [
        {
          cutoutId: 'cutoutB3',
          addressableAreaId: 'flexStackerModuleV1B4',
          cutoutFixtureId: 'flexStackerModuleV1',
          opentronsModuleSerialNumber: 'flex-2',
        },
      ],
    ])
  })

  it('should return a list of fixtures for Heater shaker', () => {
    const result = getModuleUnconfiguredFixtures(
      attachedModules,
      'cutoutD1',
      HEATERSHAKER_MODULE_V1,
      'D1',
      deckDef
    )
    expect(result).toEqual([
      [
        {
          cutoutId: 'cutoutD1',
          addressableAreaId: 'heaterShakerV1D1',
          cutoutFixtureId: 'heaterShakerModuleV1',
          opentronsModuleSerialNumber: 'heater-1',
        },
      ],
    ])
  })
})

describe('getThermoUnconfiguredFixtures', () => {
  const attachedModules = [
    {
      moduleModel: FLEX_STACKER_MODULE_V1,
      moduleType: FLEX_STACKER_MODULE_TYPE,
      serialNumber: 'flex-1',
      id: 'flex-1',
    },
    {
      moduleModel: THERMOCYCLER_MODULE_V2,
      moduleType: THERMOCYCLER_MODULE_TYPE,
      serialNumber: 'thermo-2',
      id: 'thermo-2',
    },
    {
      moduleModel: HEATERSHAKER_MODULE_V1,
      moduleType: HEATERSHAKER_MODULE_TYPE,
      serialNumber: 'heater-1',
      id: 'heater-1',
    },
  ] as AttachedModule[]
  it('Should return a fixture list for thermo', () => {
    const result = getThermoUnconfiguredFixtures(attachedModules, 'cutoutA1')
    expect(result).toEqual([
      [
        {
          cutoutId: 'cutoutA1',
          addressableAreaId: 'thermocyclerModuleV2',
          cutoutFixtureId: 'thermocyclerModuleV2Rear',
          opentronsModuleSerialNumber: 'thermo-2',
        },
        {
          cutoutId: 'cutoutB1',
          addressableAreaId: 'thermocyclerModuleV2',
          cutoutFixtureId: 'thermocyclerModuleV2Front',
          opentronsModuleSerialNumber: 'thermo-2',
        },
      ],
    ])
  })

  it('Should return empty array for a cutout id that does not fit the thermo', () => {
    const result = getThermoUnconfiguredFixtures(attachedModules, 'cutoutA2')
    expect(result).toEqual([])
  })
})

describe('getFixtureOptions', () => {
  it('Should get a trash bin for cutoutD3 and aa D3', () => {
    const result = getFixtureOptions('cutoutD3', 'D3')
    expect(result).toEqual([
      [
        {
          cutoutId: 'cutoutD3',
          cutoutFixtureId: 'trashBinAdapter',
          addressableAreaId: 'movableTrashD3',
        },
      ],
    ])
  })
  it('Should not get a trash bin for cutoutD3 and aa D3 with a stacker in the slot', () => {
    const result = getFixtureOptions('cutoutD3', 'D3', FLEX_STACKER_MODULE_V1)
    expect(result).toEqual([])
  })
  it('Should get staging area for cutoutD3 and aa fakeD4', () => {
    const result = getFixtureOptions('cutoutD3', 'fakeD4')
    expect(result).toEqual([
      [
        {
          cutoutId: 'cutoutD3',
          cutoutFixtureId: 'stagingAreaRightSlot',
          addressableAreaId: 'D4',
        },
      ],
    ])
  })
  it('Should get an empty list for cutoutA2 and aa A2', () => {
    const result = getFixtureOptions('cutoutA2', 'A2')
    expect(result).toEqual([])
  })
})

describe('getWasteChuteOptions', () => {
  it('should get an empty list if not fits a waste chute fixture', () => {
    const result = getWasteChuteOptions('cutoutA1')
    expect(result).toEqual([])
  })
  it('should get a a waste chute fixture', () => {
    const result = getWasteChuteOptions('cutoutD3')
    expect(result).toEqual([
      [
        {
          cutoutId: 'cutoutD3',
          cutoutFixtureId: WASTE_CHUTE_RIGHT_ADAPTER_NO_COVER_FIXTURE,
          addressableAreaId: DEFAULT_AA_FOR_WASTE_CHUTE,
        },
      ],
      [
        {
          cutoutId: 'cutoutD3',
          cutoutFixtureId: WASTE_CHUTE_RIGHT_ADAPTER_COVERED_FIXTURE,
          addressableAreaId: DEFAULT_AA_FOR_WASTE_CHUTE,
        },
      ],
    ])
  })
})
