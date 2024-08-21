import { it, describe, expect } from 'vitest'
import {
  FLEX_ROBOT_TYPE,
  HEATERSHAKER_MODULE_TYPE,
  HEATERSHAKER_MODULE_V1,
  TEMPERATURE_MODULE_TYPE,
  TEMPERATURE_MODULE_V2,
  THERMOCYCLER_MODULE_TYPE,
  THERMOCYCLER_MODULE_V2,
} from '@opentrons/shared-data'
import { getNumSlotsAvailable, getTrashSlot } from '../utils'

import type { AdditionalEquipment, WizardFormState } from '../types'
import type { FormPipettesByMount } from '../../../step-forms'

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
} as WizardFormState

describe('getNumSlotsAvailable', () => {
  it('should return 8 when there are no modules or additional equipment', () => {
    const result = getNumSlotsAvailable(null, [])
    expect(result).toBe(8)
  })
  it('should return 0 when there is a TC and 7 modules', () => {
    const mockModules = {
      0: {
        model: HEATERSHAKER_MODULE_V1,
        type: HEATERSHAKER_MODULE_TYPE,
        slot: 'D1',
      },
      1: {
        model: TEMPERATURE_MODULE_V2,
        type: TEMPERATURE_MODULE_TYPE,
        slot: 'D3',
      },
      2: {
        model: TEMPERATURE_MODULE_V2,
        type: TEMPERATURE_MODULE_TYPE,
        slot: 'C1',
      },
      3: {
        model: TEMPERATURE_MODULE_V2,
        type: TEMPERATURE_MODULE_TYPE,
        slot: 'B3',
      },
      4: {
        model: THERMOCYCLER_MODULE_V2,
        type: THERMOCYCLER_MODULE_TYPE,
        slot: 'B1',
      },
      5: {
        model: TEMPERATURE_MODULE_V2,
        type: TEMPERATURE_MODULE_TYPE,

        slot: 'A3',
      },
      6: {
        model: TEMPERATURE_MODULE_V2,
        type: TEMPERATURE_MODULE_TYPE,
        slot: 'C3',
      },
    } as any
    const result = getNumSlotsAvailable(mockModules, [])
    expect(result).toBe(0)
  })
  it('should return 1 when there are 9 additional equipment and 1 is a waste chute on the staging area and one is a gripper', () => {
    const mockAdditionalEquipment: AdditionalEquipment[] = [
      'trashBin',
      'stagingArea',
      'stagingArea',
      'stagingArea',
      'stagingArea',
      'wasteChute',
      'trashBin',
      'gripper',
      'trashBin',
    ]
    const result = getNumSlotsAvailable(null, mockAdditionalEquipment)
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
    expect(result).toBe('cutoutA3')
  })
  it('should return cutoutA1 when there is a staging area in slot A3', () => {
    MOCK_FORM_STATE = {
      ...MOCK_FORM_STATE,
      additionalEquipment: ['stagingArea'],
    }
    const result = getTrashSlot(MOCK_FORM_STATE)
    expect(result).toBe('cutoutA1')
  })
})
