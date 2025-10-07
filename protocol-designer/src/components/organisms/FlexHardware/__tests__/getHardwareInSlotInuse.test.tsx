import { describe, expect, it } from 'vitest'

import { WASTE_CHUTE_CUTOUT } from '@opentrons/shared-data'

import { getHardwareInSlotInUse } from '../getHardwareInSlotInUse'

import type {
  LabwareOnDeck,
  ModuleOnDeck,
  SavedStepFormState,
} from '/protocol-designer/step-forms'

const mockSavedSteps: SavedStepFormState = {
  mockId: {
    moduleId: 'mockHeaterShakerId',
    id: 'mockId',
    stepType: 'heaterShaker',
  },
  mockId2: {
    labware: 'mockLabwareId',
    newLocation: 'mockHeaterShakerId',
    id: 'mockId2',
    stepType: 'moveLabware',
  },
  mockId3: {
    aspirate_labware: 'mockLabwareId',
    dispense_labware: 'mockLabwareId',
    dropTip_location: 'mockWasteChute',
    stepType: 'moveLiquid',
    id: 'mockId3',
  },
}
let mockLabware: LabwareOnDeck = {
  stack: ['mockLabwareId', 'A3'],
  id: 'mockLabwareId',
  pythonName: 'mockPythonName',
  labwareDefURI: 'mockURI',
  def: {} as any,
}
const mockModule: ModuleOnDeck = {
  slot: 'A3',
  type: 'heaterShakerModuleType',
  id: 'mockHeaterShakerId',
  model: 'heaterShakerModuleV1',
  pythonName: 'mockPythonName',
  moduleState: {} as any,
}
const mockFixtures = [
  {
    name: 'wasteChute',
    id: 'mockWasteChute',
    location: WASTE_CHUTE_CUTOUT,
  },
]
describe('getHardwareInSlotInUse', () => {
  it('returns true when there is a module in use', () => {
    expect(
      getHardwareInSlotInUse(mockSavedSteps, null, mockModule)
    ).toStrictEqual({
      moduleId: 'mockHeaterShakerId',
      fixtureIds: null,
      fourthColumnSlotLabwareId: null,
    })
  })

  it('returns true when there is a matchingLabwareFor4thColumn in use', () => {
    mockLabware = {
      ...mockLabware,
      stack: ['mockLabwareId', 'A4'],
    }
    expect(getHardwareInSlotInUse(mockSavedSteps, mockLabware)).toStrictEqual({
      moduleId: null,
      fixtureIds: null,
      fourthColumnSlotLabwareId: 'mockLabwareId',
    })
  })
  it('returns true when there is a fixture in use', () => {
    expect(
      getHardwareInSlotInUse(
        mockSavedSteps,
        null,
        undefined,
        mockFixtures as any
      )
    ).toStrictEqual({
      moduleId: null,
      fixtureIds: ['mockWasteChute'],
      fourthColumnSlotLabwareId: null,
    })
  })
  it('returns null when there are no steps use', () => {
    expect(
      getHardwareInSlotInUse({}, mockLabware, mockModule, mockFixtures as any)
    ).toStrictEqual({
      moduleId: null,
      fixtureIds: null,
      fourthColumnSlotLabwareId: null,
    })
  })
})
