import { describe, expect, it, vi } from 'vitest'

import { fullHomeCommands } from '../gantry'
import {
  moveRelativeCommand,
  moveToMaintenancePosition,
  moveToWellCommands,
  retractPipetteAxesSequentiallyCommands,
  retractSafelyAndHomeCommands,
  savePositionCommands,
  verifyProbeAttachmentAndHomeCommands,
} from '../pipettes'

import type { LoadedPipette } from '@opentrons/shared-data'
import type { OffsetLocationDetails } from '/app/redux/protocol-runs'

vi.mock('../gantry', () => ({
  fullHomeCommands: vi.fn(() => [
    { commandType: 'home', params: { axes: 'all' } },
  ]),
}))

describe('pipette commands', () => {
  const PIPETTE_ID = 'pipette-123'
  const LEFT_MOUNT = 'left'
  const RIGHT_MOUNT = 'right'
  const LEFT_Z_AXIS = 'leftZ'
  const RIGHT_Z_AXIS = 'rightZ'
  const X_AXIS = 'x'
  const Y_AXIS = 'y'
  const LABWARE_ID = 'labware-456'
  const PROBE_LENGTH_MM = 44.5

  describe('savePositionCommands', () => {
    it('should return save position command with pipette id', () => {
      const result = savePositionCommands(PIPETTE_ID)

      expect(result).toEqual([
        { commandType: 'savePosition', params: { pipetteId: PIPETTE_ID } },
      ])
    })
  })

  describe('moveToWellCommands', () => {
    const mockOffsetLocationDetails = {
      labwareId: LABWARE_ID,
    } as OffsetLocationDetails

    it('should return move to well command with default offset when vectorOffset is not provided', () => {
      const result = moveToWellCommands(mockOffsetLocationDetails, PIPETTE_ID)

      expect(result).toEqual([
        {
          commandType: 'moveToWell',
          params: {
            pipetteId: PIPETTE_ID,
            labwareId: LABWARE_ID,
            wellName: 'A1',
            wellLocation: {
              origin: 'top',
              offset: { x: 0, y: 0, z: PROBE_LENGTH_MM },
            },
          },
        },
      ])
    })

    it('should return move to well command with adjusted offset when vectorOffset is provided', () => {
      const vectorOffset = { x: 1, y: 2, z: 3 }
      const result = moveToWellCommands(
        mockOffsetLocationDetails,
        PIPETTE_ID,
        vectorOffset
      )

      expect(result).toEqual([
        {
          commandType: 'moveToWell',
          params: {
            pipetteId: PIPETTE_ID,
            labwareId: LABWARE_ID,
            wellName: 'A1',
            wellLocation: {
              origin: 'top',
              offset: { x: 1, y: 2, z: 3 + PROBE_LENGTH_MM },
            },
          },
        },
      ])
    })

    it('should handle null vectorOffset', () => {
      const result = moveToWellCommands(
        mockOffsetLocationDetails,
        PIPETTE_ID,
        null
      )

      expect(result).toEqual([
        {
          commandType: 'moveToWell',
          params: {
            pipetteId: PIPETTE_ID,
            labwareId: LABWARE_ID,
            wellName: 'A1',
            wellLocation: {
              origin: 'top',
              offset: { x: 0, y: 0, z: PROBE_LENGTH_MM },
            },
          },
        },
      ])
    })
  })

  describe('retractSafelyAndHomeCommands', () => {
    it('should return retract commands for all axes followed by home command', () => {
      const result = retractSafelyAndHomeCommands()

      expect(result).toEqual([
        {
          commandType: 'retractAxis',
          params: { axis: LEFT_Z_AXIS },
        },
        {
          commandType: 'retractAxis',
          params: { axis: RIGHT_Z_AXIS },
        },
        {
          commandType: 'retractAxis',
          params: { axis: X_AXIS },
        },
        {
          commandType: 'retractAxis',
          params: { axis: Y_AXIS },
        },
        { commandType: 'home', params: { axes: 'all' } },
      ])

      expect(fullHomeCommands).toHaveBeenCalled()
    })
  })

  describe('retractPipetteAxesSequentiallyCommands', () => {
    it('should return retract commands for left pipette axes in sequence', () => {
      const mockPipette = {
        id: PIPETTE_ID,
        mount: LEFT_MOUNT,
      } as LoadedPipette

      const result = retractPipetteAxesSequentiallyCommands(mockPipette)

      expect(result).toEqual([
        {
          commandType: 'retractAxis',
          params: { axis: LEFT_Z_AXIS },
        },
        {
          commandType: 'retractAxis',
          params: { axis: X_AXIS },
        },
        {
          commandType: 'retractAxis',
          params: { axis: Y_AXIS },
        },
      ])
    })

    it('should return retract commands for right pipette axes in sequence', () => {
      const mockPipette = {
        id: PIPETTE_ID,
        mount: RIGHT_MOUNT,
      } as LoadedPipette

      const result = retractPipetteAxesSequentiallyCommands(mockPipette)

      expect(result).toEqual([
        {
          commandType: 'retractAxis',
          params: { axis: RIGHT_Z_AXIS },
        },
        {
          commandType: 'retractAxis',
          params: { axis: X_AXIS },
        },
        {
          commandType: 'retractAxis',
          params: { axis: Y_AXIS },
        },
      ])
    })

    it('should handle null pipette', () => {
      const result = retractPipetteAxesSequentiallyCommands(null)

      expect(result).toEqual([
        {
          commandType: 'retractAxis',
          params: { axis: 'rightZ' },
        },
        {
          commandType: 'retractAxis',
          params: { axis: X_AXIS },
        },
        {
          commandType: 'retractAxis',
          params: { axis: Y_AXIS },
        },
      ])
    })
  })

  describe('moveRelativeCommand', () => {
    it('should return move relative command with calculated distance', () => {
      const params = {
        pipetteId: PIPETTE_ID,
        axis: 'x' as const,
        dir: 1 as const,
        step: 0.1,
      } as any

      const result = moveRelativeCommand(params)

      expect(result).toEqual({
        commandType: 'moveRelative',
        params: {
          pipetteId: PIPETTE_ID,
          distance: 0.1,
          axis: 'x',
        },
      })
    })

    it('should calculate negative distance when direction is negative', () => {
      const params = {
        pipetteId: PIPETTE_ID,
        axis: 'z' as const,
        dir: -1 as const,
        step: 0.5,
      } as any

      const result = moveRelativeCommand(params)

      expect(result).toEqual({
        commandType: 'moveRelative',
        params: {
          pipetteId: PIPETTE_ID,
          distance: -0.5,
          axis: 'z',
        },
      })
    })
  })

  describe('moveToMaintenancePosition', () => {
    it('should return move to maintenance position command with specified mount', () => {
      const mockPipette = {
        id: PIPETTE_ID,
        mount: LEFT_MOUNT,
      } as LoadedPipette

      const result = moveToMaintenancePosition(mockPipette)

      expect(result).toEqual([
        {
          commandType: 'calibration/moveToMaintenancePosition',
          params: {
            mount: LEFT_MOUNT,
          },
        },
      ])
    })

    it('should default to left mount when pipette is null', () => {
      const result = moveToMaintenancePosition(null)

      expect(result).toEqual([
        {
          commandType: 'calibration/moveToMaintenancePosition',
          params: {
            mount: LEFT_MOUNT,
          },
        },
      ])
    })
  })

  describe('verifyProbeAttachmentAndHomeCommands', () => {
    it('should return verify tip presence and home commands for left pipette', () => {
      const mockPipette = {
        id: PIPETTE_ID,
        mount: LEFT_MOUNT,
      } as LoadedPipette

      const result = verifyProbeAttachmentAndHomeCommands(mockPipette)

      expect(result).toEqual([
        {
          commandType: 'verifyTipPresence',
          params: {
            pipetteId: PIPETTE_ID,
            expectedState: 'present',
            followSingularSensor: 'primary',
          },
        },
        {
          commandType: 'home',
          params: { axes: [LEFT_Z_AXIS, X_AXIS, Y_AXIS] },
        },
      ])
    })

    it('should return verify tip presence and home commands for right pipette', () => {
      const mockPipette = {
        id: PIPETTE_ID,
        mount: RIGHT_MOUNT,
      } as LoadedPipette

      const result = verifyProbeAttachmentAndHomeCommands(mockPipette)

      expect(result).toEqual([
        {
          commandType: 'verifyTipPresence',
          params: {
            pipetteId: PIPETTE_ID,
            expectedState: 'present',
            followSingularSensor: 'primary',
          },
        },
        {
          commandType: 'home',
          params: { axes: [RIGHT_Z_AXIS, X_AXIS, Y_AXIS] },
        },
      ])
    })

    it('should handle null pipette', () => {
      const result = verifyProbeAttachmentAndHomeCommands(null)

      expect(result).toEqual([
        {
          commandType: 'verifyTipPresence',
          params: {
            pipetteId: '',
            expectedState: 'present',
            followSingularSensor: 'primary',
          },
        },
        {
          commandType: 'home',
          params: { axes: [RIGHT_Z_AXIS, X_AXIS, Y_AXIS] },
        },
      ])
    })
  })
})
