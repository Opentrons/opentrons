import { it, describe, expect } from 'vitest'
import {
  FLEX_ROBOT_TYPE,
  HEATERSHAKER_MODULE_TYPE,
  SINGLE_RIGHT_SLOT_FIXTURE,
  TEMPERATURE_MODULE_TYPE,
  THERMOCYCLER_MODULE_TYPE,
} from '@opentrons/shared-data'
import {
  FLEX_TRASH_DEFAULT_SLOT,
  getUnoccupiedStagingAreaSlots,
  getTrashSlot,
  getNextAvailableModuleSlot,
  getDisabledEquipment,
  getTrashBinOptionDisabled,
} from '../utils'
import { STANDARD_EMPTY_SLOTS } from '../StagingAreaTile'
import type { FormPipettesByMount } from '../../../../step-forms'
import type { FormState } from '../types'

let MOCK_FORM_STATE = {
  fields: {
    name: 'mockName',
    description: 'mockDescription',
    organizationOrAuthor: 'mockOrganizationOrAuthor',
    robotType: FLEX_ROBOT_TYPE,
  },
  pipettesByMount: {
    left: { pipetteName: 'mockPipetteName', tiprackDefURI: ['mocktip'] },
    right: { pipetteName: null, tiprackDefURI: null },
  } as FormPipettesByMount,
  modules: {},
  additionalEquipment: [],
} as FormState

describe('getUnoccupiedStagingAreaSlots', () => {
  it('should return all staging area slots when there are no modules', () => {
    const result = getUnoccupiedStagingAreaSlots(null)
    expect(result).toStrictEqual(STANDARD_EMPTY_SLOTS)
  })
  it('should return one staging area slot when there are modules in the way of the other slots', () => {
    const result = getUnoccupiedStagingAreaSlots({
      0: { model: 'magneticBlockV1', type: 'magneticBlockType', slot: 'A3' },
      1: {
        model: 'temperatureModuleV2',
        type: 'temperatureModuleType',
        slot: 'B3',
      },
      2: {
        model: 'temperatureModuleV2',
        type: 'temperatureModuleType',
        slot: 'C3',
      },
    })
    expect(result).toStrictEqual([
      { cutoutId: 'cutoutD3', cutoutFixtureId: SINGLE_RIGHT_SLOT_FIXTURE },
    ])
  })
  describe('getNextAvailableModuleSlot', () => {
    it('should return D1 when there are no modules or staging areas', () => {
      const result = getNextAvailableModuleSlot(null, [])
      expect(result).toStrictEqual('D1')
    })
    it('should return a C3 when all the modules are on the deck', () => {
      const result = getNextAvailableModuleSlot(
        {
          0: {
            model: 'magneticBlockV1',
            type: 'magneticBlockType',
            slot: 'D1',
          },
          1: {
            model: 'thermocyclerModuleV2',
            type: 'thermocyclerModuleType',
            slot: 'B1',
          },
          2: {
            model: 'temperatureModuleV2',
            type: 'temperatureModuleType',
            slot: 'C1',
          },
        },
        []
      )
      expect(result).toStrictEqual('C3')
    })
  })
  it('should return an empty string when all the modules and staging area slots are on the deck without TC', () => {
    const result = getNextAvailableModuleSlot(
      {
        0: {
          model: 'heaterShakerModuleV1',
          type: 'heaterShakerModuleType',
          slot: 'D1',
        },
        1: {
          model: 'temperatureModuleV2',
          type: 'temperatureModuleType',
          slot: 'C1',
        },
        2: {
          model: 'temperatureModuleV2',
          type: 'temperatureModuleType',
          slot: 'B1',
        },
      },
      [
        'stagingArea_cutoutA3',
        'stagingArea_cutoutB3',
        'stagingArea_cutoutC3',
        'stagingArea_cutoutD3',
        'trashBin',
      ]
    )
    expect(result).toStrictEqual('')
  })
  it('should return an empty string when all the modules and staging area slots are on the deck with TC', () => {
    const result = getNextAvailableModuleSlot(
      {
        0: {
          model: 'heaterShakerModuleV1',
          type: 'heaterShakerModuleType',
          slot: 'D1',
        },
        1: {
          model: 'thermocyclerModuleV2',
          type: 'thermocyclerModuleType',
          slot: 'B1',
        },
      },
      [
        'stagingArea_cutoutA3',
        'stagingArea_cutoutB3',
        'stagingArea_cutoutC3',
        'stagingArea_cutoutD3',
        'trashBin',
      ]
    )
    expect(result).toStrictEqual('')
  })
})
describe('getNextAvailableModuleSlot', () => {
  it('should return nothing as disabled', () => {
    const result = getDisabledEquipment({
      additionalEquipment: [],
      modules: null,
    })
    expect(result).toStrictEqual([])
  })
  it('should return the TC as disabled', () => {
    const result = getDisabledEquipment({
      additionalEquipment: [],
      modules: {
        0: {
          model: 'heaterShakerModuleV1',
          type: 'heaterShakerModuleType',
          slot: 'A1',
        },
      },
    })
    expect(result).toStrictEqual([THERMOCYCLER_MODULE_TYPE])
  })
  it('should return all module types if there is no available slot', () => {
    const result = getDisabledEquipment({
      additionalEquipment: [
        'stagingArea_cutoutA3',
        'stagingArea_cutoutB3',
        'stagingArea_cutoutC3',
        'stagingArea_cutoutD3',
        'trashBin',
      ],
      modules: {
        0: {
          model: 'heaterShakerModuleV1',
          type: 'heaterShakerModuleType',
          slot: 'D1',
        },
        1: {
          model: 'temperatureModuleV2',
          type: 'temperatureModuleType',
          slot: 'C1',
        },
        2: {
          model: 'temperatureModuleV2',
          type: 'temperatureModuleType',
          slot: 'B1',
        },
      },
    })
    expect(result).toStrictEqual([
      THERMOCYCLER_MODULE_TYPE,
      TEMPERATURE_MODULE_TYPE,
      HEATERSHAKER_MODULE_TYPE,
    ])
  })
})
describe('getTrashSlot', () => {
  it('should return the default slot A3 when there is no staging area or module in that slot', () => {
    MOCK_FORM_STATE = {
      ...MOCK_FORM_STATE,
      additionalEquipment: ['trashBin'],
    }
    const result = getTrashSlot(MOCK_FORM_STATE)
    expect(result).toBe(FLEX_TRASH_DEFAULT_SLOT)
  })
  it('should return cutoutA1 when there is a staging area in slot A3', () => {
    MOCK_FORM_STATE = {
      ...MOCK_FORM_STATE,
      additionalEquipment: ['stagingArea_cutoutA3'],
    }
    const result = getTrashSlot(MOCK_FORM_STATE)
    expect(result).toBe('cutoutA1')
  })
  describe('getTrashBinOptionDisabled', () => {
    it('returns false when there is a trash bin already', () => {
      const result = getTrashBinOptionDisabled({
        additionalEquipment: ['trashBin'],
        modules: {
          0: {
            model: 'heaterShakerModuleV1',
            type: 'heaterShakerModuleType',
            slot: 'D1',
          },
        },
      })
      expect(result).toBe(false)
    })
    it('returns false when there is an available slot', () => {
      const result = getTrashBinOptionDisabled({
        additionalEquipment: ['trashBin'],
        modules: null,
      })
      expect(result).toBe(false)
    })
    it('returns true when there is no available slot and trash bin is not selected yet', () => {
      const result = getTrashBinOptionDisabled({
        additionalEquipment: [
          'stagingArea_cutoutA3',
          'stagingArea_cutoutB3',
          'stagingArea_cutoutC3',
          'stagingArea_cutoutD3',
        ],
        modules: {
          0: {
            model: 'heaterShakerModuleV1',
            type: 'heaterShakerModuleType',
            slot: 'D1',
          },
          1: {
            model: 'temperatureModuleV2',
            type: 'temperatureModuleType',
            slot: 'C1',
          },
          2: {
            model: 'temperatureModuleV2',
            type: 'temperatureModuleType',
            slot: 'B1',
          },
          3: {
            model: 'temperatureModuleV2',
            type: 'temperatureModuleType',
            slot: 'A1',
          },
        },
      })
      expect(result).toBe(true)
    })
  })
})
