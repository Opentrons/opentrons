import { describe, expect, it } from 'vitest'

import { moveLabwareOffDeckCommands } from '../labware'

import type { OffsetLocationDetails } from '/app/redux/protocol-runs'

describe('labware commands', () => {
  describe('moveLabwareOffDeckCommands', () => {
    const LABWARE_URI_1 = 'opentrons/labware-1'
    const LABWARE_URI_2 = 'opentrons/labware-2'
    const LABWARE_ID_1 = 'labware-123'
    const LABWARE_ID_2 = 'labware-456'
    const MODULE_ID_1 = 'module-123'
    const MODULE_MODEL_1 = 'thermocycler'

    it('should return empty array when no labware components exist', () => {
      const mockOffsetLocationDetails = {
        lwModOnlyStackupDetails: [
          {
            kind: 'module',
            moduleModel: MODULE_MODEL_1,
            id: MODULE_ID_1,
          },
        ],
      } as any

      const result = moveLabwareOffDeckCommands(mockOffsetLocationDetails)

      expect(result).toEqual([])
    })

    it('should return move commands for labware components only', () => {
      const mockOffsetLocationDetails = {
        lwModOnlyStackupDetails: [
          {
            kind: 'module',
            moduleModel: MODULE_MODEL_1,
            id: MODULE_ID_1,
          },
          {
            kind: 'labware',
            labwareUri: LABWARE_URI_1,
            id: LABWARE_ID_1,
          },
        ],
      } as OffsetLocationDetails

      const result = moveLabwareOffDeckCommands(mockOffsetLocationDetails)

      expect(result).toEqual([
        {
          commandType: 'moveLabware',
          params: {
            labwareId: LABWARE_ID_1,
            newLocation: 'offDeck',
            strategy: 'manualMoveWithoutPause',
          },
        },
      ])
    })

    it('should return move commands for multiple labware components in reverse order', () => {
      const mockOffsetLocationDetails = {
        lwModOnlyStackupDetails: [
          {
            kind: 'module',
            moduleModel: MODULE_MODEL_1,
            id: MODULE_ID_1,
          },
          {
            kind: 'labware',
            labwareUri: LABWARE_URI_1,
            id: LABWARE_ID_1,
          },
          {
            kind: 'labware',
            labwareUri: LABWARE_URI_2,
            id: LABWARE_ID_2,
          },
        ],
      } as OffsetLocationDetails

      const result = moveLabwareOffDeckCommands(mockOffsetLocationDetails)

      expect(result).toEqual([
        {
          commandType: 'moveLabware',
          params: {
            labwareId: LABWARE_ID_2,
            newLocation: 'offDeck',
            strategy: 'manualMoveWithoutPause',
          },
        },
        {
          commandType: 'moveLabware',
          params: {
            labwareId: LABWARE_ID_1,
            newLocation: 'offDeck',
            strategy: 'manualMoveWithoutPause',
          },
        },
      ])
    })

    it('should handle mixed labware and module components in the stackup', () => {
      const mockOffsetLocationDetails = {
        lwModOnlyStackupDetails: [
          {
            kind: 'module',
            moduleModel: MODULE_MODEL_1,
            id: MODULE_ID_1,
          },
          {
            kind: 'labware',
            labwareUri: LABWARE_URI_1,
            id: LABWARE_ID_1,
          },
          {
            kind: 'module',
            moduleModel: 'magdeck',
            id: 'module-456',
          },
          {
            kind: 'labware',
            labwareUri: LABWARE_URI_2,
            id: LABWARE_ID_2,
          },
        ],
      } as OffsetLocationDetails

      const result = moveLabwareOffDeckCommands(mockOffsetLocationDetails)

      expect(result).toEqual([
        {
          commandType: 'moveLabware',
          params: {
            labwareId: LABWARE_ID_2,
            newLocation: 'offDeck',
            strategy: 'manualMoveWithoutPause',
          },
        },
        {
          commandType: 'moveLabware',
          params: {
            labwareId: LABWARE_ID_1,
            newLocation: 'offDeck',
            strategy: 'manualMoveWithoutPause',
          },
        },
      ])
    })

    it('should handle empty stackup details', () => {
      const mockOffsetLocationDetails = {
        lwModOnlyStackupDetails: [],
      } as any

      const result = moveLabwareOffDeckCommands(mockOffsetLocationDetails)

      expect(result).toEqual([])
    })
  })
})
