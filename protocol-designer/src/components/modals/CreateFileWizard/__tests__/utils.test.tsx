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
  getNumSlotsAvailable,
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
    const result = getUnoccupiedStagingAreaSlots(null, [])
    expect(result).toStrictEqual(STANDARD_EMPTY_SLOTS)
  })
  it('should return one staging area slot when there are only 1 num slots available', () => {
    const result = getUnoccupiedStagingAreaSlots(
      {
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
      },
      []
    )
    expect(result).toStrictEqual([
      { cutoutId: 'cutoutA3', cutoutFixtureId: SINGLE_RIGHT_SLOT_FIXTURE },
    ])
  })
})
describe('getNumSlotsAvailable', () => {
  it('should return 8 when there are no modules or additional equipment', () => {
    const result = getNumSlotsAvailable(null, [])
    expect(result).toBe(8)
  })
  it('should return 0 when there is a TC and 7 modules', () => {
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
    const result = getNumSlotsAvailable(mockModules, [])
    expect(result).toBe(0)
  })
  it('should return 1 when there are 9 additional equipment and 1 is a waste chute on the staging area and one is a gripper', () => {
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
    const result = getNumSlotsAvailable(null, mockAdditionalEquipment)
    expect(result).toBe(1)
  })
  it('shoult return 1 when it is for the waste chute and all slots are occupied with the staging area in slot d3', () => {
    const mockAdditionalEquipment: AdditionalEquipment[] = [
      'trashBin',
      'trashBin',
      'stagingArea_cutoutA3',
      'stagingArea_cutoutB3',
      'stagingArea_cutoutC3',
      'stagingArea_cutoutD3',
      'trashBin',
      'gripper',
      'trashBin',
    ]
    const result = getNumSlotsAvailable(null, mockAdditionalEquipment, true)
    expect(result).toBe(1)
  })
  it('should return 8 even when there is a magnetic block', () => {
    const mockModules = {
      0: {
        model: 'magneticBlockV1',
        type: 'magneticBlockType',
        slot: 'B2',
      },
    } as any
    const result = getNumSlotsAvailable(mockModules, [])
    expect(result).toBe(8)
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
