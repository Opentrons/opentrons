import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  ALL,
  COLUMN,
  fixture384Plate,
  fixture96Plate,
  fixtureP10MultiV2Specs,
  fixtureP10SingleV2Specs,
  fixtureP100096V2Specs,
  fixtureTiprack1000ul,
  getLabwareDefURI,
  ROW,
} from '@opentrons/shared-data'
import { getIsSafePipetteMovement } from '@opentrons/step-generation'

import { getAllWellsSafetyStatus } from '../getAllWellsSafetyStatus'

import type { LabwareDefinition } from '@opentrons/shared-data'

vi.mock('@opentrons/step-generation', () => ({
  getIsSafePipetteMovement: vi.fn(),
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

  describe('8-channel ALL on 384-well plate (staggered columns)', () => {
    const firstColumn = fixture384Plate.ordering[0]
    const secondColumn = fixture384Plate.ordering[1]

    const mockInvariant384 = {
      pipetteEntities: {
        [pipetteId]: {
          name: 'p10_multi',
          id: pipetteId,
          tiprackDefURI: [
            getLabwareDefURI(fixtureTiprack1000ul as LabwareDefinition),
          ],
          tiprackLabwareDef: [fixtureTiprack1000ul],
          spec: fixtureP10MultiV2Specs,
          pythonName: 'mock_pipette_p10_multi',
        },
      },
      labwareEntities: {
        [labwareId]: {
          id: labwareId,
          pythonName: 'mock_384_plate',
          labwareDefURI: getLabwareDefURI(fixture384Plate as LabwareDefinition),
          def: fixture384Plate,
        },
      },
    } as any

    it('evaluates even and odd stagger rows separately per column', () => {
      ;(getIsSafePipetteMovement as any).mockImplementation(
        (args: { wellTargetName: string }) => {
          if (args.wellTargetName === firstColumn[0]) return true
          if (args.wellTargetName === firstColumn[1]) return false
          if (args.wellTargetName === secondColumn[0]) return false
          if (args.wellTargetName === secondColumn[1]) return true
          return true
        }
      )

      const allWells384 = [firstColumn, secondColumn]

      const result = getAllWellsSafetyStatus({
        allWells: allWells384,
        robotState: mockRobotState,
        invariantContext: mockInvariant384,
        pipetteId,
        labwareId,
        primaryNozzle,
        nozzleConfiguration: ALL,
      })

      firstColumn.forEach((wellName, rowIdx) => {
        expect(result[wellName]).toBe(rowIdx % 2 === 0 ? 0 : 1)
      })
      secondColumn.forEach((wellName, rowIdx) => {
        expect(result[wellName]).toBe(rowIdx % 2 === 0 ? 1 : 0)
      })

      expect(getIsSafePipetteMovement).toHaveBeenCalledTimes(4)
    })
  })

  describe('1-channel ALL on 384-well plate (staggered columns)', () => {
    const firstColumn = fixture384Plate.ordering[0]
    const secondColumn = fixture384Plate.ordering[1]

    const mockInvariant384Single = {
      pipetteEntities: {
        [pipetteId]: {
          name: 'p10_single',
          id: pipetteId,
          tiprackDefURI: [
            getLabwareDefURI(fixtureTiprack1000ul as LabwareDefinition),
          ],
          tiprackLabwareDef: [fixtureTiprack1000ul],
          spec: fixtureP10SingleV2Specs,
          pythonName: 'mock_pipette_p10_single',
        },
      },
      labwareEntities: {
        [labwareId]: {
          id: labwareId,
          pythonName: 'mock_384_plate',
          labwareDefURI: getLabwareDefURI(fixture384Plate as LabwareDefinition),
          def: fixture384Plate,
        },
      },
    } as any

    it('evaluates even and odd stagger rows separately per column', () => {
      ;(getIsSafePipetteMovement as any).mockImplementation(
        (args: { wellTargetName: string }) => {
          if (args.wellTargetName === firstColumn[0]) return true
          if (args.wellTargetName === firstColumn[1]) return false
          if (args.wellTargetName === secondColumn[0]) return false
          if (args.wellTargetName === secondColumn[1]) return true
          return true
        }
      )

      const allWells384 = [firstColumn, secondColumn]

      const result = getAllWellsSafetyStatus({
        allWells: allWells384,
        robotState: mockRobotState,
        invariantContext: mockInvariant384Single,
        pipetteId,
        labwareId,
        primaryNozzle,
        nozzleConfiguration: ALL,
      })

      firstColumn.forEach((wellName, rowIdx) => {
        expect(result[wellName]).toBe(rowIdx % 2 === 0 ? 0 : 1)
      })
      secondColumn.forEach((wellName, rowIdx) => {
        expect(result[wellName]).toBe(rowIdx % 2 === 0 ? 1 : 0)
      })

      expect(getIsSafePipetteMovement).toHaveBeenCalledTimes(4)
    })
  })
})
