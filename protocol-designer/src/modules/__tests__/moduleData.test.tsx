import { describe, it, expect } from 'vitest'
import { getNextAvailableModuleSlot } from '../moduleData'
import type { InitialDeckSetup } from '../../step-forms'

describe('getNextAvailableModuleSlot', () => {
  it('renders slot D1 when no slots are occupied', () => {
    const mockInitialDeckSetup: InitialDeckSetup = {
      modules: {},
      labware: {},
      pipettes: {},
      additionalEquipmentOnDeck: {},
    }
    const result = getNextAvailableModuleSlot(mockInitialDeckSetup)
    expect(result).toBe('D1')
  })
  it('renders slot C1 when other slots are occupied', () => {
    const mockInitialDeckSetup: InitialDeckSetup = {
      modules: {},
      labware: {},
      pipettes: {},
      additionalEquipmentOnDeck: {
        wasteChuteId: {
          name: 'wasteChute',
          id: 'wasteChuteId',
          location: 'D3',
        },
        trashBinId: {
          name: 'trashBin',
          id: 'trashBinId',
          location: 'D1',
        },
      },
    }
    const result = getNextAvailableModuleSlot(mockInitialDeckSetup)
    expect(result).toBe('C1')
  })
})
