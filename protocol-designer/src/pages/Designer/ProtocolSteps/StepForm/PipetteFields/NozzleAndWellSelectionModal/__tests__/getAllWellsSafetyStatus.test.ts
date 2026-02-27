import { beforeEach, describe, expect, it, vi } from 'vitest'

import { COLUMN, ROW } from '@opentrons/shared-data'
import { getIsSafePipetteMovement } from '@opentrons/step-generation'

import { getAllWellsSafetyStatus } from '../getAllWellsSafetyStatus'

vi.mock('@opentrons/step-generation', () => ({
  getIsSafePipetteMovement: vi.fn(),
}))

describe('getAllWellsSafetyStatus', () => {
  const mockInvariantContext = {} as any
  const mockRobotState = {} as any
  const pipetteId = 'pipette-id'
  const labwareId = 'labware-id'
  const primaryNozzle = 'A1' as any
  const singleNozzle = 'SINGLE' as any

  const allWells = [
    ['A1', 'B1', 'C1'], 
    ['A2', 'B2', 'C2'], 
  ]

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('ROW mode', () => {
    it('marks entire row safe when first well is safe', () => {
      ;(getIsSafePipetteMovement as any).mockReturnValue(true)

      const result = getAllWellsSafetyStatus({
        allWells,
        robotState: mockRobotState,
        invariantContext: mockInvariantContext,
        pipetteId,
        labwareId,
        primaryNozzle,
        nozzleConfiguration: ROW,
      })

      expect(result).toEqual({
        A1: 0,
        A2: 0,
        B1: 0,
        B2: 0,
        C1: 0,
        C2: 0,
      })

      // Should be called once per row (3 rows)
      expect(getIsSafePipetteMovement).toHaveBeenCalledTimes(3)
      expect(getIsSafePipetteMovement).toHaveBeenNthCalledWith(
        1,
        expect.objectContaining({ wellTargetName: 'A1' })
      )
    })

    it('marks entire row unsafe when first well is unsafe', () => {
      ;(getIsSafePipetteMovement as any)
        .mockReturnValueOnce(false) // row A
        .mockReturnValueOnce(true) // row B
        .mockReturnValueOnce(false) // row C

      const result = getAllWellsSafetyStatus({
        allWells,
        robotState: mockRobotState,
        invariantContext: mockInvariantContext,
        pipetteId,
        labwareId,
        primaryNozzle,
        nozzleConfiguration: ROW,
      })

      expect(result).toEqual({
        A1: 1,
        A2: 1,
        B1: 0,
        B2: 0,
        C1: 1,
        C2: 1,
      })
    })
  })

  describe('COLUMN mode', () => {
    it('marks entire column based on first well safety', () => {
      ;(getIsSafePipetteMovement as any)
        .mockReturnValueOnce(true) // column 1
        .mockReturnValueOnce(false) // column 2

      const result = getAllWellsSafetyStatus({
        allWells,
        robotState: mockRobotState,
        invariantContext: mockInvariantContext,
        pipetteId,
        labwareId,
        primaryNozzle,
        nozzleConfiguration: COLUMN,
      })

      expect(result).toEqual({
        A1: 0,
        B1: 0,
        C1: 0,
        A2: 1,
        B2: 1,
        C2: 1,
      })

      expect(getIsSafePipetteMovement).toHaveBeenCalledTimes(2)
      expect(getIsSafePipetteMovement).toHaveBeenNthCalledWith(
        1,
        expect.objectContaining({ wellTargetName: 'A1' })
      )
      expect(getIsSafePipetteMovement).toHaveBeenNthCalledWith(
        2,
        expect.objectContaining({ wellTargetName: 'A2' })
      )
    })
  })

  describe('SINGLE nozzle mode', () => {
    it('checks each well individually', () => {
      ;(getIsSafePipetteMovement as any)
        .mockReturnValueOnce(true)
        .mockReturnValueOnce(false)
        .mockReturnValueOnce(true)
        .mockReturnValueOnce(false)
        .mockReturnValueOnce(true)
        .mockReturnValueOnce(false)

      const result = getAllWellsSafetyStatus({
        allWells,
        robotState: mockRobotState,
        invariantContext: mockInvariantContext,
        pipetteId,
        labwareId,
        primaryNozzle,
        nozzleConfiguration: singleNozzle,
      })

      expect(result).toEqual({
        A1: 0,
        B1: 1,
        C1: 0,
        A2: 1,
        B2: 0,
        C2: 1,
      })

      expect(getIsSafePipetteMovement).toHaveBeenCalledTimes(6)
    })
  })
})
