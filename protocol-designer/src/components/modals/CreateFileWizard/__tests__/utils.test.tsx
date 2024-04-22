import { it, describe, expect } from 'vitest'
import {
  FLEX_ROBOT_TYPE,
  SINGLE_RIGHT_SLOT_FIXTURE,
} from '@opentrons/shared-data'
import {
  FLEX_TRASH_DEFAULT_SLOT,
  getUnoccupiedStagingAreaSlots,
  getTrashSlot,
  getTrashOptionDisabled,
  getIsSlotAvailable,
} from '../utils'
import { STANDARD_EMPTY_SLOTS } from '../StagingAreaTile'
import type { FormPipettesByMount } from '../../../../step-forms'
import type { AdditionalEquipment, FormState } from '../types'

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
})
describe('getIsSlotAvailable', () => {
  it('should return true when there are no modules or additional equipment', () => {
    const result = getIsSlotAvailable(null, [])
    expect(result).toBe(true)
  })
  it('should return false when there is a TC and 7 modules', () => {
    const mockModules = {
      0: {
        model: 'heaterShakerModuleV1',
        type: 'heaterShakerModuleType',
        slot: 'D1',
      },
      1: {
        model: 'temperatureModuleV2',
        type: 'temperatureModuleType',
        slot: 'D3',
      },
      2: {
        model: 'temperatureModuleV2',
        type: 'temperatureModuleType',
        slot: 'C1',
      },
      3: {
        model: 'temperatureModuleV2',
        type: 'temperatureModuleType',
        slot: 'B3',
      },
      4: {
        model: 'thermocyclerModuleV2',
        type: 'thermocyclerModuleType',
        slot: 'B1',
      },
      5: {
        model: 'temperatureModuleV2',
        type: 'temperatureModuleType',
        slot: 'A3',
      },
      6: {
        model: 'temperatureModuleV2',
        type: 'temperatureModuleType',
        slot: 'C3',
      },
    } as any
    const result = getIsSlotAvailable(mockModules, [])
    expect(result).toBe(false)
  })
  it('should return true when there are 9 additional equipment and 1 is a waste chute on the staging area and one is a gripper', () => {
    const mockAdditionalEquipment: AdditionalEquipment[] = [
      'trashBin',
      'stagingArea_cutoutA3',
      'stagingArea_cutoutB3',
      'stagingArea_cutoutC3',
      'stagingArea_cutoutD3',
      'wasteChute',
      'trashBin',
      'gripper',
      'trashBin',
    ]
    const result = getIsSlotAvailable(null, mockAdditionalEquipment)
    expect(result).toBe(true)
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
})
describe('getTrashOptionDisabled', () => {
  it('returns false when there is a trash bin already', () => {
    const result = getTrashOptionDisabled({
      trashType: 'trashBin',
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
    const result = getTrashOptionDisabled({
      trashType: 'trashBin',
      additionalEquipment: ['trashBin'],
      modules: null,
    })
    expect(result).toBe(false)
  })
  it('returns true when there is no available slot and trash bin is not selected yet', () => {
    const result = getTrashOptionDisabled({
      trashType: 'trashBin',
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
