import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  A1_NOZZLE,
  B1_NOZZLE,
  C1_NOZZLE,
  COLUMN,
  D1_NOZZLE,
  E1_NOZZLE,
  F1_NOZZLE,
  fixture96Plate,
  fixtureP100096V2Specs,
  fixtureTiprack1000ul,
  G1_NOZZLE,
  getLabwareDefURI,
  PARTIAL_COLUMN,
  ROW,
  SINGLE,
} from '@opentrons/shared-data'
import { getPipetteMovementSafetyStatus } from '@opentrons/step-generation'

import { getAllWellsSafetyStatus } from '../getAllWellsSafetyStatus'

import type { LabwareDefinition } from '@opentrons/shared-data'

vi.mock('@opentrons/step-generation', () => ({
  getPipetteMovementSafetyStatus: vi.fn(),
}))

describe('getAllWellsSafetyStatus', () => {
  const pipetteId = 'pipette-id'
  const labwareId = 'labware-id'

  const mockInvariantContext = {
    pipetteEntities: {
      [pipetteId]: {
        name: 'p1000_96',
        id: pipetteId,
        tiprackDefURI: [
          getLabwareDefURI(fixtureTiprack1000ul as LabwareDefinition),
        ],
        tiprackLabwareDef: [fixtureTiprack1000ul],
        spec: fixtureP100096V2Specs,
        pythonName: 'mock_pipette_p1000_96',
      },
    },
    labwareEntities: {
      [labwareId]: {
        id: labwareId,
        pythonName: 'mock_source_plate',
        labwareDefURI: getLabwareDefURI(fixture96Plate as LabwareDefinition),
        def: fixture96Plate,
      },
    },
  } as any
  const mockRobotState = {} as any
  const primaryNozzle = A1_NOZZLE
  const singleNozzle = SINGLE

  const allWells = [
    ['A1', 'B1', 'C1'],
    ['A2', 'B2', 'C2'],
  ]

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('ROW mode', () => {
    it('marks entire row safe when first well is safe', () => {
      ;(getPipetteMovementSafetyStatus as any).mockReturnValue({ isSafe: true })

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
      expect(getPipetteMovementSafetyStatus).toHaveBeenCalledTimes(3)
      expect(getPipetteMovementSafetyStatus).toHaveBeenNthCalledWith(
        1,
        expect.objectContaining({ wellTargetName: 'A1' })
      )
    })

    it('marks entire row unsafe when first well is unsafe', () => {
      ;(getPipetteMovementSafetyStatus as any)
        .mockReturnValueOnce({
          isSafe: false,
          reason: { type: 'outsidePipetteExtents' },
        }) // row A
        .mockReturnValueOnce({ isSafe: true }) // row B
        .mockReturnValueOnce({
          isSafe: false,
          reason: { type: 'outsidePipetteExtents' },
        }) // row C

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
      ;(getPipetteMovementSafetyStatus as any)
        .mockReturnValueOnce({ isSafe: true }) // column 1
        .mockReturnValueOnce({
          isSafe: false,
          reason: { type: 'outsidePipetteExtents' },
        }) // column 2

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

      expect(getPipetteMovementSafetyStatus).toHaveBeenCalledTimes(2)
      expect(getPipetteMovementSafetyStatus).toHaveBeenNthCalledWith(
        1,
        expect.objectContaining({ wellTargetName: 'A1' })
      )
      expect(getPipetteMovementSafetyStatus).toHaveBeenNthCalledWith(
        2,
        expect.objectContaining({ wellTargetName: 'A2' })
      )
    })
  })

  describe('SINGLE nozzle mode', () => {
    it('checks each well individually', () => {
      ;(getPipetteMovementSafetyStatus as any)
        .mockReturnValueOnce({ isSafe: true })
        .mockReturnValueOnce({
          isSafe: false,
          reason: { type: 'outsidePipetteExtents' },
        })
        .mockReturnValueOnce({ isSafe: true })
        .mockReturnValueOnce({
          isSafe: false,
          reason: { type: 'adjacentAdressableAreaCollision' },
          addressableAreaCausingCollision: 'A1',
        })
        .mockReturnValueOnce({ isSafe: true })
        .mockReturnValueOnce({
          isSafe: false,
          reason: { type: 'adjacentAdressableAreaCollision' },
          addressableAreaCausingCollision: 'A2',
        })

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

      expect(getPipetteMovementSafetyStatus).toHaveBeenCalledTimes(6)
    })
  })
  describe('PARTIAL COLUMN mode', () => {
    const column = ['A1', 'B1', 'C1', 'D1', 'E1', 'F1', 'G1', 'H1']

    const cases = [
      { nozzle: B1_NOZZLE, tipCount: 2 },
      { nozzle: C1_NOZZLE, tipCount: 3 },
      { nozzle: D1_NOZZLE, tipCount: 4 },
      { nozzle: E1_NOZZLE, tipCount: 5 },
      { nozzle: F1_NOZZLE, tipCount: 6 },
      { nozzle: G1_NOZZLE, tipCount: 7 },
    ]

    it.each(cases)(
      'handles partial column mode with $tipCount tips ($nozzle)',
      ({ nozzle, tipCount }) => {
        ;(getPipetteMovementSafetyStatus as any).mockReturnValue({
          isSafe: true,
        })

        const result = getAllWellsSafetyStatus({
          allWells: [column],
          robotState: mockRobotState,
          invariantContext: mockInvariantContext,
          pipetteId,
          labwareId,
          primaryNozzle: nozzle,
          nozzleConfiguration: PARTIAL_COLUMN,
        })

        // Assert correct block is marked safe
        for (let i = 0; i < tipCount; i++) {
          expect(result[column[i]]).toBe(0)
        }

        // Assert remaining wells are still present in output
        for (let i = tipCount; i < column.length; i++) {
          expect(result[column[i]]).toBeDefined()
        }
      }
    )
  })
})
