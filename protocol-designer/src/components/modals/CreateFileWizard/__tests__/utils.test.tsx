import {
  FLEX_ROBOT_TYPE,
  HEATERSHAKER_MODULE_TYPE,
  TEMPERATURE_MODULE_TYPE,
  THERMOCYCLER_MODULE_TYPE,
} from '@opentrons/shared-data'
import { it, describe, expect } from 'vitest'
import {
  FLEX_TRASH_DEFAULT_SLOT,
  getLastCheckedEquipment,
  getTrashSlot,
} from '../utils'
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

describe('getLastCheckedEquipment', () => {
  it('should return null when there is no trash bin', () => {
    const result = getLastCheckedEquipment({
      additionalEquipment: [],
      moduleTypesOnDeck: [],
    })
    expect(result).toBe(null)
  })
  it('should return null if not all the modules or staging areas are selected', () => {
    const LastCheckedProps = {
      additionalEquipment: [
        'trashBin',
        'stagingArea_cutoutD3',
      ] as AdditionalEquipment[],
      moduleTypesOnDeck: [THERMOCYCLER_MODULE_TYPE],
    }
    const result = getLastCheckedEquipment(LastCheckedProps)
    expect(result).toBe(null)
  })
  it('should return temperature module if other modules and staging areas are selected', () => {
    const LastCheckedProps = {
      additionalEquipment: [
        'trashBin',
        'stagingArea_cutoutA3',
        'stagingArea_cutoutB3',
        'stagingArea_cutoutC3',
        'stagingArea_cutoutD3',
      ] as AdditionalEquipment[],
      moduleTypesOnDeck: [THERMOCYCLER_MODULE_TYPE, HEATERSHAKER_MODULE_TYPE],
    }
    const result = getLastCheckedEquipment(LastCheckedProps)
    expect(result).toBe(TEMPERATURE_MODULE_TYPE)
  })
})

describe('getTrashSlot', () => {
  it('should return the default slot A3 when there is no staging area in that slot', () => {
    MOCK_FORM_STATE = {
      ...MOCK_FORM_STATE,
      additionalEquipment: ['trashBin'],
    }
    const result = getTrashSlot(MOCK_FORM_STATE)
    expect(result).toBe(FLEX_TRASH_DEFAULT_SLOT)
  })
  it('should return cutoutB3 when there is a staging area in slot A3', () => {
    MOCK_FORM_STATE = {
      ...MOCK_FORM_STATE,
      additionalEquipment: ['stagingArea_cutoutA3'],
    }
    const result = getTrashSlot(MOCK_FORM_STATE)
    expect(result).toBe('cutoutA1')
  })
})
