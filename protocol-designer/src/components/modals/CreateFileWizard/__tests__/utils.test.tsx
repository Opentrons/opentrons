import {
  FLEX_ROBOT_TYPE,
  TEMPERATURE_MODULE_TYPE,
} from '@opentrons/shared-data'
import {
  FLEX_TRASH_DEFAULT_SLOT,
  getLastCheckedEquipment,
  getTrashSlot,
} from '../utils'
import type {
  FormModulesByType,
  FormPipettesByMount,
} from '../../../../step-forms'
import type { FormState } from '../types'

let MOCK_FORM_STATE = {
  fields: {
    name: 'mockName',
    description: 'mockDescription',
    organizationOrAuthor: 'mockOrganizationOrAuthor',
    robotType: FLEX_ROBOT_TYPE,
  },
  pipettesByMount: {
    left: { pipetteName: 'mockPipetteName', tiprackDefURI: 'mocktip' },
    right: { pipetteName: null, tiprackDefURI: null },
  } as FormPipettesByMount,
  modulesByType: {
    heaterShakerModuleType: { onDeck: false, model: null, slot: 'D1' },
    magneticBlockType: { onDeck: false, model: null, slot: 'D2' },
    temperatureModuleType: { onDeck: false, model: null, slot: 'C1' },
    thermocyclerModuleType: { onDeck: false, model: null, slot: 'B1' },
  } as FormModulesByType,
  additionalEquipment: [],
} as FormState

describe('getLastCheckedEquipment', () => {
  it('should return null when there is no trash bin', () => {
    const result = getLastCheckedEquipment(MOCK_FORM_STATE)
    expect(result).toBe(null)
  })
  it('should return null if not all the modules or staging areas are selected', () => {
    MOCK_FORM_STATE = {
      ...MOCK_FORM_STATE,
      additionalEquipment: ['trashBin'],
      modulesByType: {
        ...MOCK_FORM_STATE.modulesByType,
        temperatureModuleType: { onDeck: true, model: null, slot: 'C1' },
      },
    }
    const result = getLastCheckedEquipment(MOCK_FORM_STATE)
    expect(result).toBe(null)
  })
  it('should return temperature module if other modules and staging areas are selected', () => {
    MOCK_FORM_STATE = {
      ...MOCK_FORM_STATE,
      additionalEquipment: [
        'trashBin',
        'stagingArea_cutoutA3',
        'stagingArea_cutoutB3',
        'stagingArea_cutoutC3',
        'stagingArea_cutoutD3',
      ],
      modulesByType: {
        ...MOCK_FORM_STATE.modulesByType,
        heaterShakerModuleType: { onDeck: true, model: null, slot: 'D1' },
        thermocyclerModuleType: { onDeck: true, model: null, slot: 'B1' },
      },
    }
    const result = getLastCheckedEquipment(MOCK_FORM_STATE)
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
  it('should return B3 when there is a staging area in slot A3', () => {
    MOCK_FORM_STATE = {
      ...MOCK_FORM_STATE,
      additionalEquipment: ['stagingArea_cutoutA3'],
    }
    const result = getTrashSlot(MOCK_FORM_STATE)
    expect(result).toBe('B3')
  })
})
