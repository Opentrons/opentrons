import { describe, expect, it } from 'vitest'

import {
  fixtureTiprack300ul as _fixtureTiprack300ul,
  ALL,
  COLUMN,
  SINGLE,
} from '@opentrons/shared-data'

import { CLEAN, EMPTY } from '../../constants'
import { getIsSafePickupWithinTiprack } from '../safePipetteMovements'

import type { LabwareDefinition } from '@opentrons/shared-data'
import type { TipState } from '../../types'

const tiprackDefinition = _fixtureTiprack300ul as LabwareDefinition

const tiprackWells = Object.keys(tiprackDefinition.wells)

// tiprack state helper
const mockTipState = (occupiedWells: string[]): Record<string, TipState> => {
  return tiprackWells.reduce<Record<string, TipState>>((acc, well) => {
    acc[well] = occupiedWells.includes(well) ? CLEAN : EMPTY
    return acc
  }, {})
}

describe('getIsSafePickupWithinTiprack', () => {
  describe('Single channel pipettes (channels === 1)', () => {
    it('should always return true for single channel pipettes', () => {
      const args = {
        tipState: mockTipState(['A1']),
        primaryNozzle: 'A1',
        channels: 1,
        nozzleConfiguration: SINGLE,
        wellName: 'A1',
        tiprackDef: tiprackDefinition,
        tipsToIgnore: [],
      } as any
      expect(getIsSafePickupWithinTiprack(args)).toBe(true)
    })

    it('should return true even with occupied wells for single channel', () => {
      const args = {
        tipState: mockTipState(['B1', 'C1', 'D1']),
        primaryNozzle: 'A1',
        channels: 1,
        nozzleConfiguration: SINGLE,
        wellName: 'A1',
        tiprackDef: tiprackDefinition,
        tipsToIgnore: [],
      } as any
      expect(getIsSafePickupWithinTiprack(args)).toBe(true)
    })
  })

  describe('8-channel pipettes with SINGLE nozzle configuration', () => {
    it('should return true when all wells in column are empty', () => {
      const args = {
        tipState: mockTipState([]),
        primaryNozzle: 'A1',
        channels: 8,
        nozzleConfiguration: SINGLE,
        wellName: 'A1',
        tiprackDef: tiprackDefinition,
        tipsToIgnore: [],
      } as any
      expect(getIsSafePickupWithinTiprack(args)).toBe(true)
    })

    it('should return true when wells after target are empty (A1 primary nozzle)', () => {
      const args = {
        tipState: mockTipState(['A1']),
        primaryNozzle: 'A1',
        channels: 8,
        nozzleConfiguration: SINGLE,
        wellName: 'A1',
        tiprackDef: tiprackDefinition,
        tipsToIgnore: [],
      } as any
      expect(getIsSafePickupWithinTiprack(args)).toBe(true)
    })

    it('should return false when wells after target are occupied (A1 primary nozzle)', () => {
      const args = {
        tipState: mockTipState(['B1', 'C1']),
        primaryNozzle: 'A1',
        channels: 8,
        nozzleConfiguration: SINGLE,
        wellName: 'A1',
        tiprackDef: tiprackDefinition,
        tipsToIgnore: [],
      } as any
      expect(getIsSafePickupWithinTiprack(args)).toBe(false)
    })

    it('should return true when wells after target are empty (H1 primary nozzle - reversed)', () => {
      const args = {
        tipState: mockTipState(['H1']),
        primaryNozzle: 'H1',
        channels: 8,
        nozzleConfiguration: SINGLE,
        wellName: 'A1',
        tiprackDef: tiprackDefinition,
        tipsToIgnore: [],
      } as any
      expect(getIsSafePickupWithinTiprack(args)).toBe(true)
    })

    it('should return false when wells after target are occupied (H1 primary nozzle - reversed)', () => {
      const args = {
        tipState: mockTipState(['G1', 'H1']),
        primaryNozzle: 'H1',
        channels: 8,
        nozzleConfiguration: SINGLE,
        wellName: 'G1',
        tiprackDef: tiprackDefinition,
        tipsToIgnore: [],
      } as any
      expect(getIsSafePickupWithinTiprack(args)).toBe(true)
    })

    it('should ignore wells in tipsToIgnore list', () => {
      const args = {
        tipState: mockTipState(['B1']),
        primaryNozzle: 'A1',
        channels: 8,
        nozzleConfiguration: SINGLE,
        wellName: 'A1',
        tiprackDef: tiprackDefinition,
        tipsToIgnore: ['B1'],
      } as any
      expect(getIsSafePickupWithinTiprack(args)).toBe(true)
    })

    it('should return true for 8-channel with non-SINGLE configuration', () => {
      const args = {
        tipState: mockTipState(['B1', 'C1']),
        primaryNozzle: 'A1',
        channels: 8,
        nozzleConfiguration: COLUMN,
        wellName: 'A1',
        tiprackDef: tiprackDefinition,
        tipsToIgnore: [],
      } as any
      expect(getIsSafePickupWithinTiprack(args)).toBe(true)
    })
  })

  describe('96-channel pipettes with ALL nozzle configuration', () => {
    it('should always return true for ALL configuration', () => {
      const args = {
        tipState: mockTipState(['A1', 'B1', 'C1']),
        primaryNozzle: 'A1',
        channels: 96,
        nozzleConfiguration: ALL,
        wellName: 'A1',
        tiprackDef: tiprackDefinition,
        tipsToIgnore: [],
      } as any
      expect(getIsSafePickupWithinTiprack(args)).toBe(true)
    })
  })

  describe('96-channel pipettes with COLUMN nozzle configuration', () => {
    it('should return true when all columns after target are empty', () => {
      const args = {
        tipState: mockTipState([]),
        primaryNozzle: 'A12',
        channels: 96,
        nozzleConfiguration: COLUMN,
        wellName: 'A1',
        tiprackDef: tiprackDefinition,
        tipsToIgnore: [],
      } as any
      expect(getIsSafePickupWithinTiprack(args)).toBe(true)
    })

    it('should return false when columns after target have occupied wells', () => {
      const args = {
        tipState: mockTipState(['A1']),
        primaryNozzle: 'A12',
        channels: 96,
        nozzleConfiguration: COLUMN,
        wellName: 'A2',
        tiprackDef: tiprackDefinition,
        tipsToIgnore: [],
      } as any
      expect(getIsSafePickupWithinTiprack(args)).toBe(false)
    })

    it('should return true when columns after target are empty (A12 primary nozzle)', () => {
      const args = {
        tipState: mockTipState(['A1']),
        primaryNozzle: 'A12',
        channels: 96,
        nozzleConfiguration: COLUMN,
        wellName: 'A1',
        tiprackDef: tiprackDefinition,
        tipsToIgnore: [],
      } as any
      expect(getIsSafePickupWithinTiprack(args)).toBe(true)
    })

    it('should return true when columns after target are empty (H12 primary nozzle - reversed)', () => {
      const args = {
        tipState: mockTipState(['A1']),
        primaryNozzle: 'H12',
        channels: 96,
        nozzleConfiguration: COLUMN,
        wellName: 'A12',
        tiprackDef: tiprackDefinition,
        tipsToIgnore: [],
      } as any
      expect(getIsSafePickupWithinTiprack(args)).toBe(true)
    })

    it('should ignore wells in tipsToIgnore list for COLUMN configuration', () => {
      const args = {
        tipState: mockTipState(['A2']),
        primaryNozzle: 'A12',
        channels: 96,
        nozzleConfiguration: COLUMN,
        wellName: 'A1',
        tiprackDef: tiprackDefinition,
        tipsToIgnore: ['A2'],
      } as any
      expect(getIsSafePickupWithinTiprack(args)).toBe(true)
    })
  })

  describe('96-channel pipettes with SINGLE nozzle configuration', () => {
    it('should return true when all wells in path are empty', () => {
      const args = {
        tipState: mockTipState([]),
        primaryNozzle: 'H12',
        channels: 96,
        nozzleConfiguration: SINGLE,
        wellName: 'A1',
        tiprackDef: tiprackDefinition,
        tipsToIgnore: [],
      } as any
      expect(getIsSafePickupWithinTiprack(args)).toBe(true)
    })

    it('should return false when wells in path are occupied', () => {
      const args = {
        tipState: mockTipState(['A1']),
        primaryNozzle: 'H12',
        channels: 96,
        nozzleConfiguration: SINGLE,
        wellName: 'B1',
        tiprackDef: tiprackDefinition,
        tipsToIgnore: [],
      } as any
      expect(getIsSafePickupWithinTiprack(args)).toBe(false)
    })

    it('should return true when target well is occupied but others are empty', () => {
      const args = {
        tipState: mockTipState(['A1']),
        primaryNozzle: 'H12',
        channels: 96,
        nozzleConfiguration: SINGLE,
        wellName: 'A1',
        tiprackDef: tiprackDefinition,
        tipsToIgnore: [],
      } as any
      expect(getIsSafePickupWithinTiprack(args)).toBe(true)
    })

    it('should handle H12 primary nozzle with row reversal', () => {
      const args = {
        tipState: mockTipState(['H1']),
        primaryNozzle: 'H12',
        channels: 96,
        nozzleConfiguration: SINGLE,
        wellName: 'A1',
        tiprackDef: tiprackDefinition,
        tipsToIgnore: [],
      } as any
      expect(getIsSafePickupWithinTiprack(args)).toBe(true)
    })

    it('should handle A12 primary nozzle with column reversal', () => {
      const args = {
        tipState: mockTipState(['A12']),
        primaryNozzle: 'A12',
        channels: 96,
        nozzleConfiguration: SINGLE,
        wellName: 'A1',
        tiprackDef: tiprackDefinition,
        tipsToIgnore: [],
      } as any
      expect(getIsSafePickupWithinTiprack(args)).toBe(true)
    })

    it('should ignore wells in tipsToIgnore list for SINGLE configuration', () => {
      const args = {
        tipState: mockTipState(['B1']),
        primaryNozzle: 'H12',
        channels: 96,
        nozzleConfiguration: SINGLE,
        wellName: 'A1',
        tiprackDef: tiprackDefinition,
        tipsToIgnore: ['B1'],
      } as any
      expect(getIsSafePickupWithinTiprack(args)).toBe(true)
    })

    it('should handle complex path with multiple occupied wells', () => {
      const args = {
        tipState: mockTipState(['B1', 'C1', 'D1']),
        primaryNozzle: 'H12',
        channels: 96,
        nozzleConfiguration: SINGLE,
        wellName: 'A1',
        tiprackDef: tiprackDefinition,
        tipsToIgnore: ['B1', 'C1'],
      } as any
      expect(getIsSafePickupWithinTiprack(args)).toBe(true)
    })
  })

  describe('Complex scenarios with different tiprack layouts', () => {
    it('should work with custom tiprack layout', () => {
      const customTiprackDef = {
        ordering: [
          ['A1', 'B1', 'C1'],
          ['A2', 'B2', 'C2'],
        ],
      }
      const args = {
        tipState: mockTipState(['B1']),
        primaryNozzle: 'A1',
        channels: 8,
        nozzleConfiguration: SINGLE,
        wellName: 'A1',
        tiprackDef: customTiprackDef,
        tipsToIgnore: [],
      } as any
      expect(getIsSafePickupWithinTiprack(args)).toBe(false)
    })

    it('should handle single column tiprack', () => {
      const singleColumnTiprackDef = {
        ordering: [['A1', 'B1', 'C1', 'D1', 'E1', 'F1', 'G1', 'H1']],
      }
      const args = {
        tipState: mockTipState(['B1']),
        primaryNozzle: 'A1',
        channels: 8,
        nozzleConfiguration: SINGLE,
        wellName: 'A1',
        tiprackDef: singleColumnTiprackDef,
        tipsToIgnore: [],
      } as any
      expect(getIsSafePickupWithinTiprack(args)).toBe(false)
    })
  })
})
