import { renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  moduleCleanupDuringLPCCommands,
  moveLabwareOffDeckCommands,
  retractPipetteAxesSequentiallyCommands,
  savePositionCommands,
} from '../commands'
import { useHandleConfirmLwFinalPosition } from '../useHandleConfirmLwFinalPosition'

vi.mock('../commands')

describe('useHandleConfirmLwFinalPosition', () => {
  const mockSetErrorMessage = vi.fn()
  const mockChainLPCCommands = vi.fn()

  const mockProps = {
    setErrorMessage: mockSetErrorMessage,
    chainLPCCommands: mockChainLPCCommands,
    runId: 'mock_run_id',
    maintenanceRunId: 'mock_maintenance_run_id',
  } as any

  const mockPipette = {
    id: 'pipette-123',
    mount: 'left',
    pipetteName: 'mock_pipette_name',
  } as any

  const mockOffsetLocationDetails = {
    labwareId: 'labware-456',
    closestBeneathModuleId: 'module-789',
  } as any

  const mockPosition = { x: 10, y: 20, z: 30 }

  beforeEach(() => {
    vi.clearAllMocks()

    vi.mocked(savePositionCommands).mockImplementation(pipetteId => [
      {
        commandType: 'savePosition',
        params: { pipetteId },
      } as any,
    ])

    vi.mocked(retractPipetteAxesSequentiallyCommands).mockImplementation(
      pipette => [
        {
          commandType: 'retractPipetteAxesSequentially',
          params: { pipetteId: pipette?.id },
        } as any,
      ]
    )

    vi.mocked(moduleCleanupDuringLPCCommands).mockImplementation(
      offsetDetails => [
        {
          commandType: 'moduleCleanupDuringLPC',
          params: {
            closestBeneathModuleId: offsetDetails.closestBeneathModuleId,
          },
        } as any,
      ]
    )

    vi.mocked(moveLabwareOffDeckCommands).mockImplementation(offsetDetails => [
      {
        commandType: 'moveLabwareOffDeck',
        params: { labwareId: offsetDetails.labwareId },
      } as any,
    ])

    mockChainLPCCommands.mockResolvedValue([
      {
        data: {
          commandType: 'savePosition',
          result: {
            position: mockPosition,
          },
        },
      },
    ])
  })

  it('should return handleConfirmLwFinalPosition function', () => {
    const { result } = renderHook(() =>
      useHandleConfirmLwFinalPosition(mockProps)
    )

    expect(result.current).toHaveProperty('handleConfirmLwFinalPosition')
    expect(typeof result.current.handleConfirmLwFinalPosition).toBe('function')
  })

  it('should chain commands in the correct order when handleConfirmLwFinalPosition is called', async () => {
    const { result } = renderHook(() =>
      useHandleConfirmLwFinalPosition(mockProps)
    )

    const position = await result.current.handleConfirmLwFinalPosition(
      mockOffsetLocationDetails,
      mockPipette
    )

    expect(savePositionCommands).toHaveBeenCalledWith(mockPipette.id)
    expect(retractPipetteAxesSequentiallyCommands).toHaveBeenCalledWith(
      mockPipette
    )
    expect(moduleCleanupDuringLPCCommands).toHaveBeenCalledWith(
      mockOffsetLocationDetails
    )
    expect(moveLabwareOffDeckCommands).toHaveBeenCalledWith(
      mockOffsetLocationDetails
    )

    expect(mockChainLPCCommands).toHaveBeenCalledWith(
      [
        { commandType: 'savePosition', params: { pipetteId: mockPipette.id } },
        {
          commandType: 'retractPipetteAxesSequentially',
          params: { pipetteId: mockPipette.id },
        },
        {
          commandType: 'moduleCleanupDuringLPC',
          params: {
            closestBeneathModuleId:
              mockOffsetLocationDetails.closestBeneathModuleId,
          },
        },
        {
          commandType: 'moveLabwareOffDeck',
          params: { labwareId: mockOffsetLocationDetails.labwareId },
        },
      ],
      false
    )

    expect(position).toEqual(mockPosition)
  })

  it('should reject with error when command response is incorrect', async () => {
    mockChainLPCCommands.mockResolvedValueOnce([
      {
        data: {
          commandType: 'unknownCommand',
          result: null,
        },
      },
    ])

    const { result } = renderHook(() =>
      useHandleConfirmLwFinalPosition(mockProps)
    )

    await expect(
      result.current.handleConfirmLwFinalPosition(
        mockOffsetLocationDetails,
        mockPipette
      )
    ).rejects.toThrow('CheckItem failed to save final position.')

    expect(mockSetErrorMessage).toHaveBeenCalledWith(
      'CheckItem failed to save final position.'
    )
  })

  it('should reject with error when result is null', async () => {
    mockChainLPCCommands.mockResolvedValueOnce([
      {
        data: {
          commandType: 'savePosition',
          result: null,
        },
      },
    ])

    const { result } = renderHook(() =>
      useHandleConfirmLwFinalPosition(mockProps)
    )

    await expect(
      result.current.handleConfirmLwFinalPosition(
        mockOffsetLocationDetails,
        mockPipette
      )
    ).rejects.toThrow('CheckItem failed to save final position.')

    expect(mockSetErrorMessage).toHaveBeenCalledWith(
      'CheckItem failed to save final position.'
    )
  })

  it('should pass the error from chainLPCCommands if it fails', async () => {
    const mockError = new Error('Command chain failed')
    mockChainLPCCommands.mockRejectedValueOnce(mockError)

    const { result } = renderHook(() =>
      useHandleConfirmLwFinalPosition(mockProps)
    )

    await expect(
      result.current.handleConfirmLwFinalPosition(
        mockOffsetLocationDetails,
        mockPipette
      )
    ).rejects.toThrow('Command chain failed')
  })
})
