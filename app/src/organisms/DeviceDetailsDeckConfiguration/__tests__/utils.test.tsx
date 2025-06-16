import { describe, expect, it } from 'vitest'

import {
  FLEX_STACKER_MODULE_TYPE,
  FLEX_STACKER_MODULE_V1,
  HEATERSHAKER_MODULE_TYPE,
  HEATERSHAKER_MODULE_V1,
  THERMOCYCLER_MODULE_TYPE,
  THERMOCYCLER_MODULE_V2,
} from '@opentrons/shared-data'

import {
  getModuleUnconfiguredFixtures,
  getThermoUnconfiguredFixtures,
} from '../utils'

import type { AttachedModule } from '@opentrons/api-client'

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
      'fakeB4'
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
      'D1'
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
